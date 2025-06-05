'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSessionStore, type GameSession } from '@/store/sessionStore';
import { useGameStore } from '@/store/gameStore';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useClock } from '@/hooks/useClock';
import type { Participant } from '@/types';
import { validateGameSession } from '@/store/sessionStore';
import { MotionDiv, AnimatePresence } from './shared/MotionComponents';
import LoadingScreen from './screens/LoadingScreen';
import WaitingScreen from './screens/WaitingScreen';
import TVRouletteScreen from './screens/TVRouletteScreen';

type RealtimeChannel = {
  on: (event: string, config: object, callback: (payload: RealtimePayload) => void) => RealtimeChannel;
  subscribe: (callback: (status: string) => void) => RealtimeChannel;
};

type SupabaseQueryBuilder = {
  select: (columns: string) => SupabaseQueryBuilder;
  in: (column: string, values: string[]) => SupabaseQueryBuilder;
  eq: (column: string, value: string) => SupabaseQueryBuilder;
  order: (column: string, options: { ascending: boolean }) => SupabaseQueryBuilder;
  limit: (count: number) => SupabaseQueryBuilder;
  maybeSingle: () => Promise<{ data: DatabaseRecord | null; error: DatabaseError | null }>;
  then: <T>(onfulfilled?: ((value: { data: DatabaseRecord[] | null; error: DatabaseError | null }) => T | PromiseLike<T>) | null) => Promise<T>;
};

type SupabaseClient = {
  channel: (name: string) => RealtimeChannel;
  removeChannel: (channel: RealtimeChannel) => void;
  from: (table: string) => SupabaseQueryBuilder;
};

type GameSessionData = {
  id: string;
  session_id: string;
  admin_id: string;
  status: 'pending_player_registration' | 'player_registered' | 'playing' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  game_data?: Record<string, unknown>;
};

type DatabaseRecord = {
  id: string;
  session_id: string;
  status: string;
  admin_id: string;
  created_at: string;
  updated_at: string;
  score?: number;
  premio_ganado?: string;
  lastquestionid?: string;
  answeredcorrectly?: boolean;
  game_data?: Record<string, unknown>;
  [key: string]: unknown;
};

type DatabaseError = {
  code?: string;
  message: string;
  [key: string]: unknown;
};

type RealtimePayload = {
  commit_timestamp?: string;
  new?: DatabaseRecord;
  old?: DatabaseRecord;
  [key: string]: unknown;
};

export default function TVScreen() {
  const { currentSession, user, setCurrentSession, setUser } = useSessionStore();
  const [realtimeReady, setRealtimeReady] = useState(false);
  const [isRealtimeConnecting, setIsRealtimeConnecting] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  
  const isMounted = useIsMounted();
  const currentTime = useClock();

  useEffect(() => {
    if (!isMounted) return;
    
    const initSupabaseClient = async () => {
      try {
        const { supabaseClient: client } = await import('@/lib/supabase');
        
        if (client) {
          setSupabaseClient(client as unknown as SupabaseClient);
        } else {
          console.error('📺 TV: ❌ Cliente Supabase no disponible después de importación');
        }
      } catch (error) {
        console.error('📺 TV: ❌ Error al importar cliente Supabase:', error);
      }
    };

    initSupabaseClient();
  }, [isMounted]);

  const initializeTVView = useCallback(async () => {
    let cleanupFunction: (() => void) | undefined;
    
    if (!supabaseClient || !isMounted) {
      console.error('Cliente de Supabase no disponible en la vista de TV o componente no montado');
      return;
    }

    if (!user) {
      setUser({
        id: 'tv-viewer',
        email: 'tv@viewer.local',
        role: 'viewer',
        name: 'TV Display'
      });
    }

    try {
      setIsRealtimeConnecting(true);
      
      const channel = supabaseClient
        .channel('tv_game_sessions_realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'game_sessions',
          },
          (payload) => {
            const { new: newRecord } = payload;

            if (newRecord) {
              try {
                const validatedSession = validateGameSession(newRecord);
                setCurrentSession(validatedSession);
              } catch (validationError) {
                console.error('📺 TV-INSERT: ❌ Error validando sesión:', validationError);
                setCurrentSession(newRecord as unknown as GameSession);
              }
            } else {
              console.warn('📺 TV-INSERT: ⚠️ Evento INSERT sin datos nuevos');
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'game_sessions',
          },
          (payload) => {
            console.log('📺 TV-UPDATE: 🔄 Evento UPDATE detectado en realtime');
            console.log('📺 TV-UPDATE: Payload completo:', JSON.stringify(payload, null, 2));
            console.log('📺 TV-UPDATE: Timestamp del evento:', payload.commit_timestamp);
            
            const { new: newRecord, old: oldRecord } = payload;

            if (newRecord) {
              console.log('📺 TV-UPDATE: ✅ Datos nuevos del registro:', newRecord);
              console.log('📺 TV-UPDATE: Session ID:', newRecord.session_id);
              console.log('📺 TV-UPDATE: Estado anterior:', oldRecord?.status || 'N/A');
              console.log('📺 TV-UPDATE: Estado nuevo:', newRecord.status);
              console.log('📺 TV-UPDATE: Admin ID:', newRecord.admin_id);
              
              if (newRecord.status === 'player_registered') {
                console.log('🎉 TV-UPDATE: ¡PARTICIPANTE REGISTRADO! Cambiando a ruleta automáticamente');
                console.log(`🎉 TV-UPDATE: Transición detectada: ${oldRecord?.status || 'N/A'} → ${newRecord.status}`);
                console.log('🎮 TV-UPDATE: Limpiando estados residuales del gameStore ANTES de mostrar ruleta...');
                
                const gameStore = useGameStore.getState();
                
                gameStore.resetPrizeFeedback();
                gameStore.setCurrentQuestion(null);
                gameStore.setLastSpinResultIndex(null);
                gameStore.setGameState('roulette');
                
                console.log('🎮 TV-UPDATE: Estados del gameStore limpiados - gameState forzado a \'roulette\'');
                
                console.log('🔍 TV-UPDATE: Cargando participante activo para la sesión...');
                
                const currentParticipantInStore = gameStore.currentParticipant;
                if (currentParticipantInStore && currentParticipantInStore.status === 'registered') {
                  console.log('🔍 TV-UPDATE: Ya hay un participante registrado en el store, omitiendo carga');
                  console.log('🔍 TV-UPDATE: Participante actual:', currentParticipantInStore.nombre);
                  return;
                }
                
                const loadCurrentParticipant = async (retryCount = 0) => {
                  const maxRetries = 5;
                  const baseDelay = 200;
                  
                  try {
                    console.log(`🔍 TV-UPDATE: Intento ${retryCount + 1}/${maxRetries + 1} - Buscando participante registrado...`);
                    
                    const result = await supabaseClient
                      .from('participants')
                      .select('*')
                      .eq('session_id', newRecord.session_id)
                      .eq('status', 'registered')
                      .order('created_at', { ascending: false })
                      .limit(1)
                      .maybeSingle();
                      
                    if (result.error && result.error.code !== 'PGRST116') {
                      console.error('🔍 TV-UPDATE: Error cargando participante activo:', result.error);
                      return;
                    }
                    
                    if (result.data) {
                      console.log('🔍 TV-UPDATE: ✅ Participante registrado encontrado:', {
                        nombre: result.data.nombre,
                        email: result.data.email,
                        id: result.data.id,
                        status: result.data.status,
                        intento: retryCount + 1
                      });
                      gameStore.setCurrentParticipant(result.data as unknown as Participant);
                      console.log('🔍 TV-UPDATE: ✅ Participante cargado exitosamente en gameStore');
                      return;
                    } else {
                      if (retryCount < maxRetries) {
                        const delay = baseDelay * Math.pow(2, retryCount);
                        console.warn(`🔍 TV-UPDATE: No se encontró participante registrado (intento ${retryCount + 1}/${maxRetries + 1})`);
                        console.warn(`🔍 TV-UPDATE: Reintentando en ${delay}ms... (posible race condition)`);
                        
                        setTimeout(() => loadCurrentParticipant(retryCount + 1), delay);
                      } else {
                        console.error('🔍 TV-UPDATE: ❌ FALLO TOTAL: No se encontró participante después de todos los reintentos');
                        console.error('🔍 TV-UPDATE: Esto impedirá que la TV cambie a ruleta automáticamente');
                      }
                    }
                  } catch (error) {
                    console.error('🔍 TV-UPDATE: Error en consulta de participante activo:', error);
                    
                    if (retryCount < maxRetries) {
                      const delay = baseDelay * Math.pow(2, retryCount);
                      console.warn(`🔍 TV-UPDATE: Reintentando consulta en ${delay}ms debido a error...`);
                      setTimeout(() => loadCurrentParticipant(retryCount + 1), delay);
                    }
                  }
                };
                
                loadCurrentParticipant();
              }

              if ((oldRecord?.status === 'player_registered' || oldRecord?.status === 'playing' || oldRecord?.status === 'completed') && 
                  newRecord.status === 'pending_player_registration') {
                console.log('🔄 TV-UPDATE: ¡SESIÓN PREPARADA PARA SIGUIENTE PARTICIPANTE! Volviendo a WaitingScreen');
                console.log('🔄 TV-UPDATE: Estado anterior:', oldRecord?.status, '→ pending_player_registration');
                
                const gameStore = useGameStore.getState();
                gameStore.resetPrizeFeedback();
                gameStore.setCurrentQuestion(null);
                gameStore.setLastSpinResultIndex(null);
                gameStore.setCurrentParticipant(null);
                gameStore.setGameState('screensaver');
                
                console.log('�� TV-UPDATE: Estados del gameStore limpiados incluyendo currentParticipant - gameState establecido a \'screensaver\' para waiting');
              }
              
              try {
                const validatedSession = validateGameSession(newRecord);
                console.log('📺 TV-UPDATE: ✅ Sesión validada exitosamente');
                console.log('📺 TV-UPDATE: Actualizando estado de la TV a:', validatedSession.status);
                setCurrentSession(validatedSession);
                
                const gameStore = useGameStore.getState();
                console.log('📺 TV-UPDATE: Sincronizando gameStore con sessionStore...');
                gameStore.setGameSession({
                  id: validatedSession.session_id,
                  session_id: validatedSession.session_id,
                  admin_id: validatedSession.admin_id,
                  status: validatedSession.status,
                  created_at: validatedSession.created_at,
                  updated_at: validatedSession.updated_at,
                  game_data: validatedSession.game_data || undefined
                });
                console.log('📺 TV-UPDATE: gameSession sincronizado exitosamente');
                
                if (validatedSession.status === 'player_registered' || validatedSession.status === 'playing') {
                  console.log('🎮 TV-UPDATE: ¡Estado de juego detectado! La TV debería cambiar a ruleta automáticamente');
                }
              } catch (validationError) {
                console.error('📺 TV-UPDATE: ❌ Error validando sesión:', validationError);
                console.log('📺 TV-UPDATE: 🔄 Usando datos directamente como fallback');
                setCurrentSession(newRecord as unknown as GameSession);
                
                const gameStore = useGameStore.getState();
                gameStore.setGameSession(newRecord as unknown as GameSessionData);
              }
            } else {
              console.warn('📺 TV-UPDATE: ⚠️ Evento UPDATE sin datos nuevos');
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'game_sessions',
          },
          () => {
            setCurrentSession(null);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ TV-REALTIME: Suscripción activa y lista para recibir eventos');
            console.log('✅ TV-REALTIME: Escuchando eventos: INSERT, UPDATE, DELETE en tabla game_sessions');
            setRealtimeReady(true);
            setIsRealtimeConnecting(false);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ TV-REALTIME: Error en canal realtime');
            setRealtimeReady(false);
            setIsRealtimeConnecting(false);
          } else if (status === 'CLOSED') {
            console.warn('⚠️ TV-REALTIME: Canal cerrado');
            setRealtimeReady(false);
            setIsRealtimeConnecting(true);
          } else {
            setIsRealtimeConnecting(true);
          }
        });

      cleanupFunction = () => {
        supabaseClient.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error al inicializar realtime específico para TV:', error);
      setRealtimeReady(false);
      setIsRealtimeConnecting(false);
      cleanupFunction = () => {};
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        try {
          const debugResult = await supabaseClient
            .from('game_sessions')
            .select('session_id, status, updated_at')
            .order('updated_at', { ascending: false })
            .limit(5);
            
          if (!debugResult.error && debugResult.data) {
            debugResult.data?.forEach(() => {
            });
          }
        } catch (debugError) {
          console.error('📺 TV-DEBUG: Error en consulta de debug:', debugError);
        }
      }
      
      const result = await supabaseClient
        .from('game_sessions')
        .select('*')
        .in('status', ['pending_player_registration', 'player_registered', 'playing'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (result.error?.code && result.error?.code !== 'PGRST116') {
        console.error('📺 TV: Error cargando sesión activa:', result.error);
        return cleanupFunction;
      }

      if (result.data) {
        console.log('📺 TV: Sesión activa encontrada:', result.data);
        console.log('📺 TV: ID de sesión:', result.data.session_id);
        console.log('📺 TV: Estado de sesión:', result.data.status);
        
        try {
          const validatedSession = validateGameSession(result.data);
          setCurrentSession(validatedSession);
          
          const gameStore = useGameStore.getState();
          console.log('📺 TV-INIT: Sincronizando gameStore con sesión inicial...');
          gameStore.setGameSession({
            id: validatedSession.session_id,
            session_id: validatedSession.session_id,
            admin_id: validatedSession.admin_id,
            status: validatedSession.status,
            created_at: validatedSession.created_at,
            updated_at: validatedSession.updated_at,
            game_data: validatedSession.game_data || undefined
          });
          console.log('📺 TV-INIT: gameSession sincronizado exitosamente en inicialización');
          
          if (validatedSession.status === 'player_registered' || validatedSession.status === 'playing') {
            console.log('📺 TV-INIT: Sesión tiene participante activo, cargando participante...');
            
            const loadInitialParticipant = async (retryCount = 0) => {
              const maxRetries = 3;
              const baseDelay = 300;
              
              try {
                console.log(`📺 TV-INIT: Intento ${retryCount + 1}/${maxRetries + 1} - Cargando participante inicial...`);
                
                const participantResult = await supabaseClient
                  .from('participants')
                  .select('*')
                  .eq('session_id', validatedSession.session_id)
                  .eq('status', 'registered')
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                  
                if (participantResult.error && participantResult.error.code !== 'PGRST116') {
                  console.error('📺 TV-INIT: Error cargando participante inicial:', participantResult.error);
                  return;
                }
                
                if (participantResult.data) {
                  console.log('📺 TV-INIT: ✅ Participante inicial encontrado:', {
                    nombre: participantResult.data.nombre,
                    email: participantResult.data.email,
                    id: participantResult.data.id,
                    status: participantResult.data.status,
                    intento: retryCount + 1
                  });
                  gameStore.setCurrentParticipant(participantResult.data as unknown as Participant);
                  console.log('📺 TV-INIT: ✅ Participante inicial cargado exitosamente en gameStore');
                  return;
                } else {
                  if (retryCount < maxRetries) {
                    const delay = baseDelay * Math.pow(1.5, retryCount);
                    console.warn(`📺 TV-INIT: No se encontró participante (intento ${retryCount + 1}/${maxRetries + 1})`);
                    console.warn(`📺 TV-INIT: Reintentando en ${delay}ms...`);
                    setTimeout(() => loadInitialParticipant(retryCount + 1), delay);
                  } else {
                    console.warn('📺 TV-INIT: No se encontró participante registrado después de todos los reintentos');
                  }
                }
              } catch (error) {
                console.error('📺 TV-INIT: Error en consulta de participante inicial:', error);
                if (retryCount < maxRetries) {
                  const delay = baseDelay * Math.pow(1.5, retryCount);
                  setTimeout(() => loadInitialParticipant(retryCount + 1), delay);
                }
              }
            };
            
            loadInitialParticipant();
          }
        } catch (validationError) {
          console.error('📺 TV: Error validando sesión:', validationError);
          setCurrentSession(result.data as unknown as GameSession);
          
          const gameStore = useGameStore.getState();
          gameStore.setGameSession(result.data as unknown as GameSessionData);
        }
      } else {
        setCurrentSession(null);
      }
    } catch (error) {
      console.error('📺 TV: Error al cargar sesión activa:', error);
    }
    
    return cleanupFunction;
  }, [isMounted, supabaseClient, user, setCurrentSession, setUser]);

  useEffect(() => {
    if (!isMounted || !supabaseClient) return;
    
    let cleanupFunction: (() => void) | undefined;

    const runInitialization = async () => {
      cleanupFunction = await initializeTVView();
    };

    runInitialization();

    return () => {
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, [isMounted, supabaseClient, initializeTVView]);

  useEffect(() => {
    if (!isMounted || !supabaseClient) return;
    
    if (realtimeReady) {
      return;
    }

    const checkForUpdates = async () => {
      try {
        const result = await supabaseClient
          .from('game_sessions')
          .select('*')
          .in('status', ['pending_player_registration', 'player_registered', 'playing'])
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!result.error && result.data) {
          if (!currentSession || 
              currentSession.session_id !== result.data.session_id || 
              currentSession.status !== result.data.status ||
              currentSession.updated_at !== result.data.updated_at) {
            
            try {
              const validatedSession = validateGameSession(result.data);
              setCurrentSession(validatedSession);
              
              if (validatedSession.status === 'player_registered' || validatedSession.status === 'playing') {
                console.log('📺 TV (Polling): Sesión con participante detectada, cargando participante...');
                
                const loadPollingParticipant = async () => {
                  try {
                    console.log('📺 TV (Polling): Cargando participante registrado...');
                    
                    const participantResult = await supabaseClient
                      .from('participants')
                      .select('*')
                      .eq('session_id', validatedSession.session_id)
                      .eq('status', 'registered')
                      .order('created_at', { ascending: false })
                      .limit(1)
                      .maybeSingle();
                      
                    if (participantResult.error && participantResult.error.code !== 'PGRST116') {
                      console.error('📺 TV (Polling): Error cargando participante:', participantResult.error);
                      return;
                    }
                    
                    if (participantResult.data) {
                      console.log('📺 TV (Polling): ✅ Participante encontrado:', {
                        nombre: participantResult.data.nombre,
                        email: participantResult.data.email,
                        id: participantResult.data.id,
                        status: participantResult.data.status
                      });
                      
                      const gameStore = useGameStore.getState();
                      gameStore.setCurrentParticipant(participantResult.data as unknown as Participant);
                      console.log('📺 TV (Polling): ✅ Participante cargado exitosamente en gameStore');
                    } else {
                      console.warn('📺 TV (Polling): No se encontró participante registrado para la sesión');
                    }
                  } catch (error) {
                    console.error('📺 TV (Polling): Error en consulta de participante:', error);
                  }
                };
                
                loadPollingParticipant();
              }
            } catch (validationError) {
              console.error('📺 TV (Polling): Error validando sesión:', validationError);
              setCurrentSession(result.data as unknown as GameSession);
            }
          }
        } else if (!result.data) {
          if (currentSession) {
            setCurrentSession(null);
          }
        }
      } catch (error) {
        console.error('📺 TV (Polling): Error verificando actualizaciones:', error);
      }
    };

    const pollingInterval = setInterval(checkForUpdates, 3000);

    return () => {
      clearInterval(pollingInterval);
    };
  }, [realtimeReady, currentSession?.session_id, currentSession?.status, currentSession?.updated_at, setCurrentSession, isMounted, supabaseClient, currentSession]);

  useEffect(() => {
    if (!isMounted) return;
    
    if (currentSession) {
      console.log('📺 TV-STATE: Sesión activa detectada');
      console.log('   Session ID:', currentSession.session_id.substring(0, 8) + '...');
      console.log('   Estado:', currentSession.status);
      // NOTA: participant_id ya no se maneja en game_sessions
      
      switch (currentSession.status) {
        case 'player_registered':
          console.log('🎮 TV-STATE: ¡Participante registrado! Mostrando ruleta');
          break;
        case 'playing':
          console.log('🎮 TV-STATE: Juego en progreso, mostrando ruleta');
          break;
        case 'completed':
          console.log('🏁 TV-STATE: Juego completado');
          break;
        case 'pending_player_registration':
          console.log('⏳ TV-STATE: Esperando registro de participante, mostrando WaitingScreen');
          break;
        default:
          console.log('❓ TV-STATE: Estado desconocido:', currentSession.status);
          break;
      }
    } else {
      console.log('📺 TV-STATE: No hay sesión activa, mostrando WaitingScreen');
    }
  }, [currentSession, isMounted]);

  // [modificación] Determinar qué pantalla mostrar según el estado (simplificado)
  const renderScreen = () => {
    if (!isMounted) {
      // [modificación] Renderizar pantalla de carga mientras no esté montado
      return <LoadingScreen />;
    }

    // [modificación] Obtener gameState del gameStore para manejar "volver al inicio"
    const gameState = useGameStore.getState().gameState;
    
    // [modificación] Si gameState es 'screensaver', mostrar WaitingScreen independientemente de la sesión
    if (gameState === 'screensaver') {
      return <WaitingScreen />;
    }

    if (!currentSession) {
      return <WaitingScreen />;
    }

    // [modificación] Flujo mejorado: WaitingScreen → TVRouletteScreen → GameCompleted
    switch (currentSession.status) {
      case 'pending_player_registration':
        return <WaitingScreen />;
      
      case 'player_registered':
        return <TVRouletteScreen />;
      
      case 'playing':
        return <TVRouletteScreen />;
      
      case 'completed':
      case 'archived':
        // [modificación] Cuando se completa, volver a waiting room después de un tiempo
        setTimeout(() => {
          setCurrentSession(null);
        }, 5000);
        return <GameCompletedScreen currentSession={currentSession} />;
      
      default:
        return <WaitingScreen />;
    }
  };

  // [modificación] No renderizar nada hasta que esté montado para evitar errores de hidratación
  if (!isMounted) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-main-gradient relative overflow-hidden">
      {/* [modificación] Contenido principal */}
      <div className="relative z-10">
        {isMounted && (
          <AnimatePresence mode="wait">
            {renderScreen()}
          </AnimatePresence>
        )}
      </div>

      {/* [modificación] Información del usuario optimizada para TV 4K */}
      {user && isMounted && (
        <div className="absolute top-6 right-6 text-white/70 text-lg"> {/* [modificación] Texto más grande y mejor posicionamiento */}
          <p>Usuario: {user.email}</p>
          <p>Rol: {user.role === 'viewer' ? 'TV' : 'Admin'}</p>
          {/* [modificación] Mostrar estado de conexión realtime más grande */}
          <div className="flex items-center mt-3"> {/* [modificación] Más margen superior */}
            <div className={`w-4 h-4 rounded-full mr-3 ${ // [modificación] Indicador más grande
              realtimeReady ? 'bg-green-400' : 
              isRealtimeConnecting ? 'bg-yellow-400' : 'bg-red-400'
            }`}></div>
            <span className="text-base"> {/* [modificación] Texto más grande */}
              {realtimeReady ? 'Conectado' : 
               isRealtimeConnecting ? 'Conectando...' : 'Desconectado'}
            </span>
          </div>
        </div>
      )}

      {/* [modificación] Debug info optimizado para TV 4K */}
      {process.env.NODE_ENV === 'development' && isMounted && (
        <div className="absolute bottom-6 left-6 bg-black/90 text-white text-base p-6 rounded-xl max-w-lg border border-white/30"> {/* [modificación] Texto más grande y padding aumentado */}
          <h4 className="font-bold mb-3 text-green-400 text-lg">📺 TV Debug Info</h4> {/* [modificación] Título más grande */}
          <div className="space-y-2"> {/* [modificación] Más espacio entre líneas */}
            <p><span className="text-blue-400">Usuario:</span> {user ? `${user.name} (${user.role})` : 'No configurado'}</p>
            <p><span className="text-blue-400">Sesión actual:</span> {currentSession ? `${currentSession.session_id.substring(0,8)}... - ${currentSession.status}` : 'Ninguna'}</p>
            {/* NOTA: participant_id ya no se maneja en game_sessions */}
            <p><span className="text-blue-400">Última actualización:</span> {currentSession?.updated_at ? new Date(currentSession.updated_at).toLocaleTimeString() : 'N/A'}</p>
            <p><span className="text-blue-400">Tiempo actual:</span> {currentTime?.toLocaleTimeString() || 'N/A'}</p>
            <p><span className="text-blue-400">Realtime:</span> 
              <span className={`ml-1 ${realtimeReady ? 'text-green-400' : isRealtimeConnecting ? 'text-yellow-400' : 'text-red-400'}`}>
                {realtimeReady ? '✅ Activo' : isRealtimeConnecting ? '🔄 Conectando' : '❌ Inactivo'}
              </span>
            </p>
            
            <button 
              onClick={async () => {
                await initializeTVView();
              }}
              className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-base mr-3"
            >
              🔄 Refrescar
            </button>
            
            <button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/admin/sessions/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ adminId: 'tv_quick_create' }),
                  });
                  
                  if (response.ok) {
                    const data = await response.json();
                    const sessionId = data.sessionId || data.session?.session_id;
                    if (sessionId) {
                      const fullUrl = `${window.location.origin}/register/${sessionId}`;
                      await navigator.clipboard.writeText(fullUrl);
                      alert(`Nueva sesión creada!\nURL copiado al portapapeles:\n${fullUrl.substring(0,50)}...`);
                      setTimeout(() => initializeTVView(), 1000);
                    }
                  }
                } catch (error) {
                  console.error('📺 TV: Error creando sesión:', error);
                }
              }}
              className="mt-3 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-base mr-3"
            >
              ⚡ Nueva Sesión
            </button>
            
            {currentSession && (
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/sessions/reset-player', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        sessionId: currentSession.session_id,
                        adminId: currentSession.admin_id || 'tv_reset' 
                      }),
                    });
                    
                    if (response.ok) {
                      const data = await response.json();
                      void data;
                      const fullUrl = `${window.location.origin}/register/${currentSession.session_id}`;
                      await navigator.clipboard.writeText(fullUrl);
                      alert(`Sesión reseteada exitosamente!\nURL copiado al portapapeles:\n${fullUrl.substring(0,50)}...`);
                      setTimeout(() => initializeTVView(), 1000);
                    } else {
                      const errorData = await response.json();
                      console.error('📺 TV: Error reseteando sesión:', errorData);
                      alert(`Error al resetear sesión: ${errorData.message}`);
                    }
                  } catch (error) {
                    console.error('📺 TV: Error reseteando sesión:', error);
                    alert(`Error al resetear sesión: ${error}`);
                  }
                }}
                className="mt-3 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-base mr-3"
              >
                🔄 Resetear Sesión Actual
              </button>
            )}
            
            <button 
              onClick={async () => {
                if (!supabaseClient) {
                  console.error('🔍 TV-DIAGNOSTICO: Cliente Supabase no disponible');
                  return;
                }
                
                try {
                  try {
                    const allResult = await supabaseClient
                      .from('game_sessions')
                      .select('*')
                      .order('updated_at', { ascending: false });
                    
                    if (allResult.error) {
                      console.error('🔍 TV-DIAGNOSTICO: Error en consulta 1:', allResult.error);
                    }
                  } catch (error1) {
                    console.error('🔍 TV-DIAGNOSTICO: Error en consulta 1:', error1);
                  }
                  
                  try {
                    const activeResult = await supabaseClient
                      .from('game_sessions')
                      .select('*')
                      .in('status', ['pending_player_registration', 'player_registered', 'playing'])
                      .order('updated_at', { ascending: false });
                    
                    if (activeResult.error) {
                      console.error('🔍 TV-DIAGNOSTICO: Error en consulta 2:', activeResult.error);
                    }
                  } catch (error2) {
                    console.error('🔍 TV-DIAGNOSTICO: Error en consulta 2:', error2);
                  }
                  
                  try {
                    const specificResult = await supabaseClient
                      .from('game_sessions')
                      .select('*')
                      .eq('session_id', '34162bb4-7bc8-497f-add5-cbfc13dfc658')
                      .order('updated_at', { ascending: false });
                    
                    if (specificResult.error) {
                      console.error('🔍 TV-DIAGNOSTICO: Error en consulta 3:', specificResult.error);
                    }
                  } catch (error3) {
                    console.error('🔍 TV-DIAGNOSTICO: Error en consulta 3:', error3);
                  }
                } catch (error) {
                  console.error('🔍 TV-DIAGNOSTICO: Error durante diagnóstico:', error);
                }
              }}
              className="mt-3 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-base mr-3"
            >
              🔍 Diagnóstico DB
            </button>
            
            <button 
              onClick={() => {
                const testSession = {
                  id: 'test-' + Date.now(),
                  session_id: 'test-session-' + Date.now(),
                  status: 'player_registered' as const,
                  admin_id: 'test-admin',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                setCurrentSession(testSession);
              }}
              className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-base"
            >
              🧪 Test Participante
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// [modificación] Pantalla cuando el juego termina (única pantalla adicional que se mantiene)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function GameCompletedScreen(_props: { currentSession: GameSession }) {
  const isMounted = useIsMounted(); // [modificación] Hook para verificar si está montado

  if (!isMounted) {
    return <LoadingScreen />;
  }

  return (
    <MotionDiv
      key="game-completed"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex flex-col items-center justify-center min-h-screen text-center px-8"
    >
      {/* Celebración */}
      <MotionDiv
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="mb-12"
      >
        <MotionDiv
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-9xl mb-6"
        >
          🎉
        </MotionDiv>
        <h1 className="text-7xl font-bold text-white mb-4">
          ¡Juego Completado!
        </h1>
      </MotionDiv>

      {/* Resultados */}
      <MotionDiv
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-3xl p-12 max-w-3xl border border-purple-400/30"
      >
        {/* TODO: Implementar consulta a tabla participants para mostrar datos del participante */}
        <div className="mb-8">
          <h2 className="text-4xl font-semibold text-purple-300 mb-2">
            Felicitaciones
          </h2>
          <p className="text-3xl text-white font-bold">
            ¡Juego completado exitosamente!
          </p>
        </div>

        {/* Información de resultados removida - debe obtenerse desde tabla participants/plays */}

        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-8 text-white/70"
        >
          <p className="text-xl">¡Gracias por participar!</p>
          <p className="text-lg mt-2">Volviendo a la sala de espera...</p>
        </MotionDiv>
      </MotionDiv>
    </MotionDiv>
  );
} 
