import { motion } from 'framer-motion';
import { FiX, FiUser, FiMail, FiBriefcase, FiCalendar, FiLoader } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { fadeInUp, staggerContainer } from '@/utils/animations';
import type { Participant } from '@/types';

interface ParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  isLoading: boolean;
  totalCount: number;
}

const ParticipantsModal: React.FC<ParticipantsModalProps> = ({
  isOpen,
  onClose,
  participants,
  isLoading,
  totalCount,
}) => {
  if (!isOpen) return null;

  // [modificación] Función para formatear la fecha
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha no disponible';
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* [modificación] Header del modal */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div>
            <h2 className="text-2xl font-marineBold text-white">
              Lista de Participantes
            </h2>
            <p className="text-white/70 text-sm mt-1">
              Total: {totalCount} participantes únicos
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="custom"
            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors duration-200"
          >
            <FiX size={20} />
          </Button>
        </div>

        {/* [modificación] Contenido del modal */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {isLoading ? (
            <motion.div 
              className="flex flex-col items-center justify-center py-12"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={fadeInUp} className="flex items-center gap-3 text-white/80">
                <FiLoader className="animate-spin" size={24} />
                <span className="text-lg font-marineRegular">Cargando participantes...</span>
              </motion.div>
            </motion.div>
          ) : participants.length === 0 ? (
            <motion.div 
              className="text-center py-12"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={fadeInUp} className="text-white/70">
                <FiUser className="mx-auto mb-4" size={48} />
                <h3 className="text-xl font-marineBold mb-2">No hay participantes</h3>
                <p className="text-white/60">Aún no se han registrado participantes en el sistema.</p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {participants.map((participant, index) => (
                <motion.div
                  key={participant.email || index}
                  variants={fadeInUp}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="space-y-3">
                    {/* [modificación] Nombre y apellido */}
                    <div className="flex items-center gap-2">
                      <FiUser className="text-blue-300" size={16} />
                      <span className="text-white font-marineBold">
                        {participant.nombre} {participant.apellido || ''}
                      </span>
                    </div>

                    {/* [modificación] Email */}
                    {participant.email && (
                      <div className="flex items-center gap-2">
                        <FiMail className="text-green-300" size={16} />
                        <span className="text-white/80 text-sm break-all">
                          {participant.email}
                        </span>
                      </div>
                    )}

                    {/* [modificación] Especialidad */}
                    {participant.especialidad && (
                      <div className="flex items-center gap-2">
                        <FiBriefcase className="text-purple-300" size={16} />
                        <span className="text-white/80 text-sm">
                          {participant.especialidad}
                        </span>
                      </div>
                    )}

                    {/* [modificación] Fecha de registro */}
                    {participant.created_at && (
                      <div className="flex items-center gap-2">
                        <FiCalendar className="text-orange-300" size={16} />
                        <span className="text-white/60 text-xs">
                          Registrado: {formatDate(participant.created_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* [modificación] Footer del modal */}
        <div className="p-6 border-t border-white/20 bg-black/20">
          <div className="flex justify-between items-center">
            <span className="text-white/60 text-sm">
              Mostrando {participants.length} de {totalCount} participantes
            </span>
            <Button
              onClick={onClose}
              variant="custom"
              className="bg-blue-500/80 hover:bg-blue-600/90 text-white font-marineBold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ParticipantsModal; 