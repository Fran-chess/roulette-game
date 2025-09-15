/**
 * Hook personalizado para manejar la lógica de la ruleta
 * Centraliza el estado y la lógica del componente
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { Question } from '@/types';
import {
  type WheelSegment,
  createRouletteSegments,
  type SpinState,
  calculateTargetAngle,
  calculateSpinDuration,
  updateSpinState,
  calculateWinningSegment,
  triggerVibration,
  createAudioContext,
  playTickSound,
  shouldPlayTick,
} from '@/utils/roulette';

/**
 * Configuración del hook
 */
interface UseRouletteLogicConfig {
  questions: Question[];
  onSpinStateChange?: (isSpinning: boolean) => void;
}

/**
 * Retorno del hook
 */
interface UseRouletteLogicReturn {
  // Estado
  segments: WheelSegment[];
  spinState: SpinState;
  highlightedSegment: number | null;
  winnerGlowIntensity: number;

  // Acciones
  startSpin: () => void;
  updateAnimation: () => void;
  handleMouseMove: (x: number, y: number, centerX: number, centerY: number) => void;
  handleMouseLeave: () => void;

  // Refs
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  lastTickAngleRef: React.MutableRefObject<number>;
}

/**
 * Hook para manejar toda la lógica de la ruleta
 */
export function useRouletteLogic({
  questions,
  onSpinStateChange,
}: UseRouletteLogicConfig): UseRouletteLogicReturn {
  // Store de Zustand
  const setLastSpinResultIndex = useGameStore(state => state.setLastSpinResultIndex);
  const addRecentSpinSegment = useGameStore(state => state.addRecentSpinSegment);
  const recentSpinSegments = useGameStore(state => state.recentSpinSegments);

  // Estado del giro
  const [spinState, setSpinState] = useState<SpinState>({
    isSpinning: false,
    currentAngle: 0,
    velocity: 0,
    targetAngle: 0,
    spinDuration: 0,
    elapsedFrames: 0,
  });

  // Estado visual
  const [highlightedSegment, setHighlightedSegment] = useState<number | null>(null);
  const [winnerGlowIntensity, setWinnerGlowIntensity] = useState(0);

  // Referencias
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastTickAngleRef = useRef(0);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Crear segmentos de la ruleta
  const segments = createRouletteSegments(questions);

  // Inicializar contexto de audio
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = createAudioContext();
    }

    return () => {
      // Capturar el valor actual en una variable local
      const frameId = animationFrameRef.current;
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

  // Notificar cambios en el estado del giro
  useEffect(() => {
    onSpinStateChange?.(spinState.isSpinning);
  }, [spinState.isSpinning, onSpinStateChange]);

  /**
   * Inicia el giro de la ruleta
   */
  const startSpin = useCallback(() => {
    if (spinState.isSpinning || segments.length === 0) return;

    // Limpiar efectos visuales previos
    setHighlightedSegment(null);
    setWinnerGlowIntensity(0);

    // Calcular parámetros del giro
    const targetAngle = calculateTargetAngle(3, 5);
    const spinDuration = calculateSpinDuration(targetAngle);

    // Actualizar estado del giro
    setSpinState({
      isSpinning: true,
      currentAngle: spinState.currentAngle,
      velocity: 0,
      targetAngle: spinState.currentAngle + targetAngle,
      spinDuration,
      elapsedFrames: 0,
    });

    // Reproducir sonido inicial si está disponible
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    // Vibración inicial
    triggerVibration([50, 30, 20]);
  }, [spinState.isSpinning, spinState.currentAngle, segments.length]);

  /**
   * Anima el efecto de glow del segmento ganador
   */
  const animateWinnerGlow = useCallback(() => {
    let intensity = 0;
    let increasing = true;
    const maxIntensity = 0.6;
    const step = 0.05;

    const animate = () => {
      if (increasing) {
        intensity += step;
        if (intensity >= maxIntensity) {
          intensity = maxIntensity;
          increasing = false;
        }
      } else {
        intensity -= step;
        if (intensity <= 0) {
          intensity = 0;
          return; // Terminar animación
        }
      }

      setWinnerGlowIntensity(intensity);
      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  /**
   * Maneja la finalización del giro
   */
  const handleSpinComplete = useCallback((finalAngle: number) => {
    const winningIndex = calculateWinningSegment(finalAngle, segments.length);

    if (winningIndex >= 0 && winningIndex < segments.length) {
      // Evitar repetir el mismo segmento tres veces seguidas
      const isRepeated = recentSpinSegments.length >= 2 &&
        recentSpinSegments.every(idx => idx === winningIndex);

      if (isRepeated) {
        // Ajustar a un segmento diferente
        const newIndex = (winningIndex + 1) % segments.length;
        setLastSpinResultIndex(newIndex);
        addRecentSpinSegment(newIndex);
        setHighlightedSegment(newIndex);
      } else {
        setLastSpinResultIndex(winningIndex);
        addRecentSpinSegment(winningIndex);
        setHighlightedSegment(winningIndex);
      }

      // Animación de glow del ganador
      animateWinnerGlow();

      // Vibración de victoria
      triggerVibration([100, 50, 100, 50, 200]);
    }
  }, [segments.length, recentSpinSegments, setLastSpinResultIndex, addRecentSpinSegment, animateWinnerGlow]);

  /**
   * Actualiza la animación del giro
   */
  const updateAnimation = useCallback(() => {
    if (!spinState.isSpinning) return;

    const newState = updateSpinState(spinState);
    setSpinState(newState);

    // Reproducir sonido de tick si corresponde
    const segmentAngle = 360 / segments.length;
    if (shouldPlayTick(
      newState.velocity,
      segmentAngle,
      lastTickAngleRef.current,
      newState.currentAngle
    )) {
      playTickSound(audioContextRef.current);
      lastTickAngleRef.current = newState.currentAngle;
    }

    // Si el giro terminó
    if (!newState.isSpinning) {
      handleSpinComplete(newState.currentAngle);
    }
  }, [spinState, segments.length, handleSpinComplete]);

  /**
   * Maneja el movimiento del mouse sobre la ruleta
   */
  const handleMouseMove = useCallback((
    x: number,
    y: number,
    centerX: number,
    centerY: number
  ) => {
    if (spinState.isSpinning) {
      setHighlightedSegment(null);
      return;
    }

    // Calcular distancia desde el centro
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = Math.min(centerX, centerY) * 0.8;

    if (distance > maxRadius) {
      setHighlightedSegment(null);
      return;
    }

    // Calcular segmento bajo el cursor
    let angle = Math.atan2(dy, dx);
    angle = angle < 0 ? angle + 2 * Math.PI : angle;

    const adjustedAngle = (angle - (spinState.currentAngle * Math.PI) / 180 + Math.PI / 2) % (2 * Math.PI);
    const positiveAngle = adjustedAngle < 0 ? adjustedAngle + 2 * Math.PI : adjustedAngle;

    const segmentAngle = (2 * Math.PI) / segments.length;
    const segment = Math.floor(positiveAngle / segmentAngle) % segments.length;

    setHighlightedSegment(segment);
  }, [spinState.isSpinning, spinState.currentAngle, segments.length]);

  /**
   * Maneja cuando el mouse sale de la ruleta
   */
  const handleMouseLeave = useCallback(() => {
    if (!spinState.isSpinning) {
      setHighlightedSegment(null);
    }
  }, [spinState.isSpinning]);

  return {
    // Estado
    segments,
    spinState,
    highlightedSegment,
    winnerGlowIntensity,

    // Acciones
    startSpin,
    updateAnimation,
    handleMouseMove,
    handleMouseLeave,

    // Refs
    audioContextRef,
    lastTickAngleRef,
  };
}