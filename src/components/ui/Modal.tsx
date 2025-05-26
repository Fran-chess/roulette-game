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
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-2 sm:p-4 z-50 backdrop-blur-md"
          onClick={onClose} // Cierra al hacer clic en el fondo
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white/10 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto relative border border-white/30 text-white"
            onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal lo cierre
          >
            <div className="flex items-center justify-between mb-4">
              {title && (
                <h2 className="text-xl font-semibold text-azul-intenso">{title}</h2>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={onClose}
                  className="text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors duration-200"
                  aria-label="Cerrar modal"
                  title="Cerrar"
                >
                  <span className="text-xl leading-none">&times;</span>
                </button>
              </div>
            </div>
            
            <div className="modal-content">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}