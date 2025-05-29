// src/components/admin/SessionDetailView.tsx
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCheckCircle, FiActivity } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import AdminPlayerForm from './AdminPlayerForm'; // Asume que este es tu componente
import { useRouter } from 'next/navigation';
import { fadeInUp, staggerContainer } from '@/utils/animations';
import { PlaySession } from '@/types';

interface SessionDetailViewProps {
  session: PlaySession;
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
          <span className="text-slate-300 font-mono text-lg">
            #{session.session_id.substring(0, 8)}
          </span>
        </motion.h3>
      </div>
      <Button
        onClick={onBackToSessions}
        variant="custom"
        className="flex items-center text-xs text-slate-300 hover:text-white font-sans mb-5 transition-colors duration-300"
        aria-label="Volver a la lista de juegos"
      >
        <FiArrowLeft className="mr-1" size={16} />
        Volver a Juegos
      </Button>

      <motion.div
        variants={fadeInUp}
        className="bg-white/10 backdrop-blur-sm p-5 md:p-6 rounded-xl shadow-lg mb-6 border border-white/20"
      >
        {/* ... (mostrar detalles de la sesión como ID, Estado, Creada, Actualizada) ... */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <p className="text-xs text-slate-300 mb-0.5 font-marineBold">ID de Base de Datos:</p>
            <p className="font-mono text-slate-200 bg-white/10 p-2 rounded break-all text-sm border border-white/20">
              {session.id || 'No disponible'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-300 mb-0.5 font-marineBold">ID de Sesión:</p>
            <p className="font-mono text-slate-200 bg-white/10 p-2 rounded break-all text-sm border border-white/20">
              {session.session_id}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-300 mb-0.5 font-marineBold">Estado:</p>
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-marineBold 
                bg-white/10 text-white border border-white/30`}
            >
                {session.status === 'pending_player_registration' && (<><span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>Pendiente</>)}
                {session.status === 'player_registered' && (<><span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>Registrado</>)}
                {session.status === 'completed' && (<><FiCheckCircle className="mr-1.5" size={14} />Completado</>)}
                {!['pending_player_registration', 'player_registered', 'completed'].includes(session.status) && session.status}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-300 mb-0.5 font-marineBold">Creada:</p>
            <p className="text-slate-200 text-sm font-sans">{new Date(session.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
          <div>
            <p className="text-xs text-slate-300 mb-0.5 font-marineBold">Últ. Actualización:</p>
            <p className="text-slate-200 text-sm font-sans">{new Date(session.admin_updated_at || session.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
        </div>
      </motion.div>

      {session.status === 'pending_player_registration' && (
        <motion.div variants={fadeInUp} className="mb-8">
          <h4 className="text-lg font-marineBold mb-3 text-white">Registrar Nuevo Jugador</h4>
          <div className="bg-white/10 backdrop-blur-sm p-5 md:p-6 rounded-xl shadow-lg border border-white/20">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <Button
                onClick={() => router.push(`/register/${session.session_id}`)}
                variant="custom"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-marineBold py-2.5 px-5 rounded-lg shadow-md border border-green-400/50 transition-colors duration-300"
              >
                Ir a Página de Registro
              </Button>
              <p className="text-slate-300 text-sm font-sans">
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
          <div className="bg-white/10 backdrop-blur-sm p-5 md:p-6 rounded-xl shadow-lg border border-white/20">
            {/* ... (mostrar info del jugador: Nombre, Email, Especialidad) ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                <p className="text-xs text-slate-300 mb-0.5 font-marineBold">Nombre Completo:</p>
                <p className="font-marineBold text-lg text-white">{session.nombre} {session.apellido || ''}</p>
                </div>
                <div>
                <p className="text-xs text-slate-300 mb-0.5 font-marineBold">Email:</p>
                <p className="text-slate-200 break-all text-sm font-sans">{session.email}</p>
                </div>
                {session.especialidad && (
                <div>
                    <p className="text-xs text-slate-300 mb-0.5 font-marineBold">Especialidad:</p>
                    <p className="text-slate-200 text-sm font-sans">{session.especialidad}</p>
                </div>
                )}
            </div>
            <div className="mt-8 flex flex-wrap gap-3 md:gap-4">
              <Button
                onClick={() => {
                  // [modificación] Actualizar estado a 'playing' antes de navegar
                  onUpdateStatus(session.session_id, 'playing').then(() => {
                    // [modificación] Navegar a la ruta correcta /game/[sessionId]
                    router.push(`/game/${session.session_id}`);
                  }).catch((error) => {
                    console.error('Error al actualizar estado antes de navegar:', error);
                    // [modificación] Navegar de todas formas en caso de error
                    router.push(`/game/${session.session_id}`);
                  });
                }}
                variant="custom"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-marineBold py-2.5 px-5 rounded-lg shadow-md border border-blue-400/50 transition-colors duration-300"
                disabled={isLoadingUpdate}
              >
                <FiActivity className="mr-2" size={18} />
                {isLoadingUpdate ? 'Actualizando...' : 'Ir a Jugar'}
              </Button>
              <Button
                onClick={() => onUpdateStatus(session.session_id, 'completed')}
                variant="custom"
                className="bg-white/10 hover:bg-white/20 text-white font-marineBold py-2.5 px-5 rounded-lg shadow-md border border-white/20 transition-colors duration-300"
                disabled={isLoadingUpdate}
              >
                <FiCheckCircle className="mr-2" size={18} />
                {isLoadingUpdate ? 'Actualizando...' : 'Marcar Completado'}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
       {session.status === 'completed' && (
            <motion.div variants={fadeInUp} className="bg-white/10 backdrop-blur-sm p-5 md:p-6 rounded-xl shadow-lg text-center border border-white/20">
                <FiCheckCircle className="text-green-400 mx-auto mb-3" size={48} />
                <h4 className="text-lg font-marineBold text-white mb-2">Este juego ha sido completado.</h4>
                {session.nombre && <p className="text-slate-200 text-sm mb-1 font-sans">Jugador: {session.nombre} {session.apellido || ''}</p>}
                {session.email && <p className="text-slate-300 text-xs font-sans">Email: {session.email}</p>}
            </motion.div>
        )}
    </motion.div>
  );
};

export default SessionDetailView;

