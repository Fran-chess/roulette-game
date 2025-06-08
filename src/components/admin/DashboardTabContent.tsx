// src/components/admin/DashboardTabContent.tsx
import { motion } from 'framer-motion';
import { FiUsers, FiActivity, FiPlusCircle, FiLogOut } from 'react-icons/fi';
import { IconType } from 'react-icons';
import Button from '@/components/ui/Button';
import { fadeInUp, staggerContainer } from '@/utils/animations';
import { useState } from 'react';
import ParticipantsModal from './ParticipantsModal';
import { useGameStore } from '@/store/gameStore';

// [modificación] - Interfaz para definir el tipo de los elementos de estadísticas
interface StatItem {
  title: string;
  value: number;
  icon: IconType;
  color: string;
  iconColor: string;
  description: string;
  onClick: () => void;
  isClickable: boolean; // [modificación] - Propiedad agregada
}

interface DashboardTabContentProps {
  participantsCount: number;
  activeSessionsCount: number;
  onInitiateNewSession: () => void;
  onLogout: () => void;
  isLoading: boolean;
  onNavigateToSessions: () => void;
}

const DashboardTabContent: React.FC<DashboardTabContentProps> = ({
  participantsCount,
  activeSessionsCount,
  onInitiateNewSession,
  onLogout,
  isLoading,
  onNavigateToSessions,
}) => {
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);

  const { 
    adminState, 
    fetchParticipantsList 
  } = useGameStore();

  const handleShowParticipants = async () => {
    setShowParticipantsModal(true);
    if (adminState.participantsStats.participants?.length === 0) {
      await fetchParticipantsList();
    }
  };

  // [modificación] - Array reducido a solo 2 cards: "Total de Participantes" y "Sesiones"
  const stats: StatItem[] = [
    { 
      title: 'Total de Participantes', 
      value: participantsCount, 
      icon: FiUsers, 
      color: 'bg-black/5',
      iconColor: 'text-slate-800',
      description: 'Jugadores que han participado',
      onClick: handleShowParticipants,
      isClickable: true
    },
    { 
      title: 'Sesiones', 
      value: activeSessionsCount, 
      icon: FiActivity, 
      color: 'bg-black/5',
      iconColor: 'text-slate-800',
      description: 'Juegos activos disponibles',
      onClick: onNavigateToSessions,
      isClickable: true
    },
  ];

  return (
    <>
      <motion.div 
        role="tabpanel" 
        id="panel-dashboard" 
        aria-labelledby="tab-dashboard" 
        tabIndex={0}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={staggerContainer}
      >
        <div className="p-4 md:p-6 admin-content-spacing">
          <motion.h3 variants={fadeInUp} className="text-xl md:text-2xl font-marineBold mb-4 md:mb-6 text-white admin-dashboard-title">
            Panel Principal
          </motion.h3>
          <motion.p variants={fadeInUp} className="text-slate-300 mb-6 font-sans admin-dashboard-subtitle">
            Gestiona tus juegos y supervisa la actividad de los participantes
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 admin-section-spacing">
            {stats.map(item => (
              <motion.div
                key={item.title}
                variants={fadeInUp}
                whileHover={{ 
                  scale: 1.03, 
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
                  backgroundColor: "rgba(255, 255, 255, 0.15)"
                }}
                className={`p-4 rounded-xl shadow-lg flex flex-col bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300 admin-stats-card ${item.isClickable ? 'cursor-pointer' : ''}`}
                onClick={item.isClickable ? item.onClick : undefined}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-slate-200 font-marineBold">{item.title}</h3>
                  <div className={`${item.iconColor} bg-white/10 p-2 rounded-full`}>
                    <item.icon size={20} className="text-blue-300" />
                  </div>
                </div>
                <p className="text-3xl md:text-4xl font-marineBlack text-white mb-1">{item.value}</p>
                <span className="text-xs text-slate-300 font-sans">{item.description}</span>
                {item.isClickable && (
                  <span className="text-xs text-blue-300 mt-2 font-marineBold">
                    Click para ver detalle
                  </span>
                )}
              </motion.div>
            ))}
          </div>
          
          <motion.div variants={fadeInUp} className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 admin-section-spacing">
            <Button
              onClick={onInitiateNewSession}
              variant="custom"
              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-marineBold py-3 px-5 rounded-lg shadow-lg text-base flex items-center justify-center border border-blue-400/50 transition-colors duration-300 admin-dashboard-button"
              disabled={isLoading}
            >
              <FiPlusCircle className="mr-3" size={20} />
              {isLoading ? 'Creando Juego...' : 'Iniciar Nuevo Juego'}
            </Button>
            
            <Button
              onClick={onLogout}
              variant="custom"
              className="bg-white/10 hover:bg-white/20 text-white font-marineBold py-3 px-5 rounded-lg shadow-lg text-base flex items-center justify-center border border-white/20 transition-colors duration-300 admin-dashboard-button"
            >
              <FiLogOut className="mr-3" size={20} />
              Cerrar Sesión
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <ParticipantsModal
        isOpen={showParticipantsModal}
        onClose={() => setShowParticipantsModal(false)}
        participants={adminState.participantsStats.participants || []}
        isLoading={adminState.isLoading.participants}
        totalCount={adminState.participantsStats.count}
      />
    </>
  );
};

export default DashboardTabContent;