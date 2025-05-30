import { useEffect, useState } from 'react';

/**
 * Hook personalizado para controlar si el componente está montado
 * Evita errores de hidratación en SSR/SSG
 * @returns {boolean} isMounted - true cuando el componente está montado en el cliente
 */
export function useIsMounted(): boolean {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
} 