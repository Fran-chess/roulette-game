// src/components/admin/SessionsTabContent.tsx
import { motion } from 'framer-motion';
import { FiCalendar, FiPlusCircle, FiClock, FiUser, FiPlay, FiXCircle } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
// [modificación] Importar animaciones desde el archivo centralizado
import { fadeInUp, staggerContainer } from '@/utils/animations';
// [modificación] Importar useRef y useState para controlar navegaciones
import { useRef, useState } from 'react';
// [modificación] Importar el store global de navegación
import { useNavigationStore } from '@/store/navigationStore';
// [modificación] Importar PlaySession para usar la interfaz directamente
import { PlaySession } from '@/types';

interface SessionsTabContentProps {
  activeSessions: PlaySession[];
  onCreateNewSession: () => void;
  isLoadingCreation: boolean;
  isLoadingList: boolean;
  // [modificación] Agregar función para actualizar la lista de sesiones
  onRefreshSessions?: () => void;
}

const SessionsTabContent: React.FC<SessionsTabContentProps> = ({
  activeSessions,
  onCreateNewSession,
  isLoadingCreation,
  isLoadingList,
  onRefreshSessions,
}) => {
  // [modificación] Ref para evitar múltiples navegaciones
  const navigationInProgress = useRef(false);
  // [modificación] Estado para seguimiento de cuál sesión está siendo activada
  const [activatingSession, setActivatingSession] = useState<string | null>(null);
  // [modificación] Estado para la sesión de información en el modal
  const [infoSession, setInfoSession] = useState<PlaySession | null>(null);
  // [modificación] Estado para confirmar cierre de sesión
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  // [modificación] Estado para seguimiento de cierre de sesión en progreso
  const [closingSession, setClosingSession] = useState(false);
  // [modificación] Acceder al store global de navegación
  const startNavigation = useNavigationStore(state => state.startNavigation);

  // [modificación] Función para seleccionar una sesión y mostrar su información
  const onSelectSession = (session: PlaySession) => {
    setInfoSession(session);
    setShowCloseConfirmation(false);
  };

  // Nueva función: abrir modal directamente en modo de cierre
  const onQuickCloseSession = (session: PlaySession) => {
    setInfoSession(session);
    setShowCloseConfirmation(true);
  };


  // [modificación] Función para iniciar el proceso de cierre de sesión
  const handleCloseSession = () => {
    setShowCloseConfirmation(true);
  };

  // [modificación] Función para confirmar y ejecutar el cierre de sesión
  const confirmCloseSession = async () => {
    if (!infoSession) return;
    
    setClosingSession(true);
    try {
      const response = await fetch(`/api/admin/sessions/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: infoSession.session_id,
        }),
      });

      if (response.ok) {
        console.log('Sesión cerrada exitosamente');
        // [modificación] Cerrar modal y refrescar lista
        setInfoSession(null);
        setShowCloseConfirmation(false);
        // [modificación] Refrescar la lista de sesiones si la función está disponible
        if (onRefreshSessions) {
          onRefreshSessions();
        }
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('Error al cerrar la sesión', errorData);
      }
    } catch (error) {
      console.error('Error de red al cerrar la sesión:', error);
    } finally {
      setClosingSession(false);
    }
  };

  // [modificación] Función para cancelar el cierre de sesión
  const cancelCloseSession = () => {
    setShowCloseConfirmation(false);
  };

  // [modificación] Función para activar la partida usando el overlay global
  const handleActivateGame = (session: PlaySession, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se propague al contenedor
    
    // [modificación] Guard para evitar navegaciones múltiples
    if (navigationInProgress.current) {
      console.log("Navegación en progreso, evitando redirección duplicada");
      return;
    }
    
    // [modificación] Marcar la sesión que está siendo activada para feedback visual
    setActivatingSession(session.session_id);
    navigationInProgress.current = true;
    
    // [modificación] Usar el overlay global para la navegación
    const targetPath = `/register/${session.session_id}`;
    console.log(`Iniciando navegación con overlay global a: ${targetPath}`);

    startNavigation(targetPath, 'Activando sesión de juego...');
    
    // Restablecer el estado local después de un tiempo
    setTimeout(() => {
      navigationInProgress.current = false;
      setActivatingSession(null);
    }, 500);
  };

  // [modificación] Función para obtener clases de estado según el status de la sesión con estilos actualizados
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'pending_player_registration':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'player_registered':
        return 'bg-green-100 text-green-800 border-green-300';
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
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_player_registration':
        return 'Pendiente Registro';
      case 'player_registered':
        return 'Jugador Registrado';
      case 'in_progress':
        return 'En Progreso';
      case 'completed':
        return 'Completado';
      case 'archived':
        return 'Archivado';
      default:
        return status;
    }
  };

  // [modificación] Función para cerrar el modal y resetear todos los estados
  const handleCloseModal = () => {
    setInfoSession(null);
    setShowCloseConfirmation(false);
    setClosingSession(false);
  };

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
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <motion.h3 variants={fadeInUp} className="text-xl md:text-2xl font-marineBold text-slate-800">
            Gestión de Juegos
          </motion.h3>
          <Button
            onClick={onCreateNewSession}
            variant="custom"
            className="bg-blue-500/80 hover:bg-blue-600/90 text-white font-marineBold py-2 px-3 rounded-lg shadow-md text-sm flex items-center border border-blue-400/50 transition-colors duration-300"
            disabled={isLoadingCreation}
          >
            <FiPlusCircle className="mr-1.5" size={16} />
            {isLoadingCreation ? 'Creando...' : 'Nuevo Juego'}
          </Button>
        </div>

        {isLoadingList && activeSessions.length === 0 && (
          <p className="text-center text-slate-700 py-8">Cargando juegos...</p>
        )}
        
        {!isLoadingList && activeSessions.length === 0 ? (
          <motion.div
            variants={fadeInUp}
            className="bg-black/5 backdrop-blur-sm rounded-xl shadow-lg p-6 text-center my-4 border border-white/30"
            whileHover={{ scale: 1.01, backgroundColor: "rgba(0, 0, 0, 0.1)" }}
          >
            <FiCalendar className="text-slate-600 mb-3 mx-auto" size={40} />
            <p className="text-slate-800 font-marineRegular mb-4 text-base md:text-lg">
              Aún no hay juegos registrados.
            </p>
            <Button
              onClick={onCreateNewSession}
              variant="custom"
              className="bg-blue-500/80 hover:bg-blue-600/90 text-white font-marineBold py-2.5 px-5 rounded-lg shadow-md border border-blue-400/50 transition-colors duration-300"
              disabled={isLoadingCreation}
            >
              {isLoadingCreation ? 'Creando...' : 'Crear el Primer Juego'}
            </Button>
          </motion.div>
        ) : (
          <motion.div variants={fadeInUp} className="grid gap-3">
            {activeSessions.map((session) => (
              <motion.div
                key={session.id || session.session_id}
                variants={fadeInUp}
                whileHover={{ 
                  scale: 1.01, 
                  backgroundColor: "rgba(0, 0, 0, 0.1)",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.07)"
                }}
                className="bg-black/5 hover:bg-black/10 border border-white/30 rounded-lg p-3 transition-all shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-marineBold ${getStatusClasses(session.status)}`}>
                        {getStatusText(session.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs mt-2">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <FiUser className="text-slate-500" size={12} />
                        <span>
                          {session.nombre ? `${session.nombre} ${session.apellido || ''}` : 'Sin registrar'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <FiClock className="text-slate-500" size={12} />
                        <span>
                          {new Date(session.created_at).toLocaleDateString()} {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* [modificación] Actualizar los botones con estado de activación y ocultar "Activar" si está completado */}
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    {/* [modificación] Solo mostrar botón Activar si la sesión NO está completada */}
                    {session.status !== 'completed' && (
                      <Button
                        onClick={(e) => handleActivateGame(session, e)}
                        variant="custom"
                        disabled={activatingSession === session.session_id}
                        className={`${
                          activatingSession === session.session_id
                            ? 'bg-blue-500/90 text-white/80 cursor-wait'
                            : 'bg-green-500/80 hover:bg-green-600/90 text-white'
                        } text-xs py-1.5 px-3 rounded-md shadow-sm flex items-center border border-green-400/50 transition-colors duration-300`}
                      >
                        {activatingSession === session.session_id ? (
                          <>
                            <span className="w-3 h-3 mr-2 rounded-full bg-black/80 animate-pulse"></span>
                            Activando...
                          </>
                        ) : (
                          <>
                            <FiPlay className="mr-1" size={12} />
                            Activar
                          </>
                        )}
                      </Button>
                    )}
                    
                    <Button
                      onClick={(e) => {
                      e.stopPropagation();
                      onQuickCloseSession(session);
                      }}
                      variant="custom"
                      disabled={activatingSession === session.session_id}
                      className="bg-black/5 hover:bg-black/10 text-slate-800 text-xs py-1.5 px-3 rounded-md shadow-sm flex items-center border border-white/30 transition-colors duration-300"
                    >
                      <FiXCircle className="mr-1" size={12} />
                      Cerrar
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      <Modal
        isOpen={!!infoSession}
        onClose={handleCloseModal}
        title="Información de la Partida"
      >
        {infoSession && (
          <div className="space-y-3 text-sm">
            <div className="space-y-2">
              <p>
                <span className="font-marineBold">ID:</span> {infoSession.session_id}
              </p>
              <p>
                <span className="font-marineBold">Estado:</span> {getStatusText(infoSession.status)}
              </p>
              <p>
                <span className="font-marineBold">Creada:</span>{' '}
                {new Date(infoSession.created_at).toLocaleString()}
              </p>
              {infoSession.nombre && (
                <p>
                  <span className="font-marineBold">Jugador:</span> {infoSession.nombre} {infoSession.apellido || ''}
                </p>
              )}
            </div>
            

            {/* [modificación] Sección de acciones para la sesión */}
            {!showCloseConfirmation ? (
              <div className="border-t border-white/20 pt-4 mt-4">
                <Button
                  onClick={handleCloseSession}
                  variant="custom"
                  className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/50 hover:border-red-300/70 py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  disabled={closingSession}
                >
                  <FiXCircle className="" size={14} />
                  Cerrar Sesión de Juego
                </Button>
              </div>
            ) : (
              /* [modificación] Interfaz de confirmación de cierre */
              <div className="border-t border-white/20 pt-4 mt-4">
                <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4 mb-3">
                  <h4 className="font-marineBold text-red-200 text-sm mb-2">
                    ⚠️ Confirmar Cierre de Sesión
                  </h4>
                  <p className="text-white/80 text-xs mb-3">
                    ¿Estás seguro de que quieres cerrar esta sesión de juego? Esta acción no se puede deshacer.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={confirmCloseSession}
                      variant="custom"
                      disabled={closingSession}
                      className="flex-1 bg-red-500/80 hover:bg-red-600/90 text-white border border-red-400/50 py-2 px-3 rounded-md text-xs transition-colors duration-200"
                    >
                      {closingSession ? 'Cerrando...' : 'Sí, Cerrar'}
                    </Button>
                    <Button
                      onClick={cancelCloseSession}
                      variant="custom"
                      disabled={closingSession}
                      className="flex-1 bg-slate-500/20 hover:bg-slate-500/30 text-slate-200 border border-slate-400/50 py-2 px-3 rounded-md text-xs transition-colors duration-200"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default SessionsTabContent;