/**
 * Hook personalizado para manejo de temporizador con cuenta regresiva
 * Incluye estado de urgencia y callback al finalizar
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Configuración del timer
 */
interface UseTimerConfig {
  /** Segundos iniciales del timer */
  initialSeconds: number;
  /** Callback cuando el tiempo se agota */
  onTimeUp?: () => void;
  /** Umbral de segundos para considerar el tiempo como urgente */
  urgentThreshold?: number;
  /** Si el timer debe iniciarse automáticamente */
  autoStart?: boolean;
}

/**
 * Estado y controles del timer
 */
interface UseTimerReturn {
  /** Segundos restantes */
  seconds: number;
  /** Si el tiempo está en estado urgente (últimos segundos) */
  isUrgent: boolean;
  /** Si el timer está activo */
  isRunning: boolean;
  /** Porcentaje de tiempo restante (0-100) */
  percentage: number;
  /** Inicia el timer */
  start: () => void;
  /** Pausa el timer */
  pause: () => void;
  /** Reinicia el timer a los segundos iniciales */
  reset: () => void;
  /** Detiene y reinicia el timer */
  stop: () => void;
}

/**
 * Hook para manejo de temporizador con cuenta regresiva
 *
 * @example
 * ```tsx
 * const timer = useTimer({
 *   initialSeconds: 30,
 *   onTimeUp: () => console.log('Time is up!'),
 *   urgentThreshold: 5
 * });
 * ```
 */
export function useTimer({
  initialSeconds,
  onTimeUp,
  urgentThreshold = 5,
  autoStart = true,
}: UseTimerConfig): UseTimerReturn {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isUrgent, setIsUrgent] = useState(false);

  // Ref para evitar llamadas múltiples a onTimeUp
  const hasTimeUpFiredRef = useRef(false);
  const onTimeUpRef = useRef(onTimeUp);

  // Actualizar ref cuando cambie el callback
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // Calcular porcentaje de tiempo restante
  const percentage = (seconds / initialSeconds) * 100;

  // Efecto principal del timer
  useEffect(() => {
    // Actualizar estado de urgencia
    setIsUrgent(seconds <= urgentThreshold && seconds > 0);

    // Si el tiempo se agotó
    if (seconds <= 0 && !hasTimeUpFiredRef.current) {
      hasTimeUpFiredRef.current = true;
      setIsRunning(false);
      onTimeUpRef.current?.();
      return;
    }

    // Si no está corriendo o ya no hay tiempo, no hacer nada
    if (!isRunning || seconds <= 0) {
      return;
    }

    // Configurar el intervalo para la cuenta regresiva
    const timer = setTimeout(() => {
      setSeconds(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [seconds, isRunning, urgentThreshold]);

  // Reiniciar cuando cambien los segundos iniciales
  useEffect(() => {
    setSeconds(initialSeconds);
    setIsUrgent(false);
    hasTimeUpFiredRef.current = false;
    if (autoStart) {
      setIsRunning(true);
    }
  }, [initialSeconds, autoStart]);

  /**
   * Inicia el timer
   */
  const start = useCallback(() => {
    if (seconds > 0) {
      setIsRunning(true);
      hasTimeUpFiredRef.current = false;
    }
  }, [seconds]);

  /**
   * Pausa el timer
   */
  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  /**
   * Reinicia el timer a los segundos iniciales
   */
  const reset = useCallback(() => {
    setSeconds(initialSeconds);
    setIsUrgent(false);
    hasTimeUpFiredRef.current = false;
    if (autoStart) {
      setIsRunning(true);
    }
  }, [initialSeconds, autoStart]);

  /**
   * Detiene y reinicia el timer
   */
  const stop = useCallback(() => {
    setIsRunning(false);
    setSeconds(initialSeconds);
    setIsUrgent(false);
    hasTimeUpFiredRef.current = false;
  }, [initialSeconds]);

  return {
    seconds,
    isUrgent,
    isRunning,
    percentage,
    start,
    pause,
    reset,
    stop,
  };
}