'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore, type GameSession } from '@/store/sessionStore';
import { supabaseClient } from '@/lib/supabase';

// [modificación] Importar hooks personalizados extraídos
import { useIsMounted } from '@/hooks/useIsMounted';
import { useClock } from '@/hooks/useClock';

// [modificación] Importar función de validación desde sessionStore
import { validateGameSession } from '@/store/sessionStore';

// [modificación] Importar componentes de Motion centralizados
import { MotionDiv, AnimatePresence } from './shared/MotionComponents';

// [modificación] Importar componentes de pantalla extraídos
import LoadingScreen from './screens/LoadingScreen';
import WaitingScreen from './screens/WaitingScreen';
import InvitationScreen from './screens/InvitationScreen';

// [modificación] Componente principal para la vista de TV
export default function TVScreen() {
  const { currentSession, user, setCurrentSession, setUser } = useSessionStore();
  const [realtimeReady, setRealtimeReady] = useState(false); // [modificación] Estado para controlar polling
  const [isRealtimeConnecting, setIsRealtimeConnecting] = useState(false); // [modificación] Estado de conexión
  
  // [modificación] Usar hooks personalizados extraídos
  const isMounted = useIsMounted();
  const currentTime = useClock();
  const router = useRouter();

  // [modificación] Efecto dedicado para navegación automática - único lugar para la navegación
  useEffect(() => {
    if (!isMounted || !currentSession?.status) return; // [modificación] Verificar mount y session
    
    if (currentSession.status === 'playing' && currentSession.session_id) {
      console.log('📺 TV: Navegando automáticamente al juego:', currentSession.session_id);
      router.push(`/game/${currentSession.session_id}`);
    }
  }, [currentSession, router, isMounted]);

  // [modificación] Función memoizada para inicializar la vista de TV con dependencias optimizadas
  const initializeTVView = useCallback(async () => {
    // [modificación] Verificar que el cliente de Supabase esté disponible y que esté montado
    if (!supabaseClient || !isMounted) {
      console.error('Cliente de Supabase no disponible en la vista de TV o componente no montado');
      return;
    }

    console.log('Inicializando vista de TV...');

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
      console.log('Configurando realtime específico para TV...');
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
            console.log('📺 TV: INSERT detectado:', payload);
            const { new: newRecord } = payload;

            if (newRecord) {
              console.log('📺 TV: Nueva sesión insertada:', newRecord);
              try {
                const validatedSession = validateGameSession(newRecord);
                setCurrentSession(validatedSession);
                console.log('📺 TV: Estado actualizado:', validatedSession.status);
              } catch (validationError) {
                console.error('📺 TV: Error validando sesión:', validationError);
                setCurrentSession(newRecord as unknown as GameSession);
              }
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
              
              try {
                const validatedSession = validateGameSession(newRecord);
                console.log('📺 TV-UPDATE: ✅ Sesión validada exitosamente');
                console.log('📺 TV-UPDATE: Actualizando estado de la TV a:', validatedSession.status);
                setCurrentSession(validatedSession);
                
                if (validatedSession.status === 'playing') {
                  console.log('📺 TV-UPDATE: 🎮 ¡Estado playing detectado! La TV debería cambiar de vista automáticamente');
                }
              } catch (validationError) {
                console.error('📺 TV-UPDATE: ❌ Error validando sesión:', validationError);
                console.log('📺 TV-UPDATE: 🔄 Usando datos directamente como fallback');
                setCurrentSession(newRecord as unknown as GameSession);
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
          (payload) => {
            console.log('📺 TV-DELETE: 🗑️ Evento DELETE detectado:', payload);
            console.log('📺 TV-DELETE: Datos del registro eliminado:', payload.old);
            console.log('📺 TV-DELETE: Limpiando sesión actual y volviendo a estado de espera');
            setCurrentSession(null);
          }
        )
        .subscribe((status) => {
          console.log('📺 TV-REALTIME: 📡 Estado de suscripción:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ TV-REALTIME: Suscripción activa y lista para recibir eventos');
            console.log('✅ TV-REALTIME: Escuchando eventos: INSERT, UPDATE, DELETE en tabla plays');
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
            console.log(`📺 TV-REALTIME: Estado de canal: ${status}`);
            // [modificación] Mantener estado de conexión para estados intermedios
            setIsRealtimeConnecting(true);
          }
        });

      console.log('📺 TV: Canal realtime configurado');

      // [modificación] Retornar función de cleanup para remover canal
      return () => {
        console.log('📺 TV: Limpiando suscripción realtime...');
        supabaseClient.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error al inicializar realtime específico para TV:', error);
      setRealtimeReady(false);
      setIsRealtimeConnecting(false); // [modificación] Error de inicialización
      return () => {}; // [modificación] Retornar función vacía en caso de error
    }

    // Cargar sesión activa actual desde la base de datos
    try {
      console.log('📺 TV: Cargando sesión activa desde la base de datos...');
      const { data, error } = await supabaseClient
        .from('plays')
        .select('*')
        .in('status', ['pending_player_registration', 'player_registered', 'playing'])
        .order('updated_at', { ascending: false }) // [modificación] Ordenar por updated_at en lugar de created_at
        .limit(1)
        .maybeSingle(); // [modificación] Cambio de .single() a .maybeSingle() para evitar error 406 cuando no hay sesiones activas

      // [modificación] Verificación mejorada para manejar error que puede ser null
      if (error?.code && error?.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('📺 TV: Error cargando sesión activa:', error);
        return;
      }

      if (data) {
        console.log('📺 TV: Sesión activa encontrada:', data);
        // [modificación] Usar función de validación para convertir datos de Supabase
        try {
          const validatedSession = validateGameSession(data);
          setCurrentSession(validatedSession);
          console.log('📺 TV: Estado inicial configurado:', validatedSession.status);
          
          // [modificación] Navegación removida - ahora se maneja en useEffect dedicado
        } catch (validationError) {
          console.error('📺 TV: Error validando sesión:', validationError);
          // [modificación] Fallback: usar datos directamente si la validación falla
          setCurrentSession(data as unknown as GameSession);
        }
      } else {
        console.log('📺 TV: No hay sesión activa en este momento');
        setCurrentSession(null);
      }
    } catch (error) {
      console.error('📺 TV: Error al cargar sesión activa:', error);
    }
  }, [user, setUser, setCurrentSession, isMounted]); // [modificación] Agregar isMounted a dependencias

  // [modificación] Inicializar realtime y cargar sesión activa para la vista de TV con cleanup
  useEffect(() => {
    if (!isMounted) return; // [modificación] Solo ejecutar después del mount
    
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
  }, [initializeTVView, isMounted]);

  // [modificación] Sistema de polling como backup solo cuando realtime no está listo
  useEffect(() => {
    if (!isMounted) return; // [modificación] Solo ejecutar después del mount
    
    if (realtimeReady) {
      console.log('📺 TV: Realtime activo, desactivando polling de backup');
      return; // [modificación] No ejecutar polling si realtime está activo
    }

    console.log('📺 TV: Realtime no listo, activando polling de backup');

    const checkForUpdates = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('plays')
          .select('*')
          .in('status', ['pending_player_registration', 'player_registered', 'playing'])
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(); // [modificación] Cambio de .single() a .maybeSingle() para evitar error 406 cuando no hay sesiones activas

        if (!error && data) {
          // Solo actualizar si la sesión cambió o es diferente
          if (!currentSession || 
              currentSession.session_id !== data.session_id || 
              currentSession.status !== data.status ||
              currentSession.updated_at !== data.updated_at) {
            
            console.log('📺 TV (Polling): Detectado cambio en sesión:', data);
            try {
              const validatedSession = validateGameSession(data);
              setCurrentSession(validatedSession);
              
              // [modificación] Navegación removida - ahora se maneja en useEffect dedicado
            } catch (validationError) {
              console.error('📺 TV (Polling): Error validando sesión:', validationError);
              setCurrentSession(data as unknown as GameSession);
            }
          }
        } else if (!data) {
          // [modificación] Si no hay datos (data = null), limpiar la sesión actual
          if (currentSession) {
            console.log('📺 TV (Polling): No hay sesiones activas, limpiando sesión actual');
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
  }, [realtimeReady, currentSession, setCurrentSession, isMounted]); // [modificación] Agregar isMounted a dependencias

  // [modificación] Determinar qué pantalla mostrar según el estado (usando estados del backend)
  const renderScreen = () => {
    if (!isMounted) {
      // [modificación] Renderizar pantalla de carga mientras no esté montado
      return <LoadingScreen />;
    }

    if (!currentSession) {
      return <WaitingScreen />;
    }

    switch (currentSession.status) {
      case 'pending_player_registration':
        return <WaitingScreen />;
      case 'player_registered':
        return <InvitationScreen currentTime={currentTime} />;
      case 'playing':
        return <GameActiveScreen currentSession={currentSession} />;
      case 'completed':
      case 'archived':
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
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* [modificación] Contenido principal */}
      <div className="relative z-10">
        {isMounted && (
          <AnimatePresence mode="wait">
            {renderScreen()}
          </AnimatePresence>
        )}
      </div>

      {/* [modificación] Información del usuario en esquina */}
      {user && isMounted && (
        <div className="absolute top-4 right-4 text-white/60 text-sm">
          <p>Usuario: {user.email}</p>
          <p>Rol: {user.role === 'viewer' ? 'TV' : 'Admin'}</p>
          {/* [modificación] Mostrar estado de conexión realtime */}
          <div className="flex items-center mt-2">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              realtimeReady ? 'bg-green-400' : 
              isRealtimeConnecting ? 'bg-yellow-400' : 'bg-red-400'
            }`}></div>
            <span className="text-xs">
              {realtimeReady ? 'Conectado' : 
               isRealtimeConnecting ? 'Conectando...' : 'Desconectado'}
            </span>
          </div>
        </div>
      )}

      {/* [modificación] Debug info para desarrollo */}
      {process.env.NODE_ENV === 'development' && isMounted && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs p-4 rounded-lg max-w-md border border-white/30">
          <h4 className="font-bold mb-2 text-green-400">📺 TV Debug Info</h4>
          <div className="space-y-1">
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
            
            {/* [modificación] Botón para forzar recarga de sesión */}
            <button 
              onClick={async () => {
                console.log('📺 TV: Forzando recarga de sesión...');
                await initializeTVView();
              }}
              className="mt-2 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
            >
              🔄 Refrescar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// [modificación] Pantalla cuando el juego está activo
function GameActiveScreen({ currentSession }: { currentSession: GameSession }) {
  const isMounted = useIsMounted(); // [modificación] Hook para verificar si está montado

  if (!isMounted) {
    return <LoadingScreen />;
  }

  return (
    <MotionDiv
      key="game-active"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex flex-col items-center justify-center min-h-screen text-center px-8"
    >
      {/* Jugador actual */}
      <MotionDiv
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-lg rounded-3xl p-12 mb-8 border border-green-400/30"
      >
        <h1 className="text-6xl font-bold text-white mb-4">¡Juego en Curso!</h1>
        
        {currentSession.nombre && (
          <div className="bg-white/10 rounded-2xl p-8">
            <h2 className="text-4xl font-semibold text-green-300 mb-2">
              Jugador Actual
            </h2>
            <p className="text-3xl text-white font-bold">
              {currentSession.nombre}
            </p>
            {currentSession.email && (
              <p className="text-xl text-white/70 mt-2">
                {currentSession.email}
              </p>
            )}
          </div>
        )}
      </MotionDiv>

      {/* Indicadores de progreso */}
      <MotionDiv
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex space-x-8 text-white"
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-lg">En progreso</p>
        </div>
        <div className="text-center">
          <div className="text-4xl mb-2">💪</div>
          <p className="text-lg">¡Tú puedes!</p>
        </div>
        <div className="text-center">
          <div className="text-4xl mb-2">⏱️</div>
          <p className="text-lg">Tiempo real</p>
        </div>
      </MotionDiv>

      {/* Puntuación si existe */}
      {currentSession.score !== undefined && (
        <MotionDiv
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 bg-white/10 rounded-2xl p-6"
        >
          <p className="text-2xl text-white/80">Puntuación</p>
          <p className="text-5xl font-bold text-yellow-400">{currentSession.score}</p>
        </MotionDiv>
      )}
    </MotionDiv>
  );
}

// [modificación] Pantalla cuando el juego termina
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
          <p className="text-lg mt-2">Esperando próximo jugador...</p>
        </MotionDiv>
      </MotionDiv>
    </MotionDiv>
  );
} 