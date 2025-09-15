/**
 * Hook personalizado para manejar la lógica de preguntas y respuestas
 * Centraliza el estado y comportamiento del componente QuestionDisplay
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { Question, AnswerOption } from '@/types';

/**
 * Estados posibles de una respuesta
 */
export type AnswerState = 'idle' | 'selected' | 'revealed';

/**
 * Configuración del hook
 */
interface UseQuestionLogicConfig {
  question: Question;
  onAnswered?: (result: {
    correct: boolean;
    option: AnswerOption | null;
    timeUp?: boolean;
  }) => void;
}

/**
 * Retorno del hook
 */
interface UseQuestionLogicReturn {
  // Estado
  selectedAnswer: AnswerOption | null;
  isAnswered: boolean;
  answerState: AnswerState;
  isTransitioning: boolean;

  // Acciones
  handleAnswer: (option: AnswerOption) => Promise<void>;
  handleTimeUp: () => Promise<void>;
  getOptionStyle: (option: AnswerOption) => string;
  resetQuestion: () => void;
}

/**
 * Hook para manejar la lógica de preguntas y respuestas
 *
 * @example
 * ```tsx
 * const questionLogic = useQuestionLogic({
 *   question: currentQuestion,
 *   onAnswered: (result) => console.log(result)
 * });
 * ```
 */
export function useQuestionLogic({
  question,
  onAnswered,
}: UseQuestionLogicConfig): UseQuestionLogicReturn {
  // Store de Zustand
  const setGameState = useGameStore(state => state.setGameState);
  const setPrizeFeedback = useGameStore(state => state.setPrizeFeedback);
  const setShowConfetti = useGameStore(state => state.setShowConfetti);

  // Estado local
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Ref para evitar ejecuciones múltiples
  const hasTimeUpExecutedRef = useRef(false);

  // Reiniciar estado cuando cambie la pregunta
  useEffect(() => {
    resetQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]); // resetQuestion es estable, no necesita estar en deps

  /**
   * Reinicia el estado de la pregunta
   */
  const resetQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    setAnswerState('idle');
    setIsTransitioning(false);
    hasTimeUpExecutedRef.current = false;
  }, []);

  /**
   * Maneja cuando se agota el tiempo
   */
  const handleTimeUp = useCallback(async () => {
    // Evitar ejecución múltiple
    if (isAnswered || hasTimeUpExecutedRef.current) return;
    hasTimeUpExecutedRef.current = true;
    setIsAnswered(true);

    const correctOption = question.options.find(o => o.correct);

    // Actualizar feedback del premio
    setPrizeFeedback({
      answeredCorrectly: false,
      explanation: question.explanation || '',
      correctOption: correctOption?.text || '',
      prizeName: '',
    });

    // Notificar al callback
    onAnswered?.({
      correct: false,
      option: null,
      timeUp: true,
    });

    // Transición al estado de premio
    setTimeout(() => {
      setGameState('prize');
    }, 2000);
  }, [
    isAnswered,
    question.options,
    question.explanation,
    setPrizeFeedback,
    onAnswered,
    setGameState,
  ]);

  /**
   * Maneja la selección de una respuesta
   */
  const handleAnswer = useCallback(async (option: AnswerOption) => {
    // Validar que se pueda responder
    if (isAnswered || hasTimeUpExecutedRef.current || isTransitioning) return;

    // Marcar como en transición
    setIsTransitioning(true);
    setSelectedAnswer(option);
    setAnswerState('selected');

    // Delay para mostrar la selección
    await new Promise(resolve => setTimeout(resolve, 400));

    // Marcar como respondido
    hasTimeUpExecutedRef.current = true;
    setIsAnswered(true);
    setAnswerState('revealed');

    const isCorrect = option.correct;
    const correctOption = question.options.find(o => o.correct);

    // Mostrar confetti si es correcto
    if (isCorrect) {
      setShowConfetti(true);
    }

    // Actualizar feedback del premio
    setPrizeFeedback({
      answeredCorrectly: isCorrect,
      explanation: !isCorrect ? (question.explanation || '') : '',
      correctOption: correctOption?.text || '',
      prizeName: isCorrect && question.prize ? question.prize : '',
    });

    // Notificar al callback
    onAnswered?.({
      correct: isCorrect,
      option,
    });

    // Transición al estado de premio
    setTimeout(() => {
      setGameState('prize');
    }, 2500);
  }, [
    isAnswered,
    isTransitioning,
    question.options,
    question.explanation,
    question.prize,
    setShowConfetti,
    setPrizeFeedback,
    onAnswered,
    setGameState,
  ]);

  /**
   * Obtiene el estilo de una opción según el estado actual
   */
  const getOptionStyle = useCallback((option: AnswerOption): string => {
    // Estado inicial - todas las opciones disponibles
    if (answerState === 'idle') {
      return 'bg-gradient-to-br from-blue-500/80 to-purple-600/80 hover:from-blue-600 hover:to-purple-700';
    }

    // Estado seleccionado - mostrar selección
    if (answerState === 'selected') {
      if (selectedAnswer === option) {
        return 'bg-gradient-to-br from-yellow-500/80 to-orange-600/80 animate-pulse';
      }
      return 'bg-gradient-to-br from-gray-600/50 to-gray-700/50 opacity-50';
    }

    // Estado revelado - mostrar respuestas correctas/incorrectas
    if (answerState === 'revealed') {
      if (option.correct) {
        return 'bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse';
      }
      if (selectedAnswer === option && !option.correct) {
        return 'bg-gradient-to-br from-red-500 to-rose-600';
      }
      return 'bg-gradient-to-br from-gray-600/50 to-gray-700/50 opacity-50';
    }

    return '';
  }, [answerState, selectedAnswer]);

  return {
    // Estado
    selectedAnswer,
    isAnswered,
    answerState,
    isTransitioning,

    // Acciones
    handleAnswer,
    handleTimeUp,
    getOptionStyle,
    resetQuestion,
  };
}