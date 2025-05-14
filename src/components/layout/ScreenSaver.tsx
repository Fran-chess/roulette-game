// src/components/layout/ScreenSaver.tsx
'use client';
import { motion } from 'framer-motion';

interface ScreenSaverProps {
  onInteraction: () => void; // Función a llamar cuando se interactúa
  isVisible: boolean;       // Para controlar si se renderiza o no (útil para animaciones)
}

export default function ScreenSaver({ onInteraction, isVisible }: ScreenSaverProps) {
  if (!isVisible) {
    return null; // No renderizar nada si no es visible
  }

  return (
    <motion.div
      className="fixed inset-0 z-20 h-full w-full cursor-pointer bg-transparent" // Ocupa todo, transparente, con cursor
      onClick={onInteraction}
      onTouchStart={onInteraction} // Para compatibilidad con dispositivos táctiles
      initial={{ opacity: 0 }} // Animación sutil de aparición
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}    // Animación sutil de desaparición
      transition={{ duration: 0.3 }}
    >
      {/* No se necesita contenido visual dentro de este div. */}
      {/* Su propósito es ser una capa interactiva transparente sobre el VideoBackground. */}
    </motion.div>
  );
}