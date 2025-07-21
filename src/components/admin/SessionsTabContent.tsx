// src/components/admin/SessionsTabContent.tsx
import React from 'react';
import { motion} from 'framer-motion';
import { FiCalendar, FiPlusCircle, FiClock, FiUser } from 'react-icons/fi';
import Button from '@/components/ui/Button';
// [modificación] Importar el modal de confirmación
import ConfirmModal from '@/components/ui/ConfirmModal';
// [modificación] Importar animaciones desde el archivo centralizado
import { fadeInUp, staggerContainer } from '@/utils/animations';
// [modificación] Importar useRef y useState para controlar navegaciones
import { useRef, useState, useEffect } from 'react';
// [modificación] Importar el store global de navegación
import { useNavigationStore } from '@/store/navigationStore';
// [modificación] Importar PlaySession para usar la interfaz directamente
import { PlaySession, Participant } from '@/types';
// [modificación] Importar SnackbarNotification para mostrar mensajes de estado
import SnackbarNotification from '@/components/ui/SnackbarNotification';
// [modificación] Importar el store del juego para acceder a la sesión activa
import { useGameStore } from '@/store/gameStore';

interface SessionsTabContentProps {
  activeSessions: PlaySession[];
  onCreateNewSession: () => void;
  isLoadingCreation: boolean;
  isLoadingList: boolean;
  // [modificación] Agregar función para actualizar la lista de sesiones
  onRefreshSessions?: () => void;
  // [modificación] Agregar función para seleccionar sesión y ver detalles
  onSelectSession?: (session: PlaySession) => void;
}

const SessionsTabContent: React.FC<SessionsTabContentProps> = ({
  activeSessions,
  onCreateNewSession,
  isLoadingCreation,
  isLoadingList,
  onRefreshSessions,
  onSelectSession,
}) => {
  // [modificación] Obtener la sesión activa del store
  const { adminState } = useGameStore();
  const activeSession = adminState.currentSession;
  
  // [modificación] Ref para evitar múltiples navegaciones
  const navigationInProgress = useRef(false);
  // [modificación] Estado para seguimiento de cuál sesión está siendo activada
  const [activatingSession, setActivatingSession] = useState<string | null>(null);
  // Estado para seguimiento de la sesión que se está cerrando
  const [closingSessionId, setClosingSessionId] = useState<string | null>(null);
  // Estado para seguimiento de la sesión que se está finalizando
  const [finalizingSessionId, setFinalizingSessionId] = useState<string | null>(null);
  // [modificación] Estados para el modal de cancelación
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState<string | null>(null);
  // Estados para el modal de finalización
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [sessionToFinish, setSessionToFinish] = useState<string | null>(null);
  // [modificación] Estado para almacenar los participantes de cada sesión
  const [sessionParticipants, setSessionParticipants] = useState<Map<string, Participant[]>>(new Map());
  // [modificación] Acceder al store global de navegación
  const startNavigation = useNavigationStore(state => state.startNavigation);
  
  // [modificación] Estados para notificaciones mejoradas
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // [modificación] Función para obtener TODOS los participantes de una sesión
  const fetchSessionParticipants = async (session: PlaySession) => {
    if (!session.session_id) {
      return [];
    }

    try {
      const response = await fetch(`/api/admin/sessions/participants?sessionId=${session.session_id}`);
      const data = await response.json();
      
      if (response.ok && data.participants && data.participants.length > 0) {
        return data.participants;
      }
    } catch (error) {
      console.error(`Error al obtener participantes para sesión ${session.session_id}:`, error);
    }
    
    return [];
  };

  // [modificación] Effect para cargar los participantes de todas las sesiones activas
  useEffect(() => {
    const loadParticipants = async () => {
      const newParticipantsMap = new Map<string, Participant[]>();
      
      // Cargar participantes para cada sesión
      for (const session of activeSessions) {
        if (session.session_id) {
          const participants = await fetchSessionParticipants(session);
          newParticipantsMap.set(session.session_id, participants);
        } else {
          newParticipantsMap.set(session.session_id, []);
        }
      }
      
      setSessionParticipants(newParticipantsMap);
    };

    if (activeSessions.length > 0) {
      loadParticipants();
    }
  }, [activeSessions]);

  // [modificación] Función helper para obtener los participantes de una sesión
  const getSessionParticipants = (sessionId: string): Participant[] => {
    return sessionParticipants.get(sessionId) || [];
  };

  // [modificación] Función para mostrar el modal de confirmación antes de cerrar la sesión
  const handleCloseSession = (session: PlaySession, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToCancel(session.session_id);
    setShowCancelModal(true);
  };





  // [modificación] Función para contar participantes de una sesión
  const getParticipantCount = (sessionId: string): number => {
    // Contar basándose en los participantes cargados
    const participants = sessionParticipants.get(sessionId) || [];
    return participants.length;
  };

  // [modificación] Función para formatear fechas
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // [modificación] Función para confirmar cancelación de sesión
  const confirmCancelSession = async () => {
    if (!sessionToCancel) return;

    setClosingSessionId(sessionToCancel);
    
    // [modificación] Mostrar notificación de progreso
    setNotification({
      type: 'success',
      message: 'Cancelando sesión...'
    });

    try {
      const response = await fetch('/api/admin/sessions/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: sessionToCancel }),
      });

      if (response.ok) {
        // [modificación] Mostrar notificación de éxito inmediato
        setNotification({
          type: 'success',
          message: 'Sesión cancelada exitosamente'
        });
        
        // [modificación] Actualizar la lista inmediatamente
        if (onRefreshSessions) {
          await onRefreshSessions();
        }
        
        // [modificación] Limpiar la notificación después de 3 segundos
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Error al cancelar la sesión';
        
        // [modificación] Mostrar notificación de error específico
        setNotification({
          type: 'error',
          message: errorMessage
        });
        
        console.error('Error al cancelar la sesión:', errorMessage);
        
        // [modificación] Limpiar la notificación de error después de 5 segundos
        setTimeout(() => {
          setNotification(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Error de red al cancelar la sesión:', error);
      
      // [modificación] Mostrar notificación de error de conexión
      setNotification({
        type: 'error',
        message: 'Error de conexión. Inténtalo nuevamente.'
      });
      
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    } finally {
      setClosingSessionId(null);
      setShowCancelModal(false);
      setSessionToCancel(null);
    }
  };

  // Función para mostrar el modal de finalización
  const handleFinishSession = (session: PlaySession, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToFinish(session.session_id);
    setShowFinishModal(true);
  };

  // Función para confirmar finalización de sesión
  const confirmFinishSession = async () => {
    if (!sessionToFinish) return;

    setFinalizingSessionId(sessionToFinish);
    
    // [modificación] Mostrar notificación de progreso
    setNotification({
      type: 'success',
      message: 'Finalizando sesión...'
    });

    try {
      const response = await fetch('/api/admin/sessions/finish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: sessionToFinish }),
      });

      if (response.ok) {
        // [modificación] Mostrar notificación de éxito inmediato
        setNotification({
          type: 'success',
          message: 'Sesión finalizada exitosamente'
        });
        
        // [modificación] Actualizar la lista inmediatamente
        if (onRefreshSessions) {
          await onRefreshSessions();
        }
        
        // [modificación] Limpiar la notificación después de 3 segundos
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Error al finalizar la sesión';
        
        // [modificación] Mostrar notificación de error específico
        setNotification({
          type: 'error',
          message: errorMessage
        });
        
        console.error('Error al finalizar la sesión:', errorMessage);
        
        // [modificación] Limpiar la notificación de error después de 5 segundos
        setTimeout(() => {
          setNotification(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Error de red al finalizar la sesión:', error);
      
      // [modificación] Mostrar notificación de error de conexión
      setNotification({
        type: 'error',
        message: 'Error de conexión. Inténtalo nuevamente.'
      });
      
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    } finally {
      setFinalizingSessionId(null);
      setShowFinishModal(false);
      setSessionToFinish(null);
    }
  };

  // [modificación] Función para activar la partida usando el overlay global
  const handleActivateGame = (session: PlaySession, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se propague al contenedor
    
    // [modificación] Guard para evitar navegaciones múltiples
    if (navigationInProgress.current) {
// //       console.log("Navegación en progreso, evitando redirección duplicada");
      return;
    }
    
    // [modificación] Marcar la sesión que está siendo activada para feedback visual
    setActivatingSession(session.session_id);
    navigationInProgress.current = true;
    
    // [modificación] Determinar la ruta según el estado de la sesión
    // Para single session en tablet admin, siempre ir a registro
    const targetPath = `/register/${session.session_id}`;
    const loadingMessage = 'Activando sesión de registro...';

// //     console.log(`Iniciando navegación con overlay global a: ${targetPath}`);

    startNavigation(targetPath, loadingMessage);
    
    // Restablecer el estado local después de un tiempo
    setTimeout(() => {
      navigationInProgress.current = false;
      setActivatingSession(null);
    }, 500);
  };

  // [modificación] Función para obtener clases de estado según el status de la sesión con estilos actualizados
  const getStatusClasses = (status: string, sessionId: string) => {
    const participantCount = getParticipantCount(sessionId);
    
    // [modificación] Agregar estado visual especial para sesiones siendo finalizadas
    if (finalizingSessionId === sessionId) {
      return 'bg-orange-100 text-orange-800 border-orange-300 animate-pulse';
    }
    
    // [modificación] Agregar estado visual especial para sesiones siendo canceladas
    if (closingSessionId === sessionId) {
      return 'bg-red-100 text-red-800 border-red-300 animate-pulse';
    }
    
    switch (status) {
      case 'pending_player_registration':
        // [modificación] Si hay participantes, usar el mismo color que sesiones activas, sino amarillo
        return participantCount > 0 
          ? 'bg-blue-100 text-blue-800 border-blue-300'
          : 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'player_registered':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'playing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'archived':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      default:
        return 'bg-black/5 text-slate-800 border-white/30';
    }
  };

  // [modificación] Función para obtener el texto del estado según el status de la sesión
  const getStatusText = (status: string, sessionId?: string) => {
    // [modificación] Mostrar estado especial para sesiones siendo finalizadas
    if (sessionId && finalizingSessionId === sessionId) {
      return 'Finalizando...';
    }
    
    // [modificación] Mostrar estado especial para sesiones siendo canceladas
    if (sessionId && closingSessionId === sessionId) {
      return 'Cancelando...';
    }
    
    switch (status) {
      case 'pending_player_registration':
        // [modificación] Si hay participantes, la sesión está activa, sino está pendiente
        if (sessionId) {
          const participantCount = getParticipantCount(sessionId);
          return participantCount > 0 ? 'Activa' : 'Pendiente';
        }
        return 'Pendiente';
      case 'player_registered':
        return 'Activa';
      case 'in_progress':
        return 'Activa';
      case 'playing':
        return 'Activa';
      case 'completed':
        return 'Finalizada';
      case 'archived':
        return 'Finalizada';
      default:
        return 'Pendiente';
    }
  };

  // [modificación] Función para obtener el texto del botón según el contexto de la sesión
  const getButtonText = (session: PlaySession) => {
    const participants = getSessionParticipants(session.session_id);
    const hasParticipants = participants.length > 0;
    
    switch (session.status) {
      case 'pending_player_registration':
        return hasParticipants ? 'Continuar' : 'Activar';
      case 'player_registered':
        return 'Ir a Juego';
      case 'playing':
        return 'Ver Juego';
      default:
        return 'Activar';
    }
  };

  // [modificación] Función para obtener los estilos del botón según el contexto de la sesión
  const getButtonStyles = (session: PlaySession) => {
    const participants = getSessionParticipants(session.session_id);
    const hasParticipants = participants.length > 0;
    
    switch (session.status) {
      case 'pending_player_registration':
        return hasParticipants 
          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 border-blue-400/50'
          : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-green-400/50';
      case 'player_registered':
        return 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-purple-400/50';
      case 'playing':
        return 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 border-orange-400/50';
      default:
        return 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-green-400/50';
    }
  };



  // Ya no se utiliza modal para mostrar opciones

  return (
    <motion.div 
      role="tabpanel" 
      id="panel-sessions" 
      aria-labelledby="tab-sessions" 
      tabIndex={0}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={staggerContainer}
    >
      <div className="p-4 md:p-6 admin-content-spacing">
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6">
          <h3 className="text-xl md:text-2xl font-marineBold text-white mb-3 sm:mb-0 admin-dashboard-title">
            Gestión de Juegos
          </h3>
          {activeSession ? (
            <div className="text-center">
              <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg px-4 py-2 mb-2">
                <p className="text-yellow-200 text-sm font-marineBold">
                  Ya tienes una partida activa
                </p>
              </div>
              <p className="text-yellow-300 text-xs">
                Debes cerrar la partida actual para crear una nueva
              </p>
            </div>
          ) : (
            <Button
              onClick={onCreateNewSession}
              variant="custom"
              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-marineBold py-2 px-4 rounded-lg shadow-lg text-sm flex items-center justify-center border border-blue-400/50 transition-colors duration-300 admin-dashboard-button"
              disabled={isLoadingCreation}
            >
              <FiPlusCircle className="mr-2" size={16} />
              {isLoadingCreation ? 'Creando...' : 'Nuevo Juego'}
            </Button>
          )}
        </motion.div>

        {isLoadingList ? (
          <motion.div variants={fadeInUp} className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3 text-slate-300">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
              <span className="font-marineBold">Cargando juegos...</span>
            </div>
          </motion.div>
        ) : activeSessions.length === 0 ? (
          <motion.div variants={fadeInUp} className="text-center py-8">
            <FiCalendar className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h4 className="text-lg font-marineBold text-slate-300 mb-2">No hay juegos creados</h4>
            <p className="text-slate-400 mb-4 font-sans">Crea tu primer juego para comenzar</p>
            {activeSession ? (
              <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg px-6 py-4 mx-auto max-w-md">
                <p className="text-yellow-200 text-sm font-marineBold mb-2">
                  Ya tienes una partida activa
                </p>
                <p className="text-yellow-300 text-xs">
                  Debes cerrar la partida actual desde el Panel Principal para crear una nueva
                </p>
              </div>
            ) : (
              <Button
                onClick={onCreateNewSession}
                variant="custom"
                className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-marineBold py-2 px-4 rounded-lg shadow-lg text-sm flex items-center justify-center border border-blue-400/50 transition-colors duration-300 mx-auto admin-dashboard-button"
                disabled={isLoadingCreation}
              >
                <FiPlusCircle className="mr-2" size={16} />
                {isLoadingCreation ? 'Creando...' : 'Crear Primer Juego'}
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div variants={fadeInUp} className="grid gap-3 admin-sessions-list">
            {activeSessions.map((session) => (
              <motion.div
                key={session.id || session.session_id}
                variants={fadeInUp}
                whileHover={{ 
                  scale: 1.01, 
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)"
                }}
                className={`bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg p-4 transition-all shadow-md admin-session-item ${
                  finalizingSessionId === session.session_id ? 'opacity-75' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center">
                      <span className={`px-4 py-2 rounded-full text-base font-marineBold ${getStatusClasses(session.status, session.session_id)}`}>
                        {getStatusText(session.status, session.session_id)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-base text-slate-200">
                      <FiUser size={18} />
                      <span className="font-marineBold">{getParticipantCount(session.session_id)} participante{getParticipantCount(session.session_id) !== 1 ? 's' : ''}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-base text-slate-300">
                      <FiClock size={18} />
                      <span className="font-marineRegular">{formatDate(session.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3 sm:mt-0">
                    {/* Solo mostrar botones si la sesión no está finalizada */}
                    {session.status !== 'completed' && session.status !== 'archived' && (
                      <>
                        <Button
                          onClick={(e) => handleActivateGame(session, e)}
                          variant="custom"
                          disabled={activatingSession === session.session_id || finalizingSessionId === session.session_id}
                          className={`text-white font-marineBold py-3 px-6 rounded-lg shadow-lg text-sm transition-all duration-300 hover:shadow-xl transform hover:scale-105 admin-session-button ${getButtonStyles(session)}`}
                        >
                          {getButtonText(session)}
                        </Button>
                        
                        {/* Botón Cancelar para sesiones pendientes */}
                        {session.status === 'pending_player_registration' && (
                          <Button
                            onClick={(e) => handleCloseSession(session, e)}
                            variant="custom"
                            disabled={closingSessionId === session.session_id || finalizingSessionId === session.session_id}
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-marineBold py-3 px-6 rounded-lg shadow-lg text-sm transition-all duration-300 hover:shadow-xl transform hover:scale-105 admin-session-button"
                          >
                            {closingSessionId === session.session_id ? 'Cancelando...' : 'Cancelar'}
                          </Button>
                        )}
                        
                        {/* Botón Ver Detalles */}
                        {onSelectSession && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSession(session);
                            }}
                            variant="custom"
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-marineBold py-3 px-6 rounded-lg shadow-lg text-sm transition-all duration-300 hover:shadow-xl transform hover:scale-105 admin-session-button"
                          >
                            Ver Detalles
                          </Button>
                        )}
                        
                        {/* Botón Finalizar para sesiones activas */}
                        {(session.status === 'player_registered' || session.status === 'playing') && (
                          <Button
                            onClick={(e) => handleFinishSession(session, e)}
                            variant="custom"
                            disabled={finalizingSessionId === session.session_id}
                            className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-marineBold py-3 px-6 rounded-lg shadow-lg text-sm transition-all duration-300 hover:shadow-xl transform hover:scale-105 admin-session-button"
                          >
                            {finalizingSessionId === session.session_id ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Finalizando...
                              </div>
                            ) : (
                              'Finalizar'
                            )}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      
      {/* [modificación] Modal de confirmación para cancelar sesión */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={confirmCancelSession}
        title="Cancelar Juego"
        message="¿Estás seguro de que deseas cancelar este juego? Esta acción no se puede deshacer."
        confirmText="Sí, Cancelar"
        cancelText="No, Mantener"
        type="confirm"
      />
      
      {/* Modal de confirmación para finalizar sesión */}
      <ConfirmModal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        onConfirm={confirmFinishSession}
        title="Finalizar Juego"
        message="¿Estás seguro de que deseas finalizar este juego? Una vez finalizado no se podrá continuar."
        confirmText="Sí, Finalizar"
        cancelText="No, Continuar"
        type="confirm"
      />
      
      {/* [modificación] Notificación de estado mejorada */}
      {notification && (
        <SnackbarNotification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </motion.div>
  );
};

export default SessionsTabContent;
