import dynamic from 'next/dynamic';

/**
 * Componentes de Framer Motion cargados dinámicamente para evitar errores de SSR
 * Centralizados para reutilización en toda la aplicación de TV
 */

// [modificación] Cargar Framer Motion dinámicamente para evitar errores de SSR
export const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.div),
  { 
    ssr: false, // [modificación] Deshabilitar SSR para evitar errores de hidratación
    loading: () => <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900" />
  }
);

export const AnimatePresence = dynamic(
  () => import('framer-motion').then((mod) => mod.AnimatePresence),
  { ssr: false }
);

// [modificación] Exportar tipos de Framer Motion para TypeScript
export type { Variants } from 'framer-motion'; 