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

/**
 * Animación de escala para botones y elementos interactivos
 */
export const scaleOnHover: Variants = {
  initial: { 
    scale: 1 
  },
  hover: { 
    scale: 1.05,
    transition: { 
      duration: 0.2 
    }
  },
  tap: { 
    scale: 0.98 
  }
};

/**
 * Animación de deslizamiento horizontal
 */
export const slideHorizontal: Variants = {
  hidden: (direction: number = 1) => ({
    x: direction * 50,
    opacity: 0
  }),
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1.0]
    }
  },
  exit: (direction: number = 1) => ({
    x: direction * -50,
    opacity: 0,
    transition: {
      duration: 0.3
    }
  })
};

/**
 * Entrada con rebote leve para elementos destacados
 */
export const bounceIn: Variants = {
  hidden: { 
    scale: 0.8, 
    opacity: 0 
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 12,
      stiffness: 200
    }
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
}; 