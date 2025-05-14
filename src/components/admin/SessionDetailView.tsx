// src/components/admin/SessionDetailView.tsx
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCheckCircle, FiActivity } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import AdminPlayerForm from './AdminPlayerForm'; // Asume que este es tu componente
import { useRouter } from 'next/navigation';
import { fadeInUp, staggerContainer } from '@/utils/animations';

interface Session {
  id?: string;
  session_id: string;
  status: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  especialidad?: string;
  created_at: string;
  admin_updated_at?: string;
  // Otros campos necesarios
}

interface SessionDetailViewProps {
  session: Session;
  onBackToSessions: () => void;
  onUpdateStatus: (sessionId: string, status: string) => Promise<void>;
  isLoadingUpdate: boolean;
  // Prop para manejar el registro del jugador si AdminPlayerForm no lo hace internamente
  onPlayerRegistered?: () => void; // Para refrescar o cambiar estado
}

const SessionDetailView: React.FC<SessionDetailViewProps> = ({
  session,
  onBackToSessions,
  onUpdateStatus,
  isLoadingUpdate,
  onPlayerRegistered,
}) => {
  const router = useRouter(); // Si necesitas navegar desde aquí

  return (
    // No necesita role="tabpanel" si no es una pestaña principal
    <motion.div variants={staggerContainer} initial="hidden" animate="visible">
      <div className="flex items-center justify-between mb-2">
        <motion.h3 variants={fadeInUp} className="text-xl font-marineBold text-white">
          Detalles del Juego{' '}
          <span className="text-white/80 font-mono text-lg">
            #{session.session_id.substring(0, 8)}
          </span>
        </motion.h3>
      </div>
      <Button
        onClick={onBackToSessions}
        variant="custom"
        className="flex items-center text-xs text-white hover:text-white/80 font-marineRegular mb-5 transition-colors duration-300"
        aria-label="Volver a la lista de juegos"
      >
        <FiArrowLeft className="mr-1" size={16} />
        Volver a Juegos
      </Button>

      <motion.div
        variants={fadeInUp}
        className="bg-slate-900/20 backdrop-blur-sm p-5 md:p-6 rounded-xl shadow-lg mb-6 border border-white/10"
      >
        {/* ... (mostrar detalles de la sesión como ID, Estado, Creada, Actualizada) ... */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <p className="text-xs text-white/60 mb-0.5 font-marineRegular">ID de Base de Datos:</p>
            <p className="font-mono text-white/80 bg-slate-900/30 p-2 rounded break-all text-sm border border-white/10">
              {session.id || 'No disponible'}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-0.5 font-marineRegular">ID de Sesión:</p>
            <p className="font-mono text-white/80 bg-slate-900/30 p-2 rounded break-all text-sm border border-white/10">
              {session.session_id}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-0.5 font-marineRegular">Estado:</p>
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-marineBold 
                bg-slate-900/30 text-white border border-white/20`}
            >
                {session.status === 'pending_player_registration' && (<><span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>Pendiente</>)}
                {session.status === 'player_registered' && (<><span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>Registrado</>)}
                {session.status === 'completed' && (<><FiCheckCircle className="mr-1.5" size={14} />Completado</>)}
                {!['pending_player_registration', 'player_registered', 'completed'].includes(session.status) && session.status}
            </span>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-0.5 font-marineRegular">Creada:</p>
            <p className="text-white/90 text-sm">{new Date(session.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-0.5 font-marineRegular">Últ. Actualización:</p>
            <p className="text-white/90 text-sm">{new Date(session.admin_updated_at || session.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
        </div>
      </motion.div>

      {session.status === 'pending_player_registration' && (
        <motion.div variants={fadeInUp} className="mb-8">
          <h4 className="text-lg font-marineBold mb-3 text-white">Registrar Nuevo Jugador</h4>
          <div className="bg-slate-900/20 backdrop-blur-sm p-5 md:p-6 rounded-xl shadow-lg border border-white/10">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <Button
                onClick={() => router.push(`/register/${session.session_id}`)}
                variant="custom"
                className="bg-green-600/80 hover:bg-green-700/80 text-white font-marineBold py-2.5 px-5 rounded-lg shadow-md border border-white/20 transition-colors duration-300"
              >
                Ir a Página de Registro
              </Button>
              <p className="text-white/80 text-sm">
                Puedes registrar al jugador directamente desde esta pantalla o ir a la página de registro pública.
              </p>
            </div>

            <AdminPlayerForm
                sessionId={session.session_id}
                onPlayerRegistered={() => {
                    // Lógica para cuando el jugador es registrado.
                    // Supabase real-time debería actualizar el estado de la sesión.
                    // Si necesitas forzar un refresh o cambiar UI inmediatamente:
                    if(onPlayerRegistered) onPlayerRegistered();
                }}
            />
          </div>
        </motion.div>
      )}

      {session.status === 'player_registered' && (
        <motion.div variants={fadeInUp} className="mb-8">
          <h4 className="text-lg font-marineBold mb-3 text-white">Datos del Jugador Registrado</h4>
          <div className="bg-slate-900/20 backdrop-blur-sm p-5 md:p-6 rounded-xl shadow-lg border border-white/10">
            {/* ... (mostrar info del jugador: Nombre, Email, Especialidad) ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                <p className="text-xs text-white/60 mb-0.5 font-marineRegular">Nombre Completo:</p>
                <p className="font-marineBold text-lg text-white">{session.nombre} {session.apellido || ''}</p>
                </div>
                <div>
                <p className="text-xs text-white/60 mb-0.5 font-marineRegular">Email:</p>
                <p className="text-white/90 break-all text-sm">{session.email}</p>
                </div>
                {session.especialidad && (
                <div>
                    <p className="text-xs text-white/60 mb-0.5 font-marineRegular">Especialidad:</p>
                    <p className="text-white/90 text-sm">{session.especialidad}</p>
                </div>
                )}
            </div>
            <div className="mt-8 flex flex-wrap gap-3 md:gap-4">
              <Button
                onClick={() => router.push(`/game/roulette?session=${session.session_id}`)} // [modificación] Corregir la ruta a la ruleta
                variant="custom"
                className="bg-slate-900/30 hover:bg-slate-900/50 text-white font-marineBold py-2.5 px-5 rounded-lg shadow-md border border-white/20 transition-colors duration-300"
              >
                <FiActivity className="mr-2" size={18} />
                Ir a Jugar
              </Button>
              <Button
                onClick={() => onUpdateStatus(session.session_id, 'completed')}
                variant="custom"
                className="bg-slate-900/30 hover:bg-slate-900/50 text-white font-marineBold py-2.5 px-5 rounded-lg shadow-md border border-white/20 transition-colors duration-300"
                disabled={isLoadingUpdate || session.status === 'completed'}
              >
                <FiCheckCircle className="mr-2" size={18} />
                {isLoadingUpdate ? 'Actualizando...' : 'Marcar Completado'}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
       {session.status === 'completed' && (
            <motion.div variants={fadeInUp} className="bg-slate-900/20 backdrop-blur-sm p-5 md:p-6 rounded-xl shadow-lg text-center border border-white/10">
                <FiCheckCircle className="text-white mx-auto mb-3" size={48} />
                <h4 className="text-lg font-marineBold text-white mb-2">Este juego ha sido completado.</h4>
                {session.nombre && <p className="text-white/80 text-sm mb-1">Jugador: {session.nombre} {session.apellido || ''}</p>}
                {session.email && <p className="text-white/70 text-xs">Email: {session.email}</p>}
            </motion.div>
        )}
    </motion.div>
  );
};

export default SessionDetailView;

