'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSessionStore, type GameSession } from '@/store/sessionStore';
import { useGameStore } from '@/store/gameStore';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useClock } from '@/hooks/useClock';
import type { Participant } from '@/types';
import { validateGameSession } from '@/store/sessionStore';
import { supabaseClient } from '@/lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { MotionDiv, AnimatePresence } from './shared/MotionComponents';
import LoadingScreen from './screens/LoadingScreen';
import WaitingScreen from './screens/WaitingScreen';
import TVRouletteScreen from './screens/TVRouletteScreen';



type DatabaseRecord = {
  id: string;
  session_id: string;
  status: string;
  admin_id?: string;
  created_at: string;
  updated_at: string;
  // Campos específicos de participantes
  nombre?: string;
  apellido?: string;
  email?: string;
  especialidad?: string;
  // Campos específicos de sesiones/juegos
  score?: number;
  premio_ganado?: string;
  lastquestionid?: string;
  answeredcorrectly?: boolean;
  game_data?: Record<string, unknown>;
  [key: string]: unknown;
};





export default function TVScreen() {
  const isMounted = useIsMounted();
  const currentTime = useClock();
  // ⚠️ SOLUCIONADO: Simplificar selector para evitar ciclo infinito en Zustand
  const user = useSessionStore((state) => state.user);
  // ⚠️ REMOVIDO: const gameStore = useGameStore(); para evitar ciclo infinito
  // Usar useGameStore.getState() cuando sea necesario
  
  // Estados principales
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [realtimeReady, setRealtimeReady] = useState(false);
  const [isRealtimeConnecting, setIsRealtimeConnecting] = useState(false);

  // [optimización] Estados para manejo de suscripciones múltiples y eliminación de race conditions
  const [, setIsParticipantLoading] = useState(false);
  const isParticipantLoadingRef = useRef(false);
  const loadCurrentParticipantRef = useRef<((sessionId: string) => Promise<void>) | null>(null);
  const handleParticipantEventRef = useRef<((payload: RealtimePostgresChangesPayload<DatabaseRecord>) => void) | null>(null);
  const handleSessionEventRef = useRef<((payload: RealtimePostgresChangesPayload<DatabaseRecord>) => void) | null>(null);
  const initializeTVViewRef = useRef<(() => Promise<() => void>) | null>(null);

  // [SOLUCIONADO] Función centralizada para cargar participantes SIN reintentos
  const loadCurrentParticipant = useCallback(async (sessionId: string): Promise<Participant | null> => {
    if (!supabaseClient) return null;
    
    // ⚠️ SOLUCIONADO: Usar ref para evitar dependencia reactiva que causaría ciclo infinito
    if (isParticipantLoadingRef.current) return null;
    setIsParticipantLoading(true);
    isParticipantLoadingRef.current = true;
    
    try {
      console.log('🔍 TV-OPTIMIZED: Carga única de participante para sesión:', sessionId);
                    
      const result = await supabaseClient
        .from('participants')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'registered')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
                      
      if (result.error && result.error.code !== 'PGRST116') {
        console.error('🔍 TV-OPTIMIZED: Error cargando participante:', result.error);
        return null;
      }
                    
      if (result.data) {
        console.log('🔍 TV-OPTIMIZED: ✅ Participante encontrado inmediatamente:', {
          nombre: result.data.nombre,
          email: result.data.email,
          id: result.data.id,
          status: result.data.status
        });
        
        const participant = result.data as unknown as Participant;
        // ⚠️ SOLUCIONADO: Usar getState() para evitar dependencia reactiva
        useGameStore.getState().setCurrentParticipant(participant);
        return participant;
      } else {
        console.log('🔍 TV-OPTIMIZED: Participante no encontrado - esperando evento realtime');
        return null;
      }
    } catch (error) {
      console.error('🔍 TV-OPTIMIZED: Error en consulta:', error);
      return null;
    } finally {
      setIsParticipantLoading(false);
      isParticipantLoadingRef.current = false;
    }
  }, []); // ⚠️ SOLUCIONADO: Array vacío para evitar recreación del callback y ciclo infinito

  // [SOLUCIONADO] Manejador de eventos de participantes
  // ⚠️ REMOVIDO: currentSession y gameStore de dependencias para evitar ciclo infinito
  const handleParticipantEvent = useCallback((payload: RealtimePostgresChangesPayload<DatabaseRecord>) => {
    const { eventType, new: newRecord } = payload;
    
    console.log('👤 TV-PARTICIPANT: Evento de participante detectado:', eventType);
    
    // Type guard seguro para evitar errores de TypeScript
    if (newRecord && typeof newRecord === 'object' && 'id' in newRecord) {
      const record = newRecord as DatabaseRecord;
      console.log('👤 TV-PARTICIPANT: Datos del participante:', {
        id: record.id,
        nombre: record.nombre,
        status: record.status,
        session_id: record.session_id
      });
      
      if (eventType === 'INSERT' && record.status === 'registered') {
        // ⚠️ REMOVIDO: getCurrentSession ya no es necesario
        
        // Por simplicidad, aceptar cualquier participante registrado
        console.log('👤 TV-PARTICIPANT: ✅ Nuevo participante registrado detectado via realtime');
        console.log('👤 TV-PARTICIPANT: Auto-cargando participante sin polling ni reintentos');
        
        const participant = record as unknown as Participant;
        // ⚠️ SOLUCIONADO: Usar getState() para evitar dependencia reactiva
        const gameStore = useGameStore.getState();
        gameStore.setCurrentParticipant(participant);
        gameStore.setGameState('roulette');
      }
      
      if (eventType === 'UPDATE' && record.status === 'completed') {
        console.log('👤 TV-PARTICIPANT: Participante completado detectado via realtime');
        console.log('👤 TV-PARTICIPANT: Limpiando participante del store');
        // ⚠️ SOLUCIONADO: Usar getState() para evitar dependencia reactiva
        useGameStore.getState().setCurrentParticipant(null);
      }
    }
  }, []); // ⚠️ SOLUCIONADO: Array vacío para evitar recreación del callback

  // [SOLUCIONADO] Manejador de eventos de sesiones (simplificado)
  // ⚠️ REMOVIDO: gameStore y loadCurrentParticipant de dependencias para evitar ciclo infinito
  const handleSessionEvent = useCallback((payload: RealtimePostgresChangesPayload<DatabaseRecord>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    console.log('📺 TV-SESSION: Evento de sesión detectado:', eventType);
    
    // Type guard seguro para evitar errores de TypeScript
    if (newRecord && typeof newRecord === 'object' && 'session_id' in newRecord) {
      const record = newRecord as DatabaseRecord;
      const oldRecordTyped = oldRecord as Partial<DatabaseRecord> | undefined;
      
      console.log('📺 TV-SESSION: Datos de la sesión:', {
        session_id: record.session_id,
        status: record.status,
        old_status: oldRecordTyped?.status
      });
      
      if (eventType === 'UPDATE') {
        try {
          const validatedSession = validateGameSession(record);
          setCurrentSession(validatedSession);
          
          // ⚠️ SOLUCIONADO: Usar getState() para evitar dependencia reactiva
          const gameStore = useGameStore.getState();
          
          // [optimización] Lógica simplificada sin reintentos
          if (record.status === 'player_registered') {
            console.log('📺 TV-SESSION: Sesión marcada como player_registered');
            console.log('📺 TV-SESSION: La detección del participante se hará via canal participants');
            
            // Limpiar estados residuales
            gameStore.resetPrizeFeedback();
            gameStore.setCurrentQuestion(null);
            gameStore.setLastSpinResultIndex(null);
            gameStore.setGameState('roulette');
            
            // ⚠️ SOLUCIONADO: Llamar función usando ref estable para evitar dependencia
            setTimeout(async () => {
              if (loadCurrentParticipantRef.current) {
                await loadCurrentParticipantRef.current(validatedSession.session_id);
              }
            }, 500);
          }
          
          if ((oldRecordTyped?.status === 'player_registered' || oldRecordTyped?.status === 'playing' || oldRecordTyped?.status === 'completed') && 
              record.status === 'pending_player_registration') {
            console.log('📺 TV-SESSION: Sesión preparada para siguiente participante');
            
            // Limpiar todo para volver a waiting screen
            gameStore.resetPrizeFeedback();
            gameStore.setCurrentQuestion(null);
            gameStore.setLastSpinResultIndex(null);
            gameStore.setCurrentParticipant(null);
            gameStore.setGameState('screensaver');
          }
          
        } catch (validationError) {
          console.error('📺 TV-SESSION: Error validando sesión:', validationError);
        }
      }
    }
  }, []); // ⚠️ SOLUCIONADO: Array vacío para evitar recreación del callback

    // [optimización] Inicialización con doble suscripción
  const initializeTVView = useCallback(async () => {
    if (!supabaseClient || !isMounted) return () => {};

    console.log('📺 TV-INIT: Iniciando vista de TV optimizada...');
            setIsRealtimeConnecting(true);

    let cleanupFunction = () => {};

    try {
      // 1. Cargar sesión inicial
      const result = await supabaseClient
        .from('game_sessions')
        .select('*')
        .in('status', ['pending_player_registration', 'player_registered', 'playing'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (result.error?.code && result.error?.code !== 'PGRST116') {
        console.error('📺 TV-INIT: Error cargando sesión activa:', result.error);
        return cleanupFunction;
      }

      if (result.data) {
        try {
          const validatedSession = validateGameSession(result.data);
          setCurrentSession(validatedSession);
          
          console.log('📺 TV-INIT: Sesión inicial cargada:', {
            sessionId: validatedSession.session_id,
            status: validatedSession.status
          });
          
          // Cargar participante si la sesión ya tiene uno registrado
          if (validatedSession.status === 'player_registered' || validatedSession.status === 'playing') {
            console.log('📺 TV-INIT: Cargando participante inicial...');
            if (loadCurrentParticipantRef.current) {
              await loadCurrentParticipantRef.current(validatedSession.session_id);
            }
          }
        } catch (validationError) {
          console.error('📺 TV-INIT: Error validando sesión:', validationError);
          setCurrentSession(result.data as unknown as GameSession);
        }
      }

      // 2. Configurar suscripción a game_sessions
      const sessionsChannel = supabaseClient
        .channel('tv_game_sessions')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'game_sessions',
          },
          (payload) => {
            if (handleSessionEventRef.current) {
              handleSessionEventRef.current(payload as RealtimePostgresChangesPayload<DatabaseRecord>);
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
            console.log('📺 TV-SESSION: Sesión eliminada');
            setCurrentSession(null);
          }
        );

      // 3. Configurar suscripción a participants (NUEVA OPTIMIZACIÓN)
      const participantsChannel = supabaseClient
        .channel('tv_participants')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'participants',
          },
          (payload) => {
            if (handleParticipantEventRef.current) {
              handleParticipantEventRef.current(payload as RealtimePostgresChangesPayload<DatabaseRecord>);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'participants',
          },
          (payload) => {
            if (handleParticipantEventRef.current) {
              handleParticipantEventRef.current(payload as RealtimePostgresChangesPayload<DatabaseRecord>);
            }
          }
        );

      // 4. Suscribir ambos canales
      let subscriptionsReady = 0;
      const totalSubscriptions = 2;

      const checkAllReady = () => {
        subscriptionsReady++;
        if (subscriptionsReady === totalSubscriptions) {
          console.log('✅ TV-REALTIME: Todas las suscripciones activas (sessions + participants)');
          setRealtimeReady(true);
          setIsRealtimeConnecting(false);
        }
      };

      sessionsChannel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ TV-REALTIME: Suscripción a game_sessions activa');
          checkAllReady();
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ TV-REALTIME: Error en canal game_sessions');
          setRealtimeReady(false);
          setIsRealtimeConnecting(false);
        } else if (status === 'CLOSED') {
          console.warn('⚠️ TV-REALTIME: Canal game_sessions cerrado');
          setRealtimeReady(false);
          setIsRealtimeConnecting(true);
        }
      });

      participantsChannel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ TV-REALTIME: Suscripción a participants activa');
          checkAllReady();
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ TV-REALTIME: Error en canal participants');
          setRealtimeReady(false);
          setIsRealtimeConnecting(false);
        } else if (status === 'CLOSED') {
          console.warn('⚠️ TV-REALTIME: Canal participants cerrado');
          setRealtimeReady(false);
          setIsRealtimeConnecting(true);
        }
      });

      cleanupFunction = () => {
        console.log('📺 TV-CLEANUP: Limpiando canales realtime');
        supabaseClient.removeChannel(sessionsChannel);
        supabaseClient.removeChannel(participantsChannel);
      };

    } catch (error) {
      console.error('📺 TV-INIT: Error al inicializar:', error);
      setRealtimeReady(false);
      setIsRealtimeConnecting(false);
      cleanupFunction = () => {};
    }
    
    return cleanupFunction;
  }, [isMounted]); // ⚠️ SOLUCIONADO: Removido callbacks para evitar ciclo infinito

  // Asignar funciones a refs para uso en callbacks sin dependencias
  useEffect(() => {
    // Crear wrapper que no retorna nada para que coincida con el tipo de la referencia
    loadCurrentParticipantRef.current = async (sessionId: string) => {
      await loadCurrentParticipant(sessionId);
    };
    handleParticipantEventRef.current = handleParticipantEvent;
    handleSessionEventRef.current = handleSessionEvent;
    initializeTVViewRef.current = initializeTVView;
  }, [loadCurrentParticipant, handleParticipantEvent, handleSessionEvent, initializeTVView]);

  // [SOLUCIONADO] useEffect simplificado para inicialización
  useEffect(() => {
    if (!isMounted || !supabaseClient) return;
    
    const cleanup = initializeTVViewRef.current ? initializeTVViewRef.current() : Promise.resolve(() => {});
    return () => {
      cleanup.then(fn => fn());
    };
  }, [isMounted]); // ⚠️ SOLUCIONADO: Removido initializeTVView para evitar ciclo infinito

  // [optimización] Eliminamos el useEffect de polling - las suscripciones realtime lo reemplazan completamente

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

  // [modificación] Usar hook reactivo para gameState en lugar de getState()
  const gameState = useGameStore((state) => state.gameState);

  // [modificación] Determinar qué pantalla mostrar según el estado (simplificado)
  const renderScreen = () => {
    if (!isMounted) {
      // [modificación] Renderizar pantalla de carga mientras no esté montado
      return <LoadingScreen />;
    }

    // [SOLUCIONADO] Usar gameState reactivo para evitar lecturas desactualizadas
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
