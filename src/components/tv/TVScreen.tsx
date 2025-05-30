'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSessionStore, type GameSession } from '@/store/sessionStore';
import { supabaseClient } from '@/lib/supabase';

// [modificación] Importar función de validación desde sessionStore
import { validateGameSession } from '@/store/sessionStore';

// [modificación] Componente principal para la vista de TV
export default function TVScreen() {
  const { currentSession, user, setCurrentSession, setUser } = useSessionStore();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [realtimeReady, setRealtimeReady] = useState(false); // [modificación] Estado para controlar polling
  const router = useRouter();

  // [modificación] Reloj en tiempo real con inicialización post-mount
  useEffect(() => {
    // [modificación] Establecer fecha inicial después del mount para evitar hydration mismatch
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // [modificación] Efecto dedicado para navegación automática - único lugar para la navegación
  useEffect(() => {
    if (currentSession?.status === 'playing' && currentSession.session_id) {
      console.log('📺 TV: Navegando automáticamente al juego:', currentSession.session_id);
      router.push(`/game/${currentSession.session_id}`);
    }
  }, [currentSession, router]);

  // [modificación] Función memoizada para inicializar la vista de TV con dependencias optimizadas
  const initializeTVView = useCallback(async () => {
    // [modificación] Verificar que el cliente de Supabase esté disponible
    if (!supabaseClient) {
      console.error('Cliente de Supabase no disponible en la vista de TV');
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
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ TV-REALTIME: Error en canal realtime');
            setRealtimeReady(false);
          } else if (status === 'CLOSED') {
            console.warn('⚠️ TV-REALTIME: Canal cerrado');
            setRealtimeReady(false);
          } else {
            console.log(`📺 TV-REALTIME: Estado de canal: ${status}`);
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
  }, [user, setUser, setCurrentSession]); // [modificación] Dependencias corregidas incluyendo 'user'

  // [modificación] Inicializar realtime y cargar sesión activa para la vista de TV con cleanup
  useEffect(() => {
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
  }, [initializeTVView]);

  // [modificación] Sistema de polling como backup solo cuando realtime no está listo
  useEffect(() => {
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
  }, [realtimeReady, currentSession, setCurrentSession]); // [modificación] Dependencia de realtimeReady

  // [modificación] Determinar qué pantalla mostrar según el estado (usando estados del backend)
  const renderScreen = () => {
    if (!currentSession) {
      return <WaitingScreen currentTime={currentTime} />;
    }

    switch (currentSession.status) {
      case 'pending_player_registration':
        return <WaitingScreen currentTime={currentTime} />;
      case 'player_registered':
        return <InvitationScreen currentTime={currentTime} />;
      case 'playing':
        return <GameActiveScreen currentSession={currentSession} />;
      case 'completed':
      case 'archived':
        return <GameCompletedScreen currentSession={currentSession} />;
      default:
        return <WaitingScreen currentTime={currentTime} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* [modificación] Fondo animado */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* [modificación] Contenido principal */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {renderScreen()}
        </AnimatePresence>
      </div>

      {/* [modificación] Información del usuario en esquina */}
      {user && (
        <div className="absolute top-4 right-4 text-white/60 text-sm">
          <p>Usuario: {user.email}</p>
          <p>Rol: {user.role === 'viewer' ? 'TV' : 'Admin'}</p>
        </div>
      )}

      {/* [modificación] Debug info para desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs p-4 rounded-lg max-w-md border border-white/30">
          <h4 className="font-bold mb-2 text-green-400">📺 TV Debug Info</h4>
          <div className="space-y-1">
            <p><span className="text-blue-400">Usuario:</span> {user ? `${user.name} (${user.role})` : 'No configurado'}</p>
            <p><span className="text-blue-400">Sesión actual:</span> {currentSession ? `${currentSession.session_id.substring(0,8)}... - ${currentSession.status}` : 'Ninguna'}</p>
            <p><span className="text-blue-400">Participante:</span> {currentSession?.nombre || 'N/A'}</p>
            <p><span className="text-blue-400">Email:</span> {currentSession?.email || 'N/A'}</p>
            <p><span className="text-blue-400">Última actualización:</span> {currentSession?.updated_at ? new Date(currentSession.updated_at).toLocaleTimeString() : 'N/A'}</p>
            <p><span className="text-blue-400">Tiempo actual:</span> {currentTime?.toLocaleTimeString() || 'N/A'}</p>
            
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

// [modificación] Pantalla de espera cuando no hay sesión activa
function WaitingScreen({ currentTime }: { currentTime: Date | null }) {
  return (
    <motion.div
      key="waiting"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen text-center px-8"
    >
      {/* Logo principal */}
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-12"
      >
        <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center mb-8 mx-auto shadow-2xl">
          <span className="text-6xl font-bold text-blue-900">DS</span>
        </div>
        <h1 className="text-6xl font-bold text-white mb-4">DarSalud</h1>
        <p className="text-2xl text-blue-200">Juego Interactivo</p>
      </motion.div>

      {/* Mensaje de espera */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 max-w-2xl"
      >
        <h2 className="text-4xl font-semibold text-white mb-6">
          Esperando nueva sesión...
        </h2>
        <p className="text-xl text-white/80 mb-8">
          El administrador iniciará el juego desde su tablet
        </p>
        
        {/* Reloj */}
        <div className="text-white/60 text-lg">
          <p>{currentTime?.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }) || 'N/A'}</p>
          <p className="text-3xl font-mono mt-2">
            {currentTime?.toLocaleTimeString('es-ES') || 'N/A'}
          </p>
        </div>
      </motion.div>

      {/* Indicador de conexión */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="mt-12 flex items-center text-green-400"
      >
        <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
        <span className="text-lg">Conectado y listo</span>
      </motion.div>
    </motion.div>
  );
}

// [modificación] Pantalla de invitación cuando hay registro abierto
function InvitationScreen({ currentTime }: { currentTime: Date | null }) {
  return (
    <motion.div
      key="invitation"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center min-h-screen text-center px-8"
    >
      {/* Título principal */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="mb-12"
      >
        <h1 className="text-7xl font-bold text-white mb-6">
          ¡Únete al Juego!
        </h1>
        <p className="text-3xl text-blue-200">
          DarSalud - Experiencia Interactiva
        </p>
      </motion.div>

      {/* Card de invitación */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-lg rounded-3xl p-16 max-w-4xl border border-white/30"
      >
        <div className="space-y-8">
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-8xl mb-8"
          >
            🎮
          </motion.div>

          <h2 className="text-5xl font-bold text-white mb-6">
            Acércate a la Tablet
          </h2>
          
          <p className="text-2xl text-white/90 leading-relaxed">
            Regístrate con el administrador para participar en nuestro 
            emocionante juego de conocimientos
          </p>

          <div className="bg-white/10 rounded-2xl p-8 mt-8">
            <h3 className="text-3xl font-semibold text-white mb-4">
              ¿Qué te espera?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white/80">
              <div className="text-center">
                <div className="text-4xl mb-2">❓</div>
                <p className="text-lg">Preguntas desafiantes</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">🏆</div>
                <p className="text-lg">Premios increíbles</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">⚡</div>
                <p className="text-lg">Acción en tiempo real</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tiempo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mt-8 text-white/60 text-xl"
      >
        {currentTime?.toLocaleTimeString('es-ES') || 'N/A'}
      </motion.div>
    </motion.div>
  );
}

// [modificación] Pantalla cuando el juego está activo
function GameActiveScreen({ currentSession }: { currentSession: GameSession }) {
  return (
    <motion.div
      key="game-active"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex flex-col items-center justify-center min-h-screen text-center px-8"
    >
      {/* Jugador actual */}
      <motion.div
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
      </motion.div>

      {/* Indicadores de progreso */}
      <motion.div
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
      </motion.div>

      {/* Puntuación si existe */}
      {currentSession.score !== undefined && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 bg-white/10 rounded-2xl p-6"
        >
          <p className="text-2xl text-white/80">Puntuación</p>
          <p className="text-5xl font-bold text-yellow-400">{currentSession.score}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

// [modificación] Pantalla cuando el juego termina
function GameCompletedScreen({ currentSession }: { currentSession: GameSession }) {
  return (
    <motion.div
      key="game-completed"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex flex-col items-center justify-center min-h-screen text-center px-8"
    >
      {/* Celebración */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="mb-12"
      >
        <motion.div
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
        </motion.div>
        <h1 className="text-7xl font-bold text-white mb-4">
          ¡Juego Completado!
        </h1>
      </motion.div>

      {/* Resultados */}
      <motion.div
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-8 text-white/70"
        >
          <p className="text-xl">¡Gracias por participar!</p>
          <p className="text-lg mt-2">Esperando próximo jugador...</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
} 