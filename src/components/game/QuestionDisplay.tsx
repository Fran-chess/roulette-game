// src/components/game/QuestionDisplay.tsx
"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useGameStore } from "@/store/gameStore";
import type { Question, AnswerOption } from "@/types";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

interface TimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
}

function Timer({
  initialSeconds,
  onTimeUp,
  isTV65,
  isTVTouch,
  isTabletPortrait,
  isTablet,
}: TimerProps & { isTV65: boolean; isTVTouch: boolean; isTabletPortrait: boolean; isTablet: boolean }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    setSeconds(initialSeconds);
    setIsUrgent(false);
  }, [initialSeconds]);

  useEffect(() => {
    // Estado urgente cuando quedan 5 segundos o menos
    setIsUrgent(seconds <= 5);

    if (seconds <= 0) {
      onTimeUp();
      return;
    }

    const timer = setTimeout(() => {
      setSeconds(seconds - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [seconds, onTimeUp]);

  // [OPTIMIZADO] Cronómetro circular responsive para tablets modernos
  const timerSize = useMemo(() => {
    if (isTV65) return 500;
    if (isTabletPortrait) return Math.min(120, window.innerWidth * 0.2); // Cronómetro más grande en tablet vertical
    if (isTVTouch) return 300;
    if (isTablet) return Math.min(160, window.innerWidth * 0.15); // Tablets horizontales
    return 200;
  }, [isTV65, isTabletPortrait, isTVTouch, isTablet]);
  
  const radius = useMemo(() => {
    if (isTV65) return 200;
    if (isTabletPortrait) return Math.min(45, timerSize * 0.38);
    if (isTVTouch) return 120;
    if (isTablet) return Math.min(65, timerSize * 0.42);
    return 80;
  }, [isTV65, isTabletPortrait, isTVTouch, isTablet, timerSize]);
  
  const strokeWidth = useMemo(() => {
    if (isTV65) return 30;
    if (isTabletPortrait) return Math.max(4, radius * 0.15);
    if (isTVTouch) return 20;
    if (isTablet) return Math.max(8, radius * 0.12);
    return 15;
  }, [isTV65, isTabletPortrait, isTVTouch, isTablet, radius]);

  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset =
    circumference - (seconds / initialSeconds) * circumference;

  return (
    <motion.div
      className={`flex flex-col items-center justify-center ${
        isTV65 ? "mb-20" : isTabletPortrait ? "mb-2" : "mb-12"
      }`}
      animate={isUrgent ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
    >
      {/* Cronómetro circular optimizado para todos los dispositivos */}
      <div
        className="relative"
        style={{ width: timerSize + 40, height: timerSize + 40 }}
      >
        <svg
          width={timerSize}
          height={timerSize}
          className="transform -rotate-90 absolute top-5 left-5"
          style={{ filter: "drop-shadow(0 15px 40px rgba(0, 0, 0, 0.6))" }}
        >
          {/* Círculo de fondo */}
          <circle
            cx={timerSize / 2}
            cy={timerSize / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Círculo de progreso */}
          <circle
            cx={timerSize / 2}
            cy={timerSize / 2}
            r={radius}
            stroke={isUrgent ? "#ef4444" : "#10b981"}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-in-out"
            style={{
              filter: isUrgent
                ? "drop-shadow(0 0 40px #ef4444) drop-shadow(0 0 80px #ef4444)"
                : "drop-shadow(0 0 30px #10b981) drop-shadow(0 0 60px #10b981)",
            }}
          />
        </svg>

        {/* Texto del cronómetro optimizado */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ width: timerSize, height: timerSize, top: 20, left: 20 }}
        >
          <div
            className={`text-center ${
              isUrgent ? "text-red-400" : "text-white"
            }`}
          >
            <div
              className={`font-black leading-none ${
                isTabletPortrait ? "timer-text-compact" : ""
              }`}
              style={!isTabletPortrait ? {
                fontSize: isTV65 ? "120px" : isTVTouch ? "72px" : "48px",
                textShadow: "0 6px 12px rgba(0, 0, 0, 0.9), 0 12px 24px rgba(0, 0, 0, 0.7)",
              } : {
                fontSize: "1rem",
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.9), 0 4px 8px rgba(0, 0, 0, 0.7)",
              }}
            >
              {seconds}
            </div>
            <div
              className={`font-bold opacity-90 mt-1 ${
                isTabletPortrait ? "timer-seconds-compact" : ""
              }`}
              style={!isTabletPortrait ? {
                fontSize: isTV65 ? "36px" : isTVTouch ? "24px" : "16px",
                textShadow: "0 3px 6px rgba(0, 0, 0, 0.9)",
              } : {
                fontSize: "0.45rem",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.9)",
              }}
            >
              segundos
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de urgencia optimizado */}
      {isUrgent && (
        <motion.div
          className="mt-6 text-red-400 font-black text-center"
          style={{
            fontSize: isTV65 ? "60px" : isTabletPortrait ? "18px" : isTVTouch ? "36px" : "24px",
            textShadow: "0 6px 12px rgba(0, 0, 0, 0.9), 0 0 30px #ef4444",
          }}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          {seconds <= 3 ? "¡ÚLTIMOS SEGUNDOS!" : "¡TIEMPO AGOTÁNDOSE!"}
        </motion.div>
      )}
    </motion.div>
  );
}

interface QuestionDisplayProps {
  question: Question;
  /** Callback que se llama cuando el usuario responde o se acaba el tiempo */
  onAnswered?: (result: {
    correct: boolean;
    option?: AnswerOption | null;
    timeUp?: boolean;
  }) => void;
}

export default function QuestionDisplay({ question, onAnswered }: QuestionDisplayProps) {
  const [isTablet, setIsTablet] = useState(false);
  const [isTVTouch, setIsTVTouch] = useState(false);
  const [isTV65, setIsTV65] = useState(false);
  const [isTabletPortrait, setIsTabletPortrait] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ width: 0, height: 0 });

  const currentParticipant = useGameStore((state) => state.currentParticipant);
  const gameSession = useGameStore((state) => state.gameSession);
  const updateCurrentParticipantScore = useGameStore(
    (state) => state.updateCurrentParticipantScore
  );
  const setPrizeFeedback = useGameStore((state) => state.setPrizeFeedback);
  const setShowConfetti = useGameStore((state) => state.setShowConfetti);

  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(
    null
  );
  const [isAnswered, setIsAnswered] = useState(false);
  const [answerState, setAnswerState] = useState<'idle' | 'selected' | 'revealed'>('idle');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const hasTimeUpExecutedRef = useRef(false);

  // [OPTIMIZADO] Tiempos ajustados para tablets modernos
  const timerSeconds = useMemo(() => {
    if (isTV65) return 20;
    if (isTabletPortrait) return 30; // Más tiempo para tablets verticales
    if (isTVTouch) return 40;
    if (isTablet) return 35; // Tiempo optimizado para tablets horizontales
    return 25; // Default
  }, [isTV65, isTabletPortrait, isTVTouch, isTablet]);

  // Sistema de ajuste automático basado en longitud de texto
  const textMetrics = useMemo(() => {
    const maxLength = Math.max(
      ...question.options.map((opt) => opt.text.length)
    );
    const avgLength =
      question.options.reduce((acc, opt) => acc + opt.text.length, 0) /
      question.options.length;

    return {
      maxLength,
      avgLength,
      isVeryLong: maxLength > 100,
      isLong: maxLength > 60,
      isMedium: maxLength > 30,
      needsCompact: avgLength > 50,
    };
  }, [question.options]);

  // [OPTIMIZADO] useEffect para detección mejorada de tablets modernos
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Detectar TV65
      const isTV65Resolution =
        (width >= 2160 && height >= 3840) || (width >= 3840 && height >= 2160);
      setIsTV65(isTV65Resolution);

      // Detectar TV Touch
      const isTVTouchResolution = width >= 1400 && !isTV65Resolution;
      setIsTVTouch(isTVTouchResolution);

      // [OPTIMIZADO] Detectar tablets modernos con mejor rango (600px-1279px)
      const isTabletResolution =
        width >= 600 && width <= 1279 && !isTV65Resolution && !isTVTouchResolution;
      setIsTablet(isTabletResolution);

      // [OPTIMIZADO] Detectar tablets en orientación vertical con mejor rango
      const isTabletPortraitResolution = 
        isTabletResolution && 
        height > width && // Orientación vertical
        height >= 800; // Altura mínima optimizada
      setIsTabletPortrait(isTabletPortraitResolution);

      // Debug info
      const newDebugInfo = { width, height };
      setDebugInfo(newDebugInfo);
      
    };

    // Throttle para optimización
    let timeoutId: NodeJS.Timeout | null = null;
    const throttledResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 500);
    };

    handleResize();

    window.addEventListener("resize", throttledResize);
    return () => {
      window.removeEventListener("resize", throttledResize);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    setAnswerState('idle');
    setIsTransitioning(false);
    hasTimeUpExecutedRef.current = false;
  }, [question.id]);

  const handleTimeUp = useCallback(async () => {
    if (isAnswered || hasTimeUpExecutedRef.current) return;
    hasTimeUpExecutedRef.current = true;
    setIsAnswered(true);
    
    const correctOption = question.options.find((o) => o.correct);

    try {
      // Guardar la jugada de tiempo agotado en el backend
      if (currentParticipant) {
        
        const playData = {
          participant_id: currentParticipant.id,
          session_id: currentParticipant.session_id,
          question_id: question.id,
          answered_correctly: false,
          prize_name: undefined,
          admin_id: gameSession?.admin_id || null
        };

        const response = await fetch('/api/plays/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(playData),
        });

        const result = await response.json();

        if (response.ok) {
          
          updateCurrentParticipantScore({
            questionId: question.id,
            answeredCorrectly: false,
            prizeWon: undefined,
          });
        } else {
          console.error('❌ QuestionDisplay: Error guardando jugada de tiempo agotado:', result.message);
          
          updateCurrentParticipantScore({
            questionId: question.id,
            answeredCorrectly: false,
            prizeWon: undefined,
          });
        }
      }
    } catch (error) {
      console.error('❌ QuestionDisplay: Error de red al guardar jugada de tiempo agotado:', error);
      
      if (currentParticipant) {
        updateCurrentParticipantScore({
          questionId: question.id,
          answeredCorrectly: false,
          prizeWon: undefined,
        });
      }
    }

    // Actualizar feedback (siempre local para tiempo agotado) SIN premios
    setPrizeFeedback({
      answeredCorrectly: false,
      explanation: question.explanation || "",
      correctOption: correctOption?.text || "",
      prizeName: "",
    });

    // Notificar al padre (TVPage) que se terminó el tiempo
    if (onAnswered) onAnswered({ correct: false, option: null, timeUp: true });
    // Eliminar el setTimeout y setGameState("prize") de aquí
  }, [
    isAnswered,
    question.id,
    question.explanation,
    question.options,
    currentParticipant,
    gameSession,
    updateCurrentParticipantScore,
    setPrizeFeedback,
    onAnswered,
  ]);

  const handleAnswer = useCallback(
    async (option: AnswerOption) => {
      if (isAnswered || hasTimeUpExecutedRef.current || isTransitioning) return;
      
      // Start transition state
      setIsTransitioning(true);
      setSelectedAnswer(option);
      setAnswerState('selected');
      
      // Smooth transition delay before showing feedback
      await new Promise(resolve => setTimeout(resolve, 400));
      
      hasTimeUpExecutedRef.current = true;
      setIsAnswered(true);
      setAnswerState('revealed');
      
      const correctAnswer = option.correct;
      const correctOption = question.options.find((o) => o.correct);
      
      // Mostrar confetti inmediatamente para respuestas correctas
      if (correctAnswer) setShowConfetti(true);

      try {
        // Guardar la jugada en el backend con la lógica de premios únicos
        if (currentParticipant) {
          
          const playData = {
            participant_id: currentParticipant.id,
            session_id: currentParticipant.session_id,
            question_id: question.id,
            answered_correctly: correctAnswer,
            prize_name: undefined, // No hay premios específicos
            admin_id: gameSession?.admin_id || null
          };

          const response = await fetch('/api/plays/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(playData),
          });

          const result = await response.json();

          if (response.ok) {

            // Actualizar el feedback - solo resultado de pregunta, no premios
            setPrizeFeedback({
              answeredCorrectly: correctAnswer,
              explanation: !correctAnswer ? question.explanation || "" : "",
              correctOption: correctOption?.text || "",
              prizeName: "", // No mostramos premios específicos
            });

            // Actualizar el store local (sin premios)
            updateCurrentParticipantScore({
              questionId: question.id,
              answeredCorrectly: correctAnswer,
              prizeWon: undefined, // No hay premios específicos
            });

            // Si ya había ganado un premio, mostrar mensaje especial en el log
            if (result.result.already_won_prize && correctAnswer) {
              console.log('🎉 El participante ya había ganado un premio, pero puede seguir jugando');
            }
          } else {
            console.error('❌ QuestionDisplay: Error guardando jugada:', result.message);
            
            // Fallback: usar lógica local si falla el servidor (sin premios)
            setPrizeFeedback({
              answeredCorrectly: correctAnswer,
              explanation: !correctAnswer ? question.explanation || "" : "",
              correctOption: correctOption?.text || "",
              prizeName: "", // No hay premios específicos
            });

            updateCurrentParticipantScore({
              questionId: question.id,
              answeredCorrectly: correctAnswer,
              prizeWon: undefined, // No hay premios específicos
            });
          }
        } else {
          // Sin participante: usar lógica local SIN premios
          console.warn('⚠️ QuestionDisplay: No hay participante actual, usando lógica local');
          setPrizeFeedback({
            answeredCorrectly: correctAnswer,
            explanation: !correctAnswer ? question.explanation || "" : "",
            correctOption: correctOption?.text || "",
            prizeName: "",
          });
        }
      } catch (error) {
        console.error('❌ QuestionDisplay: Error de red al guardar jugada:', error);
        
        // Fallback: usar lógica local SIN premios si hay error de red
        setPrizeFeedback({
          answeredCorrectly: correctAnswer,
          explanation: !correctAnswer ? question.explanation || "" : "",
          correctOption: correctOption?.text || "",
          prizeName: "",
        });

        if (currentParticipant) {
          updateCurrentParticipantScore({
            questionId: question.id,
            answeredCorrectly: correctAnswer,
            prizeWon: undefined, // No hay premios específicos
          });
        }
      }

      // Notificar al padre (TVPage) que se respondió
      if (onAnswered) onAnswered({ correct: correctAnswer, option });
      // Eliminar el setTimeout y setGameState("prize") de aquí
    },
    [
      isAnswered,
      question.id,
      question.explanation,
      question.options,
      currentParticipant,
      gameSession,
      updateCurrentParticipantScore,
      setPrizeFeedback,
      setShowConfetti,
      onAnswered,
      isTransitioning,
    ]
  );

  // Función para obtener clases de estilo por opción con estados mejorados
  const getOptionClasses = useCallback(
    (option: AnswerOption) => {
      const baseClasses =
        "group relative w-full text-left transition-all duration-500 ease-out transform overflow-hidden";

      let stateClasses = "";
      let cursorClass = "";
      
      // Para tablets, mantenemos solo las clases básicas - los estilos vienen de getOptionStyleOverrides
      if (isTabletPortrait || isTablet) {
        if (answerState === 'idle') {
          stateClasses = "text-white";
          cursorClass = "cursor-pointer";
        } else if (answerState === 'selected' && selectedAnswer === option) {
          stateClasses = "text-white animate-pulse";
          cursorClass = "cursor-default";
        } else if (answerState === 'selected') {
          stateClasses = "";
          cursorClass = "cursor-not-allowed";
        } else if (answerState === 'revealed') {
          if (selectedAnswer === option) {
            if (option.correct) {
              stateClasses = "text-white";
            } else {
              stateClasses = "text-white";
            }
          } else if (option.correct) {
            stateClasses = "text-white";
          } else {
            stateClasses = "";
          }
          cursorClass = "cursor-default";
        }
      } else {
        // Para otros dispositivos, mantenemos la lógica original
        if (answerState === 'idle') {
          stateClasses =
            "bg-gradient-to-r from-slate-700/85 to-slate-600/85 border-2 border-slate-400/50 text-white shadow-md focus:outline-none focus:ring-4 focus:ring-slate-300/40";
          cursorClass = "cursor-pointer";
        } else if (answerState === 'selected' && selectedAnswer === option) {
          stateClasses =
            "bg-gradient-to-r from-blue-500/90 to-indigo-500/90 border-2 border-blue-300/70 text-white ring-2 ring-blue-300/50 shadow-lg animate-pulse";
          cursorClass = "cursor-default";
        } else if (answerState === 'selected') {
          stateClasses =
            "bg-gradient-to-r from-slate-700/60 to-slate-600/60 border-2 border-slate-400/30 text-slate-300 shadow-sm opacity-60";
          cursorClass = "cursor-not-allowed";
        } else if (answerState === 'revealed') {
          if (selectedAnswer === option) {
            if (option.correct) {
              stateClasses =
                "bg-gradient-to-r from-green-500 to-emerald-500 border-2 border-green-300 text-white ring-4 ring-green-300/60 shadow-2xl";
            } else {
              stateClasses =
                "bg-gradient-to-r from-red-500 to-rose-500 border-2 border-red-300 text-white ring-4 ring-red-300/60 shadow-2xl";
            }
          } else if (option.correct) {
            stateClasses =
              "bg-gradient-to-r from-green-400/90 to-emerald-400/90 border-2 border-green-200 text-white ring-2 ring-green-200/50 shadow-lg";
          } else {
            stateClasses = "bg-gray-600/70 border-2 border-gray-400/40 text-gray-300 shadow-md opacity-75";
          }
          cursorClass = "cursor-default";
        }
      }

      return `${baseClasses} ${stateClasses} ${cursorClass}`;
    },
    [answerState, selectedAnswer, isTabletPortrait, isTablet]
  );

  // Función para obtener estilos inline según dispositivo - OPTIMIZADA
  const getOptionStyles = useCallback(() => {
    const baseStyles = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      overflow: "hidden",
      wordBreak: "break-word" as const,
      overflowWrap: "break-word" as const,
      hyphens: "auto" as const,
      transition: "all 0.3s ease-out",
    };

    if (isTV65) {
      return {
        ...baseStyles,
        padding: "32px 56px",
        minHeight: "120px",
        maxHeight: "260px",
        borderRadius: "24px",
        fontWeight: "900",
        lineHeight: "1.1",
        textShadow:
          "0 4px 8px rgba(0, 0, 0, 0.9), 0 8px 16px rgba(0, 0, 0, 0.7)",
        boxShadow:
          "0 25px 50px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)",
      };
    } else if (isTabletPortrait) {
      // [OPTIMIZADO] Estilos responsive para tablets verticales - altura controlada por CSS
      const fontSize = textMetrics.isLong ? "0.75rem" : "0.85rem";
      const padding = "0.6rem 0.875rem";
      return {
        ...baseStyles,
        fontSize,
        padding,
        borderRadius: "0.5rem",
        fontWeight: "600",
        lineHeight: "1.2",
        textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 4px rgba(255, 255, 255, 0.1)",
      };
    } else if (isTVTouch) {
      return {
        ...baseStyles,
        fontSize: textMetrics.isLong ? "44px" : "52px",
        padding: "36px 44px",
        minHeight: "160px",
        borderRadius: "16px",
        fontWeight: "700",
        lineHeight: "1.3",
      };
    } else if (isTablet) {
      // [OPTIMIZADO] Estilos para tablets horizontales - altura controlada por CSS
      const fontSize = textMetrics.isLong ? `${Math.max(18, window.innerWidth * 0.018)}px` : `${Math.max(22, window.innerWidth * 0.022)}px`;
      const padding = `${Math.max(20, window.innerWidth * 0.02)}px ${Math.max(28, window.innerWidth * 0.025)}px`;
      return {
        ...baseStyles,
        fontSize,
        padding,
        borderRadius: "12px",
        fontWeight: "650",
        lineHeight: "1.35",
        textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.25)",
      };
    } else {
      return {
        ...baseStyles,
        fontSize: textMetrics.isLong ? "36px" : "40px",
        padding: "28px 36px",
        minHeight: "110px",
        borderRadius: "12px",
        fontWeight: "600",
        lineHeight: "1.4",
      };
    }
      }, [isTV65, isTabletPortrait, isTVTouch, isTablet, textMetrics]);

  // Función para obtener estilos consistentes para tablets
  const getOptionStyleOverrides = useCallback((option: AnswerOption) => {
    if (!isTabletPortrait && !isTablet) return {}; // Solo aplicar en tablets

    // Estilos base consistentes para todas las opciones en estado inicial
    const baseStyles: React.CSSProperties = {
      background: 'linear-gradient(135deg, rgba(71, 85, 105, 0.85) 0%, rgba(51, 65, 85, 0.85) 100%)',
      borderColor: 'rgba(255, 255, 255, 0.5)',
      borderWidth: '2px',
      borderStyle: 'solid',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      transition: 'all 0.3s ease-out',
    };

    // Estados específicos solo cuando sea necesario
    if (answerState === 'selected' && selectedAnswer === option) {
      return {
        ...baseStyles,
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(79, 70, 229, 0.9) 100%)',
        borderColor: 'rgba(147, 197, 253, 0.7)',
        boxShadow: '0 8px 12px -2px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(147, 197, 253, 0.5)',
      };
    } else if (answerState === 'revealed') {
      if (selectedAnswer === option && option.correct) {
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(16, 185, 129) 100%)',
          borderColor: 'rgb(134, 239, 172)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 4px rgba(134, 239, 172, 0.6)',
        };
      } else if (selectedAnswer === option && !option.correct) {
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, rgb(239, 68, 68) 0%, rgb(220, 38, 38) 100%)',
          borderColor: 'rgb(248, 113, 113)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 4px rgba(248, 113, 113, 0.6)',
        };
      } else if (option.correct && selectedAnswer !== option) {
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.9) 0%, rgba(52, 211, 153, 0.9) 100%)',
          borderColor: 'rgb(187, 247, 208)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 0 0 2px rgba(187, 247, 208, 0.5)',
        };
      } else {
        return {
          ...baseStyles,
          background: 'rgba(75, 85, 99, 0.7)',
          borderColor: 'rgba(156, 163, 175, 0.4)',
          boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          color: 'rgb(209, 213, 219)',
          opacity: '0.75',
        };
      }
    } else if (answerState === 'selected') {
      // Opciones no seleccionadas durante transición
      return {
        ...baseStyles,
        background: 'linear-gradient(135deg, rgba(71, 85, 105, 0.6) 0%, rgba(51, 65, 85, 0.6) 100%)',
        borderColor: 'rgba(148, 163, 184, 0.3)',
        boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        opacity: '0.6',
        color: 'rgb(203, 213, 225)',
      };
    }

    return baseStyles; // Estado idle con estilos base consistentes
  }, [answerState, selectedAnswer, isTabletPortrait, isTablet]);
  
  // Animaciones escalonadas
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
        when: "beforeChildren" as const,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.4, 
        ease: "easeOut" as const
      },
    },
  };

  // Layout principal NUEVO - sin logo, cronómetro arriba, preguntas abajo
  return (
    <div className={`min-h-screen bg-main-gradient relative overflow-hidden ${
      isTabletPortrait ? 'question-layout-compact' : ''
    }`}>
      {/* DEBUG INFO VISUAL - SOLO EN DESARROLLO */}
      {process.env.NODE_ENV === "development" && debugInfo.width > 0 && (
        <div className="absolute top-0 left-0 bg-black/80 text-white p-4 text-lg font-bold z-50 rounded-br-lg">
          <div>
            Resolución: {debugInfo.width}x{debugInfo.height}
          </div>
          <div>
            TV65: {isTV65 ? "SÍ" : "NO"} | TVTouch: {isTVTouch ? "SÍ" : "NO"}
          </div>
          <div>Tablet: {isTablet ? "SÍ" : "NO"}</div>
          <div>Tablet Vertical: {isTabletPortrait ? "SÍ" : "NO"}</div>
        </div>
      )}

      {/* Partículas de fondo decorativas */}
      <div className="particles-bg">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
            }}
          />
        ))}
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 min-h-screen flex flex-col"
      >
        {/* CRONÓMETRO CENTRADO EN LA PARTE SUPERIOR */}
        <div className={`w-full flex justify-center items-center ${
          isTabletPortrait ? 'pt-0.5 pb-0' : 'pt-6 pb-2'
        }`}>
          <motion.div
            variants={itemVariants}
            className="flex justify-center"
          >
            <Timer
              key={`timer-${question.id}-${currentParticipant?.id || "anonymous"}`}
              initialSeconds={timerSeconds}
              onTimeUp={handleTimeUp}
              isTV65={isTV65}
              isTVTouch={isTVTouch}
              isTabletPortrait={isTabletPortrait}
              isTablet={isTablet}
            />
          </motion.div>
        </div>

        {/* CONTENIDO PRINCIPAL: PREGUNTA Y OPCIONES */}
        <main className={`flex-1 flex flex-col justify-center items-center ${
          isTabletPortrait ? 'px-2 py-1' : 'px-8 py-2'
        }`}>
          <div className="w-full max-w-4xl">
            {/* Contenedor de pregunta COMPACTO */}
            <motion.div
              variants={itemVariants}
              className={`relative ${
                isTabletPortrait 
                  ? 'question-container-modern' 
                  : 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg mb-4'
              }`}
              style={!isTabletPortrait ? {
                padding: isTV65 ? "32px 40px" : "24px 32px",
                marginBottom: isTV65 ? "20px" : "16px",
                boxShadow: isTV65
                  ? "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                  : "0 4px 16px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
              } : {
                padding: "0.75rem 1rem",
                marginBottom: "0.5rem",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(24px)",
                borderRadius: "1rem",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h2
                className="font-marineBold text-white text-center leading-tight"
                style={!isTabletPortrait ? {
                  fontSize: isTV65 ? "72px" : isTVTouch ? "48px" : "28px",
                  marginBottom: "0",
                  textShadow: "0 6px 12px rgba(0, 0, 0, 0.9), 0 12px 24px rgba(0, 0, 0, 0.7)",
                  fontWeight: "900",
                } : {
                  fontSize: "0.85rem",
                  marginBottom: "0",
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.9), 0 4px 8px rgba(0, 0, 0, 0.7)",
                  fontWeight: "800",
                }}
              >
                {question.text}
              </h2>
            </motion.div>

            {/* Grid de opciones COMPACTO */}
            <motion.div
              variants={itemVariants}
              className={`${
                isTabletPortrait 
                  ? 'options-grid-modern' 
                  : 'grid grid-cols-1'
              }`}
              style={!isTabletPortrait ? {
                gap: isTV65 ? "24px" : "16px",
              } : {
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "0.75rem",
                maxWidth: "100%",
                margin: "0 auto",
              }}
            >
              {question.options.map((option, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}

                >
                  <Button
                    variant="custom"
                    onClick={() => answerState === 'idle' && !isTransitioning && handleAnswer(option)}
                    className={`${getOptionClasses(option)} ${
                      isTabletPortrait 
                        ? 'answer-option-modern' 
                        : isTV65 
                        ? 'tv-65-layout' 
                        : ''
                    } btn-option ${answerState !== 'idle' ? 'pointer-events-none' : ''}`}
                    style={{
                      ...getOptionStyles(),
                      userSelect: 'none',
                      // Aplicar estilos consistentes para tablets
                      ...(getOptionStyleOverrides(option)),
                    }}
                    disabled={answerState !== 'idle' || isTransitioning}
                    aria-label={`Opción ${String.fromCharCode(65 + index)}: ${option.text}${answerState === 'revealed' && option.correct ? ' (Respuesta correcta)' : ''}${answerState === 'revealed' && selectedAnswer === option && !option.correct ? ' (Respuesta incorrecta)' : ''}`}
                    aria-pressed={selectedAnswer === option}
                    role="button"
                    tabIndex={answerState === 'idle' ? 0 : -1}
                  >
                    {/* Layout específico para cada dispositivo */}
                    {isTV65 ? (
                      <>
                        {/* Layout específico para TV65 */}
                        <span
                          className="tv65-option-scroll tv65-clamp-text"
                          style={{
                            flex: 1,
                            display: "block",
                            overflowY: "auto",
                            maxHeight: "220px",
                            paddingRight: "56px",
                            textShadow: "0 4px 8px rgba(0,0,0,1)",
                            wordBreak: "break-word" as const,
                            overflowWrap: "break-word" as const,
                            hyphens: "auto" as const,
                            whiteSpace: "normal" as const,
                          }}
                        >
                          {option.text}
                        </span>
                        <div
                          style={{
                            minWidth: "112px",
                            minHeight: "112px",
                            maxWidth: "112px",
                            maxHeight: "112px",
                            borderRadius: "9999px",
                            background: "rgba(255,255,255,0.3)",
                            color: "#fff",
                            fontWeight: "900",
                            fontSize: "36px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginLeft: "48px",
                            boxShadow: "0 4px 8px rgba(0,0,0,0.7)",
                            flexShrink: 0,
                            transition: "all 0.3s ease-out",
                          }}
                        >
                          {answerState === 'revealed' && selectedAnswer === option ? (
                            option.correct ? '✓' : '✗'
                          ) : answerState === 'revealed' && option.correct && selectedAnswer !== option ? (
                            '✓'
                          ) : (
                            String.fromCharCode(65 + index)
                          )}
                        </div>
                      </>
                    ) : isTabletPortrait ? (
                      // Layout ULTRA COMPACTO para tablet vertical
                      <>
                        <span className="flex-1 leading-tight break-words text-xs">
                          {option.text}
                        </span>
                        <div
                          className="option-icon-modern"
                          style={{
                            minWidth: "1.75rem",
                            minHeight: "1.75rem",
                            maxWidth: "1.75rem",
                            maxHeight: "1.75rem",
                            borderRadius: "9999px",
                            background: answerState === 'revealed' && selectedAnswer === option ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.75)",
                            color: "#374151",
                            fontWeight: "800",
                            fontSize: "0.9rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginLeft: "0.75rem",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                            transition: "all 0.3s ease-out",
                          }}
                        >
                          {answerState === 'revealed' && selectedAnswer === option ? (
                            option.correct ? '✓' : '✗'
                          ) : answerState === 'revealed' && option.correct && selectedAnswer !== option ? (
                            '✓'
                          ) : (
                            String.fromCharCode(65 + index)
                          )}
                        </div>
                      </>
                    ) : (
                      // Layout original para otros dispositivos
                      <div className="flex items-center justify-between w-full h-full">
                        <span className="flex-1 leading-tight break-words">
                          {option.text}
                        </span>
                        <div
                          className="ml-4 rounded-xl flex items-center justify-center font-black bg-gradient-to-br from-white/90 to-white/70 text-gray-800 shadow-lg border border-white/50"
                          style={{
                            width: isTVTouch ? "64px" : isTablet ? "52px" : "48px",
                            height: isTVTouch ? "64px" : isTablet ? "52px" : "48px",
                            fontSize: isTVTouch ? "32px" : isTablet ? "26px" : "24px",
                            marginLeft: isTVTouch ? "24px" : isTablet ? "20px" : "16px",
                            backdropFilter: "blur(8px)",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
                            transition: "all 0.3s ease-out",
                          }}
                        >
                          {answerState === 'revealed' && selectedAnswer === option ? (
                            option.correct ? '✓' : '✗'
                          ) : answerState === 'revealed' && option.correct && selectedAnswer !== option ? (
                            '✓'
                          ) : (
                            String.fromCharCode(65 + index)
                          )}
                        </div>
                      </div>
                    )}
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </main>

        {/* Footer con nombre del participante mejorado */}
        <footer className={`text-center ${isTabletPortrait ? 'py-1' : 'py-6'}`}>
          {currentParticipant?.nombre && (
            <motion.div
              variants={itemVariants}
              className="inline-block"
            >
              <div
                className="relative bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-lg rounded-full border border-white/30 shadow-2xl"
                style={{
                  padding: isTV65 ? "20px 60px" : isTabletPortrait ? "8px 20px" : isTablet ? "12px 32px" : "16px 40px",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                }}
              >
                <div className="flex items-center justify-center gap-3">
                  {/* Icono de usuario */}
                  <div
                    className="flex-shrink-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg"
                    style={{
                      width: isTV65 ? "48px" : isTabletPortrait ? "24px" : isTablet ? "32px" : "36px",
                      height: isTV65 ? "48px" : isTabletPortrait ? "24px" : isTablet ? "32px" : "36px",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="white"
                      style={{
                        width: isTV65 ? "28px" : isTabletPortrait ? "14px" : isTablet ? "18px" : "20px",
                        height: isTV65 ? "28px" : isTabletPortrait ? "14px" : isTablet ? "18px" : "20px",
                      }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      />
                    </svg>
                  </div>
                  
                  {/* Texto del participante */}
                  <div className="flex flex-col items-start">
                    <span
                      className="text-white/70 font-medium uppercase tracking-wider"
                      style={{
                        fontSize: isTV65 ? "18px" : isTabletPortrait ? "10px" : isTablet ? "12px" : "14px",
                        letterSpacing: "0.1em",
                      }}
                    >
                      Jugador Actual
                    </span>
                    <span
                      className="text-white font-bold"
                      style={{
                        fontSize: isTV65 ? "36px" : isTabletPortrait ? "18px" : isTablet ? "24px" : "28px",
                        textShadow: "0 2px 8px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.3)",
                        lineHeight: "1.1",
                      }}
                    >
                      {currentParticipant.nombre}
                    </span>
                  </div>
                </div>
                
                {/* Efecto de brillo animado */}
                <div
                  className="absolute inset-0 rounded-full opacity-0 animate-pulse"
                  style={{
                    background: "linear-gradient(135deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)",
                    animation: "shimmer 3s infinite",
                  }}
                />
              </div>
            </motion.div>
          )}
        </footer>
      </motion.div>
    </div>
  );
}
