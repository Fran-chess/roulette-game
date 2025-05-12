// src/lib/hooks/useInactivityTimer.ts
import { useEffect, useCallback, useRef, useState } from 'react';

interface InactivityTimerOptions {
  minMovementThreshold?: number;  // Umbral mínimo de movimiento para considerarlo actividad
  debounceTime?: number;          // Tiempo para agrupar múltiples actividades cercanas
  gameStateFilter?: string[];     // Estados del juego en los que queremos detectar inactividad
}

export function useInactivityTimer(
  timeout: number = 60000,
  onTimeout: () => void, // Callback a ejecutar cuando el timer expira
  currentGameState?: string, // Estado actual del juego
  options: InactivityTimerOptions = {} // Opciones para configurar el comportamiento
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const lastActivityRef = useRef<number>(Date.now());
  const activityDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Opciones con valores por defecto
  const {
    minMovementThreshold = 10,
    debounceTime = 300,
    gameStateFilter = ['question', 'roulette'] // Principalmente prestar atención durante estas fases
  } = options;
  
  const [isThinking, setIsThinking] = useState(false); // Estado para indicar si el usuario está pensando
  
  // Función para resetear el timer con lógica mejorada
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Si la inactividad solo debe detectarse en ciertos estados y no estamos en ellos, no iniciamos el timer
    if (currentGameState && gameStateFilter.length > 0 && !gameStateFilter.includes(currentGameState)) {
      return;
    }
    
    timerRef.current = setTimeout(() => {
      console.log("Inactivity timer expired.");
      onTimeout(); // Ejecutar el callback proporcionado
      setIsThinking(false);
    }, timeout);
    
  }, [timeout, onTimeout, currentGameState, gameStateFilter]);

  // Función para procesar los eventos de movimiento con mejor detección
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const currentPosition = { x: e.clientX, y: e.clientY };
    const lastPosition = lastPositionRef.current;
    
    // Calcular la distancia del movimiento
    const dx = currentPosition.x - lastPosition.x;
    const dy = currentPosition.y - lastPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Si el movimiento es muy pequeño, podría ser que el usuario está pensando
    if (distance < minMovementThreshold) {
      // Pequeños movimientos repetitivos indican que el usuario está presente pero pensando
      if (Date.now() - lastActivityRef.current < 2000) {
        setIsThinking(true);
      }
      return; // No resetea el timer por movimientos minúsculos
    }
    
    // Para movimientos significativos, actualizar posición y resetear
    lastPositionRef.current = currentPosition;
    lastActivityRef.current = Date.now();
    
    // Debounce de la actividad para no resetear el timer constantemente
    if (activityDebounceRef.current) {
      clearTimeout(activityDebounceRef.current);
    }
    
    activityDebounceRef.current = setTimeout(() => {
      resetTimer();
      setIsThinking(false); // Ya no está pensando, está activo
    }, debounceTime);
    
  }, [resetTimer, minMovementThreshold, debounceTime]);

  // Manejador de eventos de interacción general
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Debounce para otras actividades también
    if (activityDebounceRef.current) {
      clearTimeout(activityDebounceRef.current);
    }
    
    activityDebounceRef.current = setTimeout(() => {
      resetTimer();
      setIsThinking(false);
    }, debounceTime);
  }, [resetTimer, debounceTime]);

  useEffect(() => {
    // Lista ampliada de eventos a escuchar
    const clickEvents: (keyof WindowEventMap)[] = ['mousedown', 'keypress', 'touchstart', 'click'];
    
    // Iniciar el timer cuando el hook se monta o las dependencias cambian
    resetTimer();

    // Listener específico para mousemove con lógica especial
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    // Otros eventos de actividad
    clickEvents.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (activityDebounceRef.current) {
        clearTimeout(activityDebounceRef.current);
      }
      
      window.removeEventListener('mousemove', handleMouseMove);
      clickEvents.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [resetTimer, handleMouseMove, handleActivity]);

  // Devolvemos el resetTimer y también el estado de "pensando"
  return { resetTimer, isThinking };
}