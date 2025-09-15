import { useEffect, useState } from 'react';

/**
 * Hook consolidado para manejo seguro de SSR/SSG en Next.js
 * Combina funcionalidades de useIsMounted y useDOMSafe
 *
 * @returns Objeto con estados útiles para SSR
 */
export function useSSR() {
  const [isMounted, setIsMounted] = useState(false);
  const [isDOMReady, setIsDOMReady] = useState(false);

  useEffect(() => {
    // Componente montado en cliente
    setIsMounted(true);

    // Verificar si el DOM está completamente cargado
    if (document.readyState === 'complete') {
      setIsDOMReady(true);
    } else {
      const handleLoad = () => setIsDOMReady(true);
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  return {
    /** True cuando el componente está montado en el cliente */
    isMounted,
    /** True cuando el DOM está completamente listo */
    isDOMReady,
    /** Alias conveniente para verificaciones rápidas */
    isClient: isMounted,
    /** True si podemos usar APIs del navegador de forma segura */
    canUseDOM: isMounted && typeof window !== 'undefined',
  };
}