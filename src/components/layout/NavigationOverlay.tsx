'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigationStore } from '@/store/navigationStore';
import Logo from '@/components/ui/Logo';

/**
 * Overlay para transiciones de navegación global.
 * Se muestra por encima de toda la aplicación durante navegaciones entre páginas.
 * Evita parpadeos y ofrece una experiencia de transición fluida.
 */
const NavigationOverlay = () => {
  const { isNavigating, navigationTarget, loadingMessage, stopNavigation } = useNavigationStore();
  const router = useRouter();
  const initialRender = useRef(true);
  
  // Mensajes predeterminados según el destino de navegación
  const getDefaultMessage = () => {
    if (!navigationTarget) return 'Cargando...';
    
    if (navigationTarget.includes('/game/')) {
      return 'Preparando la ruleta...';
    } else if (navigationTarget.includes('/register/')) {
      return 'Verificando sesión...';
    }
    
    return 'Cargando...';
  };
  
  // Efecto para manejar la navegación cuando cambia isNavigating
  useEffect(() => {
    // Ignorar el primer render
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    
    if (isNavigating && navigationTarget) {
      // Usar un timeout para dar tiempo a que se muestre el overlay
      const timer = setTimeout(() => {
        router.push(navigationTarget);
        
        // Dar tiempo adicional después de iniciar la navegación para que la carga sea perceptible
        setTimeout(() => {
          stopNavigation();
        }, 800);
      }, 400);
      
      return () => clearTimeout(timer);
    }
  }, [isNavigating, navigationTarget, router, stopNavigation]);
  
  return (
    <AnimatePresence mode="wait">
      {isNavigating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-main-gradient bg-opacity-95 flex items-center justify-center z-[100]"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backdropFilter: 'blur(8px)'
          }}
        >
          <div className="flex flex-col items-center">
            <Logo 
              size="md" 
              animated={true} 
              className="logo-nav" 
              withShadow={true}
            />
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="text-white text-xl mb-8"
            >
              {loadingMessage || getDefaultMessage()}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="w-28 h-1  rounded-full overflow-hidden"
            >
              <motion.div 
                className="h-full"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.2, ease: "linear" }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NavigationOverlay; 