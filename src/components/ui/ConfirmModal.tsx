import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiAlertTriangle, FiInfo, FiUsers, FiCalendar } from 'react-icons/fi';
import Button from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type: 'confirm' | 'info';
  confirmText?: string;
  cancelText?: string;
  // Para información de partida
  gameInfo?: {
    createdAt: string;
    participantCount: number;
  };
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  gameInfo
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* [modificación] Overlay de fondo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* [modificación] Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200">
              {/* [modificación] Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {type === 'confirm' ? (
                    <FiAlertTriangle className="text-red-500" size={24} />
                  ) : (
                    <FiInfo className="text-blue-500" size={24} />
                  )}
                  <h3 className="text-lg font-marineBold text-gray-800">
                    {title}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* [modificación] Content */}
              <div className="mb-6">
                <p className="text-gray-600 font-marineRegular mb-4">
                  {message}
                </p>

                {/* [modificación] Información adicional para partidas */}
                {type === 'info' && gameInfo && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <FiCalendar className="text-gray-500" size={16} />
                      <span className="font-marineBold">Fecha de creación:</span>
                      <span>{new Date(gameInfo.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <FiUsers className="text-gray-500" size={16} />
                      <span className="font-marineBold">Participantes:</span>
                      <span>{gameInfo.participantCount} {gameInfo.participantCount === 1 ? 'jugador' : 'jugadores'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* [modificación] Actions */}
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={onClose}
                  variant="custom"
                  className="bg-gray-100 text-gray-700 font-marineBold py-2 px-4 rounded-lg transition-colors"
                >
                  {type === 'info' ? 'Cerrar' : cancelText}
                </Button>
                
                {type === 'confirm' && onConfirm && (
                  <Button
                    onClick={handleConfirm}
                    variant="custom"
                    className="bg-red-600 text-white font-marineBold py-2 px-4 rounded-lg transition-colors"
                  >
                    {confirmText}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal; 