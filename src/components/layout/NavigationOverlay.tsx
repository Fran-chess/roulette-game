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
  const hasNavigated = useRef(false);
  
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
  
  // Efecto mejorado para manejar la navegación
  useEffect(() => {
    if (isNavigating && navigationTarget) {
      if (hasNavigated.current) {
        return;
      }
      
      hasNavigated.current = true;
      
      const navigateTimer = setTimeout(() => {
        try {
          router.push(navigationTarget);
          
          const completeTimer = setTimeout(() => {
            stopNavigation();
            hasNavigated.current = false;
          }, 600);
          
          return () => clearTimeout(completeTimer);
        } catch (error) {
          console.error('Error durante la navegación:', error);
          stopNavigation();
          hasNavigated.current = false;
        }
      }, 200);
      
      return () => {
        clearTimeout(navigateTimer);
        hasNavigated.current = false;
      };
    } else {
      hasNavigated.current = false;
    }
  }, [isNavigating, navigationTarget, router, stopNavigation]);

  // Timeout de seguridad para evitar estados bloqueados permanentemente
  useEffect(() => {
    if (isNavigating) {
      const safetyTimer = setTimeout(() => {
        console.warn('Navegación bloqueada detectada, forzando reset del estado');
        stopNavigation();
        hasNavigated.current = false;
      }, 5000);
      
      return () => clearTimeout(safetyTimer);
    }
  }, [isNavigating, stopNavigation]);
  
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
              className="w-28 h-1 rounded-full overflow-hidden"
            >
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-400 to-purple-500"
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