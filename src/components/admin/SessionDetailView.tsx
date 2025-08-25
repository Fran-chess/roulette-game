// src/components/admin/SessionDetailView.tsx
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import QueueManager from './QueueManager';
import LiveQueueDisplay from './LiveQueueDisplay';
import { fadeInUp, staggerContainer } from '@/utils/animations';
import { PlaySession } from '@/types';
import { useState } from 'react';

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
}) => {
  
  // [modificación] Estado para manejar los datos del participante
  const [showQueueManager, setShowQueueManager] = useState(false);


  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible">
      <Button
        onClick={onBackToSessions}
        variant="custom"
        className="flex items-center text-xs text-slate-300 font-sans mb-5 transition-colors duration-300"
        aria-label="Volver a la lista de juegos"
      >
        <FiArrowLeft className="mr-1" size={16} />
        Volver a Juegos
      </Button>

      {/* Display de Cola en Vivo */}
      <motion.div variants={fadeInUp} className="mb-8">
        <LiveQueueDisplay sessionId={session.session_id} />
      </motion.div>

      {/* Modal del Gestor de Cola */}
      {showQueueManager && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          >
            <QueueManager
              sessionId={session.session_id}
              onClose={() => setShowQueueManager(false)}
            />
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SessionDetailView;

