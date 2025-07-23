/**
 * Utilidades de animación centralizadas para framer-motion
 * Este archivo contiene las variantes de animación reutilizables en toda la aplicación
 */

import { Variants } from 'framer-motion';

/**
 * Animación de aparición desde abajo con desvanecimiento
 */
export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.5, 
      ease: [0.25, 0.1, 0.25, 1.0] 
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { 
      duration: 0.3, 
      ease: [0.25, 0.1, 0.25, 1.0] 
    }
  }
};

/**
 * Contenedor con efecto de aparición escalonada para elementos hijos
 */
export const staggerContainer: Variants = {
  hidden: { 
    opacity: 0 
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
      ease: [0.25, 0.1, 0.25, 1.0],
      duration: 0.4
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
      duration: 0.2
    }
  }
};