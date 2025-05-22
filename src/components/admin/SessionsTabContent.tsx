// src/components/admin/SessionsTabContent.tsx
import { motion } from 'framer-motion';
import { FiCalendar, FiPlusCircle, FiClock, FiUser, FiPlay, FiXCircle } from 'react-icons/fi';
import Button from '@/components/ui/Button';
// [modificación] Importar animaciones desde el archivo centralizado
import { fadeInUp, staggerContainer } from '@/utils/animations';
// [modificación] Importar useRef y useState para controlar navegaciones
import { useRef, useState } from 'react';
// [modificación] Importar el store global de navegación
import { useNavigationStore } from '@/store/navigationStore';
import { useGameStore } from '@/store/gameStore';
// [modificación] Importar PlaySession para usar la interfaz directamente
import { PlaySession } from '@/types';

interface SessionsTabContentProps {
  activeSessions: PlaySession[];
  onCreateNewSession: () => void;
  isLoadingCreation: boolean;
  isLoadingList: boolean;
}

const SessionsTabContent: React.FC<SessionsTabContentProps> = ({
  activeSessions,
  onCreateNewSession,
  isLoadingCreation,
  isLoadingList,
}) => {
  // [modificación] Ref para evitar múltiples navegaciones
  const navigationInProgress = useRef(false);
  // [modificación] Estado para seguimiento de cuál sesión está siendo activada
  const [activatingSession, setActivatingSession] = useState<string | null>(null);
  const [closingSession, setClosingSession] = useState<string | null>(null);
  // [modificación] Acceder al store global de navegación
  const startNavigation = useNavigationStore(state => state.startNavigation);
  const updateSessionStatus = useGameStore(state => state.updateSessionStatus);

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
    
    // Asegurarse de que la sesión quede en estado de registro pendiente
    // para que al navegar al formulario se pueda completar el registro
    updateSessionStatus(session.session_id, 'pending_player_registration');

    const targetPath = `/register/${session.session_id}`;
    console.log(`Iniciando navegación con overlay global a: ${targetPath}`);

    startNavigation(targetPath, 'Activando sesión de juego...');
    
    // Restablecer el estado local después de un tiempo
    setTimeout(() => {
      navigationInProgress.current = false;
      setActivatingSession(null);
    }, 500);
  };

  const handleCloseSession = async (session: PlaySession, e: React.MouseEvent) => {
    e.stopPropagation();
    if (closingSession) return;
    setClosingSession(session.session_id);
    await updateSessionStatus(session.session_id, 'completed');
    setClosingSession(null);
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
      case 'playing':
        return 'Activada';
      case 'completed':
        return 'Completado';
      case 'archived':
        return 'Archivado';
      default:
        return status;
    }
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
                  
                  {/* [modificación] Actualizar los botones con estado de activación */}
                  <div className="flex gap-2 mt-2 sm:mt-0">
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
                          {session.status === 'playing' ? 'Activada' : 'Activar'}
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={(e) => handleCloseSession(session, e)}
                      variant="custom"
                      disabled={closingSession === session.session_id}
                      className="bg-red-500/80 hover:bg-red-600/90 text-white text-xs py-1.5 px-3 rounded-md shadow-sm flex items-center border border-red-400/50 transition-colors duration-300"
                    >
                      {closingSession === session.session_id ? (
                        <>
                          <span className="w-3 h-3 mr-2 rounded-full bg-black/80 animate-pulse"></span>
                          Cerrando...
                        </>
                      ) : (
                        <>
                          <FiXCircle className="mr-1" size={12} />
                          Cerrar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default SessionsTabContent;