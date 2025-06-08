import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUser, FiMail, FiBriefcase, FiCalendar, FiLoader, FiUsers, FiChevronDown } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { fadeInUp, staggerContainer } from '@/utils/animations';
import type { Participant } from '@/types';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface ParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  isLoading: boolean;
  totalCount: number;
}

// Interfaz para participantes agrupados por fecha
interface ParticipantsByDate {
  [date: string]: Participant[];
}

// Configuración de límites
const INITIAL_PARTICIPANTS_PER_DATE = 6; // Mostrar inicialmente 6 por fecha
const LOAD_MORE_INCREMENT = 12; // Cargar 12 más cada vez

const ParticipantsModal: React.FC<ParticipantsModalProps> = ({
  isOpen,
  onClose,
  participants,
  isLoading,
  totalCount,
}) => {
  const [mounted, setMounted] = useState(false);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [participantsLimits, setParticipantsLimits] = useState<Map<string, number>>(new Map());


  // Usar directamente todos los participantes sin filtros
  const filteredParticipants = participants;

  // Hook para asegurar que el componente esté montado en el cliente
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Log de debugging para ver los datos que llegan
  useEffect(() => {
    if (isOpen) {
      console.log('🎭 ParticipantsModal: Abierto con datos:', {
        isLoading,
        totalCount,
        participantsLength: participants.length,
        participants: participants.slice(0, 3) // Solo primeros 3 para no llenar la consola
      });
    }
  }, [isOpen, isLoading, totalCount, participants]);

  // Reset estados cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setCollapsedDates(new Set());
      setParticipantsLimits(new Map());
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // Función para formatear la fecha solo con día, mes, año
  const formatDateKey = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Fecha no disponible';
    }
  };

  // Función para formatear la fecha completa con hora
  const formatDateTime = (dateString: string) => {
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

  // Agrupar participantes filtrados por fecha de registro
  const groupParticipantsByDate = (participants: Participant[]): ParticipantsByDate => {
    return participants.reduce((groups, participant) => {
      const dateKey = participant.created_at ? formatDateKey(participant.created_at) : 'Sin fecha';
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(participant);
      return groups;
    }, {} as ParticipantsByDate);
  };

  const participantsByDate = groupParticipantsByDate(filteredParticipants);
  const sortedDates = Object.keys(participantsByDate).sort((a, b) => {
    // Ordenar fechas de más reciente a más antigua
    if (a === 'Sin fecha') return 1;
    if (b === 'Sin fecha') return -1;
    const dateA = new Date(a.split('/').reverse().join('-')); // Convertir dd/mm/yyyy a yyyy-mm-dd
    const dateB = new Date(b.split('/').reverse().join('-'));
    return dateB.getTime() - dateA.getTime();
  });

  // Funciones para manejar colapso/expansión
  const toggleDateCollapse = (date: string) => {
    setCollapsedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  // Función para cargar más participantes de una fecha
  const loadMoreParticipants = (date: string) => {
    setParticipantsLimits(prev => {
      const newMap = new Map(prev);
      const currentLimit = newMap.get(date) || INITIAL_PARTICIPANTS_PER_DATE;
      newMap.set(date, currentLimit + LOAD_MORE_INCREMENT);
      return newMap;
    });
  };

  // Función para obtener el límite actual de una fecha
  const getParticipantLimit = (date: string) => {
    return participantsLimits.get(date) || INITIAL_PARTICIPANTS_PER_DATE;
  };

  const modalContent = (
    <motion.div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999 
      }}
    >
      <motion.div
        className="w-full max-w-7xl max-h-[95vh] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del modal */}
        <div className="p-6 border-b border-white/20 bg-black/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-marineBold text-white flex items-center gap-3">
                <FiUsers className="text-blue-400" size={32} />
                Lista de Participantes
              </h2>
              <p className="text-white/70 text-lg mt-2">
                Total: <span className="font-marineBold text-blue-300">{totalCount}</span> participantes únicos registrados
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="custom"
              className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <FiX size={24} />
            </Button>
          </div>


        </div>

        {/* Contenido del modal */}
        <div className="flex-1 p-6 overflow-y-auto">
          {isLoading ? (
            <motion.div 
              className="flex flex-col items-center justify-center py-16"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={fadeInUp} className="flex items-center gap-4 text-white/80">
                <FiLoader className="animate-spin" size={32} />
                <span className="text-xl font-marineRegular">Cargando participantes...</span>
              </motion.div>
            </motion.div>
          ) : filteredParticipants.length === 0 ? (
            <motion.div 
              className="text-center py-16"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={fadeInUp} className="text-white/70">
                <FiUser className="mx-auto mb-6" size={64} />
                <h3 className="text-2xl font-marineBold mb-4">
                  No hay participantes
                </h3>
                <p className="text-white/60 text-lg">
                  Aún no se han registrado participantes en el sistema.
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              className="space-y-6"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {sortedDates.map((date, dateIndex) => {
                const dateParticipants = participantsByDate[date];
                const isCollapsed = collapsedDates.has(date);
                const currentLimit = getParticipantLimit(date);
                const visibleParticipants = isCollapsed ? [] : dateParticipants.slice(0, currentLimit);
                const hasMore = dateParticipants.length > currentLimit;

                return (
                  <motion.div
                    key={date}
                    variants={fadeInUp}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/15 overflow-hidden"
                  >
                    {/* Header de la fecha - Clickeable para colapsar/expandir */}
                    <button
                      onClick={() => toggleDateCollapse(date)}
                      className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <FiCalendar className="text-orange-400" size={24} />
                        <div className="text-left">
                          <h3 className="text-xl font-marineBold text-white">
                            Fecha: {date}
                          </h3>
                          <p className="text-white/60 text-sm">
                            Total de participantes en esta fecha: <span className="font-marineBold text-orange-300">{dateParticipants.length}</span>
                          </p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: isCollapsed ? 0 : 180 }}
                        transition={{ duration: 0.2 }}
                      >
                        <FiChevronDown className="text-white/60" size={24} />
                      </motion.div>
                    </button>

                    {/* Participantes de esta fecha */}
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-white/10"
                        >
                          <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                              {visibleParticipants
                                .sort((a, b) => {
                                  // Ordenar por hora de registro (más reciente primero)
                                  const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                                  const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                                  return timeB - timeA;
                                })
                                .map((participant, index) => (
                                  <motion.div
                                    key={participant.email || `${dateIndex}-${index}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white/8 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/12 transition-all duration-200 hover:border-white/30 hover:scale-[1.02]"
                                  >
                                    <div className="space-y-4">
                                      {/* Nombre y apellido */}
                                      <div className="flex items-start gap-3">
                                        <FiUser className="text-blue-400 mt-1 flex-shrink-0" size={18} />
                                        <div>
                                          <p className="text-white font-marineBold text-lg leading-tight">
                                            {participant.nombre}
                                          </p>
                                          {participant.apellido && (
                                            <p className="text-white/90 font-marineBold text-lg leading-tight">
                                              {participant.apellido}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      {/* Email */}
                                      {participant.email && (
                                        <div className="flex items-start gap-3">
                                          <FiMail className="text-green-400 mt-1 flex-shrink-0" size={16} />
                                          <span className="text-white/80 text-sm break-all leading-relaxed">
                                            {participant.email}
                                          </span>
                                        </div>
                                      )}

                                      {/* Especialidad */}
                                      {participant.especialidad && (
                                        <div className="flex items-start gap-3">
                                          <FiBriefcase className="text-purple-400 mt-1 flex-shrink-0" size={16} />
                                          <span className="text-white/80 text-sm leading-relaxed">
                                            {participant.especialidad}
                                          </span>
                                        </div>
                                      )}

                                      {/* Hora de registro */}
                                      {participant.created_at && (
                                        <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                                          <FiCalendar className="text-orange-300 flex-shrink-0" size={14} />
                                          <span className="text-white/60 text-xs">
                                            Registrado: {formatDateTime(participant.created_at)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                ))}
                            </div>

                            {/* Botón "Ver más" si hay más participantes */}
                            {hasMore && (
                              <div className="mt-6 text-center">
                                <Button
                                  onClick={() => loadMoreParticipants(date)}
                                  variant="custom"
                                  className="bg-white/10 hover:bg-white/20 text-white font-marineBold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105"
                                >
                                  Ver más participantes ({dateParticipants.length - currentLimit} restantes)
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Footer del modal */}
        <div className="p-6 border-t border-white/20 bg-black/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-white/60 text-sm">
              Mostrando <span className="font-marineBold text-white">{filteredParticipants.length}</span> de <span className="font-marineBold text-white">{totalCount}</span> participantes únicos
            </span>
            <Button
              onClick={onClose}
              variant="custom"
              className="bg-gradient-to-r from-blue-500/80 to-blue-600/90 hover:from-blue-600/90 hover:to-blue-700 text-white font-marineBold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  // Usar portal para renderizar el modal fuera del contenedor padre
  return createPortal(modalContent, document.body);
};

export default ParticipantsModal; 