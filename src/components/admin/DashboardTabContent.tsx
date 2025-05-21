// src/components/admin/DashboardTabContent.tsx
import { motion } from 'framer-motion';
import { FiUsers, FiActivity, FiCalendar, FiPlusCircle, FiLogOut } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { fadeInUp, staggerContainer } from '@/utils/animations';

interface DashboardTabContentProps {
  participantsCount: number;
  activeSessionsCount: number;
  totalSessionsCount: number;
  onInitiateNewSession: () => void;
  onLogout: () => void;
  isLoading: boolean;
  onNavigateToSessions: () => void;
}

const DashboardTabContent: React.FC<DashboardTabContentProps> = ({
  participantsCount,
  activeSessionsCount,
  totalSessionsCount,
  onInitiateNewSession,
  onLogout,
  isLoading,
  onNavigateToSessions,
}) => {
  const stats = [
    { 
      title: 'Total de Participantes', 
      value: participantsCount, 
      icon: FiUsers, 
      color: 'bg-black/5',
      iconColor: 'text-slate-800',
      description: 'Jugadores que han participado',
      onClick: null
    },
    { 
      title: 'Sesiones Activas', 
      value: activeSessionsCount, 
      icon: FiActivity, 
      color: 'bg-black/5',
      iconColor: 'text-slate-800',
      description: 'En progreso actualmente',
      onClick: onNavigateToSessions
    },
    { 
      title: 'Total de Sesiones', 
      value: totalSessionsCount, 
      icon: FiCalendar, 
      color: 'bg-black/5',
      iconColor: 'text-slate-800',
      description: 'Creadas históricamente',
      onClick: onNavigateToSessions
    },
  ];

  return (
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
      <div className="p-4 md:p-6">
        <motion.h3 variants={fadeInUp} className="text-xl md:text-2xl font-marineBold mb-4 md:mb-6 text-slate-800">
          Panel Principal
        </motion.h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map(item => (
            <motion.div
              key={item.title}
              variants={fadeInUp}
              whileHover={{ 
                scale: 1.03, 
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                backgroundColor: "rgba(0, 0, 0, 0.1)"
              }}
              className={`p-4 rounded-xl shadow-lg flex flex-col ${item.color} backdrop-blur-sm border border-white/40 hover:border-white/60 transition-all duration-300 ${item.onClick ? 'cursor-pointer' : ''}`}
              onClick={item.onClick || undefined}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-700 font-marineRegular">{item.title}</p>
                <div className={`${item.iconColor} bg-black/10 p-2 rounded-full`}>
                  <item.icon size={20} />
                </div>
              </div>
              <p className="text-3xl md:text-4xl font-marineBlack text-slate-800 mb-1">{item.value}</p>
              <p className="text-xs text-slate-600">{item.description}</p>
            </motion.div>
          ))}
        </div>
        
        <motion.div variants={fadeInUp} className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={onInitiateNewSession}
            variant="custom"
            className="bg-blue-500/80 hover:bg-blue-600/90 text-white font-marineBold py-3 px-5 rounded-lg shadow-lg text-base flex items-center justify-center border border-blue-400/50 transition-colors duration-300"
            disabled={isLoading}
          >
            <FiPlusCircle className="mr-3" size={20} />
            {isLoading ? 'Creando Juego...' : 'Iniciar Nuevo Juego'}
          </Button>
          
          <Button
            onClick={onLogout}
            variant="custom"
            className="bg-black/10 hover:bg-black/20 text-slate-800 font-marineBold py-3 px-5 rounded-lg shadow-lg text-base flex items-center justify-center border border-white/40 transition-colors duration-300"
          >
            <FiLogOut className="mr-3" size={20} />
            Cerrar Sesión
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardTabContent;