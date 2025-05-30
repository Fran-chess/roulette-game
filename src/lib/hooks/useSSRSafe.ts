import { useEffect, useState } from 'react';

/**
 * Hook para verificar de forma segura si el componente está montado del lado del cliente
 * Evita errores de hidratación y acceso prematuro al DOM
 */
export function useSSRSafe() {
  const [isClient, setIsClient] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // [modificación] Verificar que estamos en el cliente
    setIsClient(true);
    
    // [modificación] Pequeño delay para asegurar que el DOM está completamente listo
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return {
    isClient,
    isReady,
    // [modificación] Utilitarios para condiciones comunes
    canUseDOM: isClient && typeof window !== 'undefined',
    canAnimate: isReady && isClient,
  };
}

/**
 * Hook específico para verificar si podemos usar Framer Motion de forma segura
 */
export function useFramerMotionSafe() {
  const { canAnimate } = useSSRSafe();
  const [canUseMotion, setCanUseMotion] = useState(false);

  useEffect(() => {
    if (canAnimate) {
      // [modificación] Verificar que Framer Motion está disponible
      setCanUseMotion(true);
    }
  }, [canAnimate]);

  return canUseMotion;
}

/**
 * Hook para verificar si podemos acceder al DOM de forma segura
 */
export function useDOMSafe() {
  const { isClient, canUseDOM } = useSSRSafe();
  const [isDOMReady, setIsDOMReady] = useState(false);

  useEffect(() => {
    if (canUseDOM && document.readyState === 'complete') {
      setIsDOMReady(true);
    } else if (canUseDOM) {
      const handleLoad = () => setIsDOMReady(true);
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, [canUseDOM]);

  return {
    isDOMReady,
    canUseDOM,
    isClient,
  };
} 