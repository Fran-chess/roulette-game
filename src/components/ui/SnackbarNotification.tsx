'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';

interface SnackbarNotificationProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

const COLORS = {
  success: {
    bg: 'bg-green-500/90',
    icon: <FiCheckCircle className="text-white w-5 h-5 mr-2" />,
  },
  error: {
    bg: 'bg-red-500/90',
    icon: <FiAlertCircle className="text-white w-5 h-5 mr-2" />,
  },
};

export default function SnackbarNotification({ type, message, onClose }: SnackbarNotificationProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={`
            fixed z-50 left-1/2 bottom-8 -translate-x-1/2
            min-w-[250px] max-w-xs md:max-w-md px-4 py-3 rounded-2xl shadow-xl flex items-center
            ${COLORS[type].bg}
          `}
          role="alert"
        >
          {COLORS[type].icon}
          <span className="text-white font-semibold flex-1 text-sm">{message}</span>
          <button
            onClick={onClose}
            className="ml-4 rounded-full bg-white/10 p-1 transition"
            aria-label="Cerrar notificación"
          >
            <FiX className="text-white w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
