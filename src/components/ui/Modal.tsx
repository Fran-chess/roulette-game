// src/components/ui/Modal.tsx (Opcional, si necesitas un modal genérico)
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export default function Modal({ isOpen, onClose, children, title }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-md"
          onClick={onClose} // Cierra al hacer clic en el fondo
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white/10 backdrop-blur-sm p-6 rounded-lg shadow-xl w-full max-w-md relative border border-white/30 text-white"
            onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal lo cierre
          >
            {title && (
              <h2 className="text-xl font-semibold text-azul-intenso mb-4">{title}</h2>
            )}
            {children}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-white/70 hover:text-white text-2xl"
              aria-label="Cerrar modal"
            >
              &times;
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}