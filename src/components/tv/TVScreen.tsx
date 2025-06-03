'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSessionStore, type GameSession } from '@/store/sessionStore';
import { useGameStore } from '@/store/gameStore'; // [modificación] Agregar import para limpiar estados residuales
// [modificación] Cambiar la importación de supabaseClient para usar importación dinámica
// import { supabaseClient } from '@/lib/supabase';

// [modificación] Importar hooks personalizados extraídos
import { useIsMounted } from '@/hooks/useIsMounted';
import { useClock } from '@/hooks/useClock';

// [modificación] Importar función de validación desde sessionStore
import { validateGameSession } from '@/store/sessionStore';

// [modificación] Importar componentes de Motion centralizados
import { MotionDiv, AnimatePresence } from './shared/MotionComponents';

// [modificación] Importar componentes de pantalla extraídos (simplificados)
import LoadingScreen from './screens/LoadingScreen';
import WaitingScreen from './screens/WaitingScreen';
import TVRouletteScreen from './screens/TVRouletteScreen';

// [modificación] Tipos más específicos para Supabase
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

// [modificación] Tipo para el cliente de Supabase con tipos más específicos
type SupabaseClient = {
  channel: (name: string) => RealtimeChannel;
  removeChannel: (channel: RealtimeChannel) => void;
  from: (table: string) => SupabaseQueryBuilder;
};

// [modificación] Tipos para los datos de la base de datos
type GameSessionData = {
  id: string;
  session_id: string;
  admin_id: string;
  status: 'pending_player_registration' | 'player_registered' | 'playing' | 'completed' | 'archived'; // [modificación] Cambio de string a union type específico
  nombre?: string; // [modificación] Eliminado | null para compatibilidad con PlaySession
  email?: string; // [modificación] Eliminado | null para compatibilidad con PlaySession
  apellido?: string; // [modificación] Eliminado | null para compatibilidad con PlaySession
  especialidad?: string; // [modificación] Eliminado | null para compatibilidad con PlaySession
  participant_id?: string; // [modificación] Eliminado | null para compatibilidad con PlaySession
  created_at: string;
  updated_at: string;
  admin_updated_at?: string; // [modificación] Eliminado | null para compatibilidad con PlaySession
  game_data?: Record<string, unknown>; // [modificación] Agregado para compatibilidad con PlaySession
  lastquestionid?: string; // [modificación] Eliminado | null para compatibilidad con PlaySession
  answeredcorrectly?: boolean; // [modificación] Eliminado | null para compatibilidad con PlaySession
  score?: number; // [modificación] Eliminado | null para compatibilidad con PlaySession
  premio_ganado?: string; // [modificación] Eliminado | null para compatibilidad con PlaySession
  detalles_juego?: Record<string, unknown>; // [modificación] Eliminado | null para compatibilidad con PlaySession
};

type DatabaseRecord = {
  id: string;
  session_id: string;
  status: string;
  admin_id: string;
  nombre?: string;
  email?: string;
  created_at: string;
  updated_at: string;
  score?: number;
  premio_ganado?: string;
  [key: string]: unknown;
};

type DatabaseError = {
  code?: string;
  message: string;
  [key: string]: unknown;
};

// [modificación] Tipo para los payloads de realtime con tipos más específicos
type RealtimePayload = {
  commit_timestamp?: string;
  new?: DatabaseRecord;
  old?: DatabaseRecord;
  [key: string]: unknown;
};

// [modificación] Componente principal para la vista de TV
export default function TVScreen() {
  const { currentSession, user, setCurrentSession, setUser } = useSessionStore();
  const [realtimeReady, setRealtimeReady] = useState(false); // [modificación] Estado para controlar polling
  const [isRealtimeConnecting, setIsRealtimeConnecting] = useState(false); // [modificación] Estado de conexión
  // [modificación] Estado para el cliente de Supabase tipado correctamente
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  
  // [modificación] Usar hooks personalizados extraídos
  const isMounted = useIsMounted();
  const currentTime = useClock();

  // [modificación] Inicializar cliente de Supabase de forma dinámica
  useEffect(() => {
    if (!isMounted) return;
    
    const initSupabaseClient = async () => {
      try {
//         console.log('📺 TV: Inicializando cliente Supabase dinámicamente...');
        const { supabaseClient: client } = await import('@/lib/supabase');
        
        if (client) {
//           console.log('📺 TV: ✅ Cliente Supabase inicializado exitosamente');
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

  // [modificación] Función para inicializar la vista de TV - ahora como useCallback estable
  const initializeTVView = useCallback(async () => {
    // [modificación] Declarar función de cleanup al inicio
    let cleanupFunction: (() => void) | undefined;
    
    // [modificación] Verificar que el cliente de Supabase esté disponible y que esté montado
    if (!supabaseClient || !isMounted) {
      console.error('Cliente de Supabase no disponible en la vista de TV o componente no montado');
//       console.log('📺 TV: Estado supabaseClient:', !!supabaseClient, 'isMounted:', isMounted);
      return;
    }

//     console.log('Inicializando vista de TV...');

    // Configurar usuario como viewer para la TV si no existe
    if (!user) {
      setUser({
        id: 'tv-viewer',
        email: 'tv@viewer.local',
        role: 'viewer',
        name: 'TV Display'
      });
    }

    // [modificación] Inicializar suscripción en tiempo real específica para TV con cleanup
    try {
//       console.log('Configurando realtime específico para TV...');
      setIsRealtimeConnecting(true); // [modificación] Marcar como conectando
      
      // [modificación] Crear canal específico para la TV y configurar suscripción
      const channel = supabaseClient
        .channel('tv_plays_realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'plays',
          },
          (payload) => {
//             console.log('📺 TV-INSERT: 🔄 Evento INSERT detectado:', payload);
//             console.log('📺 TV-INSERT: Timestamp del evento:', payload.commit_timestamp);
            const { new: newRecord } = payload;

            if (newRecord) {
//               console.log('📺 TV-INSERT: ✅ Nueva sesión insertada:', newRecord);
//               console.log('📺 TV-INSERT: Session ID:', newRecord.session_id);
//               console.log('📺 TV-INSERT: Estado:', newRecord.status);
//               console.log('📺 TV-INSERT: Participante:', newRecord.nombre || 'N/A');
//               console.log('📺 TV-INSERT: Email:', newRecord.email || 'N/A');
              
              try {
                const validatedSession = validateGameSession(newRecord);
//                 console.log('📺 TV-INSERT: ✅ Sesión validada exitosamente');
//                 console.log('📺 TV-INSERT: Actualizando estado de la TV a:', validatedSession.status);
                setCurrentSession(validatedSession);
//                 console.log('📺 TV-INSERT: Estado actualizado en TV');
              } catch (validationError) {
                console.error('📺 TV-INSERT: ❌ Error validando sesión:', validationError);
//                 console.log('📺 TV-INSERT: 🔄 Usando datos directamente como fallback');
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
            table: 'plays',
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
              console.log('📺 TV-UPDATE: Jugador:', newRecord.nombre || 'N/A');
              console.log('📺 TV-UPDATE: Email:', newRecord.email || 'N/A');
              
              // [modificación] CRUCIAL: Limpiar gameState residual INMEDIATAMENTE cuando se registra participante
              if (oldRecord?.status === 'pending_player_registration' && newRecord.status === 'player_registered') {
                console.log('🎉 TV-UPDATE: ¡PARTICIPANTE REGISTRADO! Cambiando a ruleta automáticamente');
                console.log('🎮 TV-UPDATE: Limpiando estados residuales del gameStore ANTES de mostrar ruleta...');
                
                // [modificación] Importar y usar las funciones del gameStore directamente
                const gameStore = useGameStore.getState();
                
                // [modificación] Limpiar TODOS los estados residuales inmediatamente
                gameStore.resetPrizeFeedback();
                gameStore.setCurrentQuestion(null);
                gameStore.setLastSpinResultIndex(null);
                gameStore.setGameState('roulette'); // [modificación] CRUCIAL: Forzar estado a roulette
                
                console.log('🎮 TV-UPDATE: Estados del gameStore limpiados - gameState forzado a \'roulette\'');
              }

              // [modificación] NUEVO: Detectar cuando se prepara para siguiente participante
              if ((oldRecord?.status === 'player_registered' || oldRecord?.status === 'playing' || oldRecord?.status === 'completed') && 
                  newRecord.status === 'pending_player_registration') {
                console.log('🔄 TV-UPDATE: ¡SESIÓN PREPARADA PARA SIGUIENTE PARTICIPANTE! Volviendo a WaitingScreen');
                console.log('🔄 TV-UPDATE: Estado anterior:', oldRecord?.status, '→ pending_player_registration');
                console.log('🔄 TV-UPDATE: Participante anterior:', oldRecord?.nombre, '→', newRecord.nombre);
                
                // [modificación] Limpiar gameStore para volver a estado inicial
                const gameStore = useGameStore.getState();
                gameStore.resetPrizeFeedback();
                gameStore.setCurrentQuestion(null);
                gameStore.setLastSpinResultIndex(null);
                gameStore.setGameState('screensaver'); // [modificación] Volver a waiting screen
                
                console.log('🔄 TV-UPDATE: Estados del gameStore limpiados - gameState establecido a \'screensaver\' para waiting');
              }
              
              try {
                const validatedSession = validateGameSession(newRecord);
                console.log('📺 TV-UPDATE: ✅ Sesión validada exitosamente');
                console.log('📺 TV-UPDATE: Actualizando estado de la TV a:', validatedSession.status);
                setCurrentSession(validatedSession);
                
                // [modificación] CRUCIAL: Sincronizar sessionStore con gameStore
                const gameStore = useGameStore.getState();
                console.log('📺 TV-UPDATE: Sincronizando gameStore con sessionStore...');
                gameStore.setGameSession({
                  id: validatedSession.session_id,
                  session_id: validatedSession.session_id,
                  admin_id: validatedSession.admin_id,
                  status: validatedSession.status,
                  nombre: validatedSession.nombre || 'Pendiente',
                  email: validatedSession.email || 'pendiente@registro.com',
                  apellido: validatedSession.apellido || undefined,
                  especialidad: validatedSession.especialidad || undefined,
                  participant_id: validatedSession.participant_id || undefined,
                  created_at: validatedSession.created_at,
                  updated_at: validatedSession.updated_at,
                  score: validatedSession.score || undefined,
                  premio_ganado: validatedSession.premio_ganado || undefined,
                  answeredcorrectly: validatedSession.answeredcorrectly || undefined,
                  lastquestionid: validatedSession.lastquestionid || undefined,
                  detalles_juego: validatedSession.detalles_juego || undefined,
                  admin_updated_at: validatedSession.admin_updated_at || undefined
                });
                console.log('📺 TV-UPDATE: gameSession sincronizado exitosamente');
                
                if (validatedSession.status === 'player_registered' || validatedSession.status === 'playing') {
                  console.log('🎮 TV-UPDATE: ¡Estado de juego detectado! La TV debería cambiar a ruleta automáticamente');
                }
              } catch (validationError) {
                console.error('📺 TV-UPDATE: ❌ Error validando sesión:', validationError);
                console.log('📺 TV-UPDATE: 🔄 Usando datos directamente como fallback');
                setCurrentSession(newRecord as unknown as GameSession);
                
                // [modificación] También sincronizar en caso de fallback
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
            table: 'plays',
          },
          () => {
//             console.log('📺 TV-DELETE: 🗑️ Evento DELETE detectado:', payload);
//             console.log('📺 TV-DELETE: Datos del registro eliminado:', payload.old);
//             console.log('📺 TV-DELETE: Limpiando sesión actual y volviendo a estado de espera');
            setCurrentSession(null);
          }
        )
        .subscribe((status) => {
//           console.log('📺 TV-REALTIME: 📡 Estado de suscripción:', status);
          if (status === 'SUBSCRIBED') {
//             console.log('✅ TV-REALTIME: Suscripción activa y lista para recibir eventos');
//             console.log('✅ TV-REALTIME: Escuchando eventos: INSERT, UPDATE, DELETE en tabla plays');
            setRealtimeReady(true);
            setIsRealtimeConnecting(false); // [modificación] Ya no está conectando
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ TV-REALTIME: Error en canal realtime');
            setRealtimeReady(false);
            setIsRealtimeConnecting(false); // [modificación] Error de conexión
          } else if (status === 'CLOSED') {
            console.warn('⚠️ TV-REALTIME: Canal cerrado');
            setRealtimeReady(false);
            setIsRealtimeConnecting(true); // [modificación] Intentando reconectar
          } else {
//             console.log(`📺 TV-REALTIME: Estado de canal: ${status}`);
            // [modificación] Mantener estado de conexión para estados intermedios
            setIsRealtimeConnecting(true);
          }
        });

//       console.log('📺 TV: Canal realtime configurado');

      // [modificación] Guardar función de cleanup para remover canal
      cleanupFunction = () => {
//         console.log('📺 TV: Limpiando suscripción realtime...');
        supabaseClient.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error al inicializar realtime específico para TV:', error);
      setRealtimeReady(false);
      setIsRealtimeConnecting(false); // [modificación] Error de inicialización
      cleanupFunction = () => {}; // [modificación] Función vacía en caso de error
    }

    // Cargar sesión activa actual desde la base de datos
    try {
//       console.log('📺 TV: Cargando sesión activa desde la base de datos...');
      
      // [modificación] Consulta de debug reducida - solo en modo desarrollo
      if (process.env.NODE_ENV === 'development') {
//         console.log('📺 TV-DEBUG: Consultando TODAS las sesiones para debug...');
        // [modificación] Corregir consulta para usar await directamente
        try {
          const debugResult = await supabaseClient
            .from('plays')
            .select('session_id, status, nombre, email, updated_at')
            .order('updated_at', { ascending: false })
            .limit(5);
            
          if (!debugResult.error && debugResult.data) {
//             console.log('📺 TV-DEBUG: Sesiones encontradas (últimas 5):', debugResult.data);
            debugResult.data?.forEach(() => {
//               console.log(`📺 TV-DEBUG: Sesión ${index + 1}: ${session.session_id.substring(0,8)}... - Estado: ${session.status} - Participante: ${session.nombre || 'N/A'}`);
            });
          }
        } catch (debugError) {
          console.error('📺 TV-DEBUG: Error en consulta de debug:', debugError);
        }
      }
      
      // [modificación] Consulta principal para sesiones activas
      // [modificación] Corregir consulta para usar await directamente
      const result = await supabaseClient
        .from('plays')
        .select('*')
        .in('status', ['pending_player_registration', 'player_registered', 'playing'])
        .order('updated_at', { ascending: false }) // [modificación] Ordenar por updated_at en lugar de created_at
        .limit(1)
        .maybeSingle(); // [modificación] Cambio de .single() a .maybeSingle() para evitar error 406 cuando no hay sesiones activas

//       console.log('📺 TV: Resultado de consulta de sesión activa:', { data: result.data, error: result.error });

      // [modificación] Verificación mejorada para manejar error que puede ser null
      if (result.error?.code && result.error?.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('📺 TV: Error cargando sesión activa:', result.error);
        return cleanupFunction;
      }

      if (result.data) {
//         console.log('📺 TV: Sesión activa encontrada:', result.data);
//         console.log('📺 TV: ID de sesión:', result.data.session_id);
//         console.log('📺 TV: Estado de sesión:', result.data.status);
//         console.log('📺 TV: Participante:', result.data.nombre || 'N/A');
//         console.log('📺 TV: Email:', result.data.email || 'N/A');
        
        // [modificación] Usar función de validación para convertir datos de Supabase
        try {
          const validatedSession = validateGameSession(result.data);
          setCurrentSession(validatedSession);
//           console.log('📺 TV: Estado inicial configurado exitosamente:', validatedSession.status);
          
          // [modificación] CRUCIAL: Sincronizar gameStore con sessionStore en inicialización
          const gameStore = useGameStore.getState();
          console.log('📺 TV-INIT: Sincronizando gameStore con sesión inicial...');
          gameStore.setGameSession({
            id: validatedSession.session_id,
            session_id: validatedSession.session_id,
            admin_id: validatedSession.admin_id,
            status: validatedSession.status,
            nombre: validatedSession.nombre || 'Pendiente',
            email: validatedSession.email || 'pendiente@registro.com',
            apellido: validatedSession.apellido || undefined,
            especialidad: validatedSession.especialidad || undefined,
            participant_id: validatedSession.participant_id || undefined,
            created_at: validatedSession.created_at,
            updated_at: validatedSession.updated_at,
            score: validatedSession.score || undefined,
            premio_ganado: validatedSession.premio_ganado || undefined,
            answeredcorrectly: validatedSession.answeredcorrectly || undefined,
            lastquestionid: validatedSession.lastquestionid || undefined,
            detalles_juego: validatedSession.detalles_juego || undefined,
            admin_updated_at: validatedSession.admin_updated_at || undefined
          });
          console.log('📺 TV-INIT: gameSession sincronizado exitosamente en inicialización');
          
          // [modificación] Navegación removida - ahora se maneja en useEffect dedicado
        } catch (validationError) {
          console.error('📺 TV: Error validando sesión:', validationError);
          // [modificación] Fallback: usar datos directamente si la validación falla
          setCurrentSession(result.data as unknown as GameSession);
//           console.log('📺 TV: Usando datos directamente como fallback');
          
          // [modificación] También sincronizar en caso de fallback
          const gameStore = useGameStore.getState();
          gameStore.setGameSession(result.data as unknown as GameSessionData);
        }
      } else {
//         console.log('📺 TV: No hay sesión activa en este momento (data es null/undefined)');
        setCurrentSession(null);
      }
    } catch (error) {
      console.error('📺 TV: Error al cargar sesión activa:', error);
    }
    
//     console.log('📺 TV: Inicialización de vista TV completada');
    
    // [modificación] Retornar función de cleanup que incluya la limpieza del realtime
    return cleanupFunction;
  }, [isMounted, supabaseClient, user, setCurrentSession, setUser]);

  // [modificación] Inicializar realtime y cargar sesión activa para la vista de TV con cleanup
  useEffect(() => {
    if (!isMounted || !supabaseClient) return; // [modificación] Solo ejecutar después del mount y cuando supabaseClient esté disponible
    
    let cleanupFunction: (() => void) | undefined;

    const runInitialization = async () => {
      cleanupFunction = await initializeTVView();
    };

    runInitialization();

    // [modificación] Cleanup al desmontar el componente
    return () => {
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, [isMounted, supabaseClient, initializeTVView]);

  // [modificación] Sistema de polling como backup solo cuando realtime no está listo
  useEffect(() => {
    if (!isMounted || !supabaseClient) return; // [modificación] Solo ejecutar después del mount y cuando supabaseClient esté disponible
    
    if (realtimeReady) {
//       console.log('📺 TV: Realtime activo, desactivando polling de backup');
      return; // [modificación] No ejecutar polling si realtime está activo
    }

//     console.log('📺 TV: Realtime no listo, activando polling de backup');

    const checkForUpdates = async () => {
      try {
        // [modificación] Corregir consulta para usar await directamente
        const result = await supabaseClient
          .from('plays')
          .select('*')
          .in('status', ['pending_player_registration', 'player_registered', 'playing'])
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(); // [modificación] Cambio de .single() a .maybeSingle() para evitar error 406 cuando no hay sesiones activas

        if (!result.error && result.data) {
          // Solo actualizar si la sesión cambió o es diferente
          if (!currentSession || 
              currentSession.session_id !== result.data.session_id || 
              currentSession.status !== result.data.status ||
              currentSession.updated_at !== result.data.updated_at) {
            
//             console.log('📺 TV (Polling): Detectado cambio en sesión:', result.data);
            try {
              const validatedSession = validateGameSession(result.data);
              setCurrentSession(validatedSession);
              
              // [modificación] Navegación removida - ahora se maneja en useEffect dedicado
            } catch (validationError) {
              console.error('📺 TV (Polling): Error validando sesión:', validationError);
              setCurrentSession(result.data as unknown as GameSession);
            }
          }
        } else if (!result.data) {
          // [modificación] Si no hay datos (data = null), limpiar la sesión actual
          if (currentSession) {
//             console.log('📺 TV (Polling): No hay sesiones activas, limpiando sesión actual');
            setCurrentSession(null);
          }
        }
      } catch (error) {
        console.error('📺 TV (Polling): Error verificando actualizaciones:', error);
      }
    };

    // [modificación] Polling cada 3 segundos como backup solo cuando sea necesario
    const pollingInterval = setInterval(checkForUpdates, 3000);

    return () => {
      clearInterval(pollingInterval);
    };
  }, [realtimeReady, currentSession?.session_id, currentSession?.status, currentSession?.updated_at, setCurrentSession, isMounted, supabaseClient, currentSession]); // [modificación] Agregar currentSession a las dependencias para satisfacer el linter

  // [modificación] useEffect para logging controlado del estado sin causar loops
  useEffect(() => {
    if (!isMounted) return;
    
    // Solo hacer log cuando hay cambios reales en el estado de la sesión
    if (currentSession) {
      console.log('📺 TV-STATE: Sesión activa detectada');
      console.log('   Session ID:', currentSession.session_id.substring(0, 8) + '...');
      console.log('   Estado:', currentSession.status);
      console.log('   Participante:', currentSession.nombre || 'N/A');
      console.log('   Email:', currentSession.email || 'N/A');
      
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
//           console.log('📺 TV: Juego completado, volviendo a sala de espera...');
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
            <p><span className="text-blue-400">Participante:</span> {currentSession?.nombre || 'N/A'}</p>
            <p><span className="text-blue-400">Email:</span> {currentSession?.email || 'N/A'}</p>
            <p><span className="text-blue-400">Última actualización:</span> {currentSession?.updated_at ? new Date(currentSession.updated_at).toLocaleTimeString() : 'N/A'}</p>
            <p><span className="text-blue-400">Tiempo actual:</span> {currentTime?.toLocaleTimeString() || 'N/A'}</p>
            <p><span className="text-blue-400">Realtime:</span> 
              <span className={`ml-1 ${realtimeReady ? 'text-green-400' : isRealtimeConnecting ? 'text-yellow-400' : 'text-red-400'}`}>
                {realtimeReady ? '✅ Activo' : isRealtimeConnecting ? '🔄 Conectando' : '❌ Inactivo'}
              </span>
            </p>
            
            {/* [modificación] Botones más grandes para TV 4K */}
            <button 
              onClick={async () => {
//                 console.log('📺 TV: Forzando recarga de sesión...');
                await initializeTVView();
              }}
              className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-base mr-3" // [modificación] Botones más grandes
            >
              🔄 Refrescar
            </button>
            
            {/* [modificación] Botón para crear nueva sesión rápida */}
            <button 
              onClick={async () => {
//                 console.log('📺 TV: Creando nueva sesión rápida...');
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
//                       console.log('📺 TV: Nueva sesión creada y URL copiado:', fullUrl);
                      alert(`Nueva sesión creada!\nURL copiado al portapapeles:\n${fullUrl.substring(0,50)}...`);
                      // Refrescar después de crear
                      setTimeout(() => initializeTVView(), 1000);
                    }
                  }
                } catch (error) {
                  console.error('📺 TV: Error creando sesión:', error);
                }
              }}
              className="mt-3 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-base mr-3" // [modificación] Botón más grande
            >
              ⚡ Nueva Sesión
            </button>
            
            {/* [modificación] Botón para resetear sesión actual */}
            {currentSession && (
              <button 
                onClick={async () => {
//                   console.log('📺 TV: Reseteando sesión actual...');
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
//                       console.log('📺 TV: Sesión reseteada exitosamente:', data);
                      const fullUrl = `${window.location.origin}/register/${currentSession.session_id}`;
                      await navigator.clipboard.writeText(fullUrl);
                      alert(`Sesión reseteada exitosamente!\nURL copiado al portapapeles:\n${fullUrl.substring(0,50)}...`);
                      // Refrescar después de resetear
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
                className="mt-3 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-base mr-3" // [modificación] Botón más grande
              >
                🔄 Resetear Sesión Actual
              </button>
            )}
            
            {/* [modificación] Botón para diagnóstico avanzado de base de datos */}
            <button 
              onClick={async () => {
                if (!supabaseClient) {
                  console.error('🔍 TV-DIAGNOSTICO: Cliente Supabase no disponible');
                  return;
                }
                
//                 console.log('🔍 TV-DIAGNOSTICO: Iniciando diagnóstico avanzado de base de datos...');
                
                try {
                  // Consulta 1: Todas las sesiones sin filtros
//                   console.log('🔍 TV-DIAGNOSTICO: 1. Consultando TODAS las sesiones...');
                  // [modificación] Corregir consulta para usar await directamente
                  try {
                    const allResult = await supabaseClient
                      .from('plays')
                      .select('*')
                      .order('updated_at', { ascending: false });
                    
                    if (allResult.error) {
                      console.error('🔍 TV-DIAGNOSTICO: Error en consulta 1:', allResult.error);
                    } else {
//                       console.log(`🔍 TV-DIAGNOSTICO: Total de sesiones encontradas: ${allResult.data?.length || 0}`);
                      allResult.data?.forEach(() => {
//                         console.log(`🔍 TV-DIAGNOSTICO: Sesión ${index + 1}:`, {
//                           id: session.id,
//                           session_id: session.session_id.substring(0, 8) + '...',
//                           status: session.status,
//                           nombre: session.nombre || 'N/A',
//                           email: session.email || 'N/A',
//                           admin_id: session.admin_id,
//                           created_at: session.created_at,
//                           updated_at: session.updated_at
//                         });
                      });
                    }
                  } catch (error1) {
                    console.error('🔍 TV-DIAGNOSTICO: Error en consulta 1:', error1);
                  }
                  
                  // Consulta 2: Sesiones específicas por estado
//                   console.log('🔍 TV-DIAGNOSTICO: 2. Consultando sesiones con estados específicos...');
                  // [modificación] Corregir consulta para usar await directamente
                  try {
                    const activeResult = await supabaseClient
                      .from('plays')
                      .select('*')
                      .in('status', ['pending_player_registration', 'player_registered', 'playing'])
                      .order('updated_at', { ascending: false });
                    
                    if (activeResult.error) {
                      console.error('🔍 TV-DIAGNOSTICO: Error en consulta 2:', activeResult.error);
                    } else {
//                       console.log(`🔍 TV-DIAGNOSTICO: Sesiones activas encontradas: ${activeResult.data?.length || 0}`);
                      activeResult.data?.forEach(() => {
//                         console.log(`🔍 TV-DIAGNOSTICO: Sesión activa ${index + 1}:`, {
//                           session_id: session.session_id.substring(0, 8) + '...',
//                           status: session.status,
//                           nombre: session.nombre || 'N/A',
//                           email: session.email || 'N/A'
//                         });
                      });
                    }
                  } catch (error2) {
                    console.error('🔍 TV-DIAGNOSTICO: Error en consulta 2:', error2);
                  }
                  
                  // Consulta 3: Buscar la sesión específica que detecta la tablet
//                   console.log('🔍 TV-DIAGNOSTICO: 3. Buscando sesión específica 34162bb4-7bc8-497f-add5-cbfc13dfc658...');
                  // [modificación] Corregir consulta para usar await directamente
                  try {
                    const specificResult = await supabaseClient
                      .from('plays')
                      .select('*')
                      .eq('session_id', '34162bb4-7bc8-497f-add5-cbfc13dfc658')
                      .order('updated_at', { ascending: false });
                    
                    if (specificResult.error) {
                      console.error('🔍 TV-DIAGNOSTICO: Error en consulta 3:', specificResult.error);
                    } else {
//                       console.log(`🔍 TV-DIAGNOSTICO: Registros para sesión específica: ${specificResult.data?.length || 0}`);
                      specificResult.data?.forEach(() => {
//                         console.log(`🔍 TV-DIAGNOSTICO: Registro ${index + 1} de sesión específica:`, {
//                           id: session.id,
//                           session_id: session.session_id,
//                           status: session.status,
//                           nombre: session.nombre,
//                           email: session.email,
//                           admin_id: session.admin_id,
//                           created_at: session.created_at,
//                           updated_at: session.updated_at
//                         });
                      });
                    }
                  } catch (error3) {
                    console.error('🔍 TV-DIAGNOSTICO: Error en consulta 3:', error3);
                  }
                  
//                   console.log('🔍 TV-DIAGNOSTICO: Diagnóstico completado');
                } catch (error) {
                  console.error('🔍 TV-DIAGNOSTICO: Error durante diagnóstico:', error);
                }
              }}
              className="mt-3 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-base mr-3" // [modificación] Botón más grande
            >
              🔍 Diagnóstico DB
            </button>
            
            {/* [modificación] Botón para testing: simular participante registrado */}
            <button 
              onClick={() => {
//                 console.log('📺 TV-TEST: Simulando participante registrado...');
                const testSession = {
                  id: 'test-' + Date.now(),
                  session_id: 'test-session-' + Date.now(),
                  status: 'player_registered' as const,
                  admin_id: 'test-admin',
                  nombre: 'Usuario de Prueba',
                  email: 'test@example.com',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                setCurrentSession(testSession);
//                 console.log('📺 TV-TEST: Estado actualizado a player_registered - la TV debería mostrar ruleta');
              }}
              className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-base" // [modificación] Botón más grande
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
function GameCompletedScreen({ currentSession }: { currentSession: GameSession }) {
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
        {currentSession.nombre && (
          <div className="mb-8">
            <h2 className="text-4xl font-semibold text-purple-300 mb-2">
              Felicitaciones
            </h2>
            <p className="text-3xl text-white font-bold">
              {currentSession.nombre}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {currentSession.score !== undefined && (
            <div className="bg-white/10 rounded-2xl p-6">
              <p className="text-xl text-white/80 mb-2">Puntuación Final</p>
              <p className="text-4xl font-bold text-yellow-400">{currentSession.score}</p>
            </div>
          )}

          {currentSession.premio_ganado && (
            <div className="bg-white/10 rounded-2xl p-6">
              <p className="text-xl text-white/80 mb-2">Premio Ganado</p>
              <p className="text-2xl font-bold text-green-400">{currentSession.premio_ganado}</p>
            </div>
          )}
        </div>

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
