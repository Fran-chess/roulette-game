// src/components/admin/DashboardTabContent.tsx
import { motion } from 'framer-motion';
import { FiUsers, FiPlusCircle, FiLogOut, FiPlay } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { fadeInUp, staggerContainer } from '@/utils/animations';
import { useState } from 'react';
import ParticipantsModal from './ParticipantsModal';
import { useGameStore } from '@/store/gameStore';
import { PlaySession } from '@/types';


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

  const activeSession: PlaySession | null = adminState.currentSession;

  const handleShowParticipants = async () => {
    setShowParticipantsModal(true);
    if (adminState.participantsStats.participants?.length === 0) {
      await fetchParticipantsList();
    }
  };

  const handleContinueSession = () => {
    if (activeSession) {
      onNavigateToSessions();
    }
  };


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
        <div className="p-6 md:p-8 space-y-8">
          <motion.h3 variants={fadeInUp} className="text-xl md:text-2xl font-marineBold text-white admin-dashboard-title">
            Panel Principal
          </motion.h3>
          <motion.p variants={fadeInUp} className="text-slate-300 font-sans admin-dashboard-subtitle">
            Gestiona tus juegos y supervisa la actividad de los participantes
          </motion.p>
          
          {/* Card de participantes */}
          <motion.div
            variants={fadeInUp}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg transition-all duration-200 admin-stats-card cursor-pointer"
            onClick={handleShowParticipants}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-slate-200 font-marineBold">Total de Participantes</h3>
              <div className="p-2 rounded-full bg-white/5">
                <FiUsers size={16} className="text-blue-300" />
              </div>
            </div>
            <p className="text-3xl md:text-4xl font-marineBlack text-white mb-2">{participantsCount}</p>
            <span className="text-xs text-slate-300 font-sans">Jugadores que han participado</span>
            <span className="text-xs text-blue-300 mt-2 font-marineBold block">
              Click para ver detalle
            </span>
          </motion.div>

          {/* Botones de acción */}
          <motion.div variants={fadeInUp} className="space-y-3">
            {activeSession ? (
              /* Botones para cuando hay una sesión activa */
              <>
                <Button
                  onClick={handleContinueSession}
                  variant="custom"
                  className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-marineBold py-2 px-4 rounded-xl shadow-lg text-base flex items-center justify-start border-0 transition-all duration-200 admin-dashboard-button"
                  disabled={isLoading}
                >
                  <FiPlay className="mr-3" size={16} />
                  Continuar Partida
                </Button>
                
                <Button
                  onClick={onLogout}
                  variant="custom"
                  className="w-full bg-transparent text-slate-400 font-marineBold py-2 px-4 rounded-lg text-sm flex items-center justify-start border border-slate-500/20 transition-all duration-200 admin-dashboard-button"
                >
                  <FiLogOut className="mr-3" size={12} />
                  Cerrar Sesión de Admin
                </Button>
              </>
            ) : (
              /* Botones para cuando no hay sesión activa */
              <>
                <Button
                  onClick={onInitiateNewSession}
                  variant="custom"
                  className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white font-marineBold py-2 px-4 rounded-xl shadow-lg text-base flex items-center justify-start border-0 transition-all duration-200 admin-dashboard-button"
                  disabled={isLoading}
                >
                  <FiPlusCircle className="mr-3" size={16} />
                  {isLoading ? 'Creando Juego...' : 'Iniciar Nuevo Juego'}
                </Button>
                
                <Button
                  onClick={onLogout}
                  variant="custom"
                  className="w-full bg-transparent text-slate-400 font-marineBold py-2 px-4 rounded-lg text-sm flex items-center justify-start border border-slate-500/20 transition-all duration-200 admin-dashboard-button"
                >
                  <FiLogOut className="mr-3" size={12} />
                  Cerrar Sesión
                </Button>
              </>
            )}
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