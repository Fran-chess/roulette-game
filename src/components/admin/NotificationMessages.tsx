// src/components/admin/NotificationMessages.tsx
import { motion } from 'framer-motion';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi'; // Usando AlertCircle para errores

interface NotificationMessagesProps {
  error?: string | null;
  success?: string | null;
  clearError?: () => void;
  clearSuccess?: () => void;
  onDismiss?: () => void;
}

const NotificationMessages: React.FC<NotificationMessagesProps> = ({
  error,
  success,
  clearError,
  clearSuccess,
  onDismiss,
}) => {
  if (!error && !success) return null;

  const handleClearError = () => {
    if (clearError) clearError();
    if (onDismiss) onDismiss();
  };

  const handleClearSuccess = () => {
    if (clearSuccess) clearSuccess();
    if (onDismiss) onDismiss();
  };

  return (
    <div className="px-1 md:px-0 pb-4 mt-5 space-y-3">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }}
          className="bg-red-100 backdrop-blur-sm border-2 border-red-300 text-red-800 p-4 rounded-lg shadow-lg flex items-center"
          style={{ boxShadow: "0 4px 12px rgba(220, 38, 38, 0.1)" }}
          role="alert"
          aria-live="assertive"
        >
          <FiAlertCircle className="w-6 h-6 mr-3 shrink-0 text-red-600" />
          <p className="text-sm font-medium flex-grow">{error}</p>
          <button
            onClick={handleClearError}
            className="ml-3 text-red-600/70 hover:text-red-600 text-xl leading-none transition-colors"
            aria-label="Cerrar mensaje de error"
          >
            &times;
          </button>
        </motion.div>
      )}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }}
          className="bg-green-100 backdrop-blur-sm border-2 border-green-300 text-green-800 p-4 rounded-lg shadow-lg flex items-center"
          style={{ boxShadow: "0 4px 12px rgba(22, 163, 74, 0.1)" }}
          role="alert"
          aria-live="assertive"
        >
          <FiCheckCircle className="w-6 h-6 mr-3 shrink-0 text-green-600" />
          <p className="text-sm font-medium flex-grow">{success}</p>
          <button
            onClick={handleClearSuccess}
            className="ml-3 text-green-600/70 hover:text-green-600 text-xl leading-none transition-colors"
            aria-label="Cerrar mensaje de éxito"
          >
            &times;
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default NotificationMessages;