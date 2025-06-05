import { useEffect, useState } from 'react';
import { useIsMounted } from './useIsMounted';

/**
 * Hook personalizado para manejar un reloj en tiempo real
 * Se actualiza cada segundo y evita errores de hidratación
 * @returns {Date | null} currentTime - la fecha/hora actual o null si no está montado
 */
export function useClock(): Date | null {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const isMounted = useIsMounted();

  useEffect(() => {
    if (!isMounted) return;
    
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [isMounted]);

  return currentTime;
} 