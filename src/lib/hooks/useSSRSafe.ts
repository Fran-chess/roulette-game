import { useEffect, useState } from 'react';

/**
 * Hook para verificar si podemos acceder al DOM de forma segura
 * Evita errores de hidratación y acceso prematuro al DOM
 */
export function useDOMSafe() {
  const [isClient, setIsClient] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isDOMReady, setIsDOMReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const canUseDOM = isClient && typeof window !== 'undefined';
  const canAnimate = isReady && isClient;

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
    canAnimate,
  };
} 