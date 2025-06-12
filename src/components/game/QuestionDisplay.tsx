// src/components/game/QuestionDisplay.tsx
"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useGameStore } from "@/store/gameStore";
import type { Question, AnswerOption } from "@/types";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";

interface TimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
}

function Timer({
  initialSeconds,
  onTimeUp,
  isTV65,
  isTVTouch,
  isTablet800,
}: TimerProps & { isTV65: boolean; isTVTouch: boolean; isTablet800: boolean }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    setSeconds(initialSeconds);
    setIsUrgent(false);
  }, [initialSeconds]);

  useEffect(() => {
    // [modificación] Estado urgente cuando quedan 5 segundos o menos (antes 10)
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

  // [modificación] Cronómetro circular responsivo - ahora incluye tablet 800x1340
  const timerSize = isTV65 ? 500 : isTablet800 ? 200 : isTVTouch ? 300 : 200;
  const radius = isTV65 ? 200 : isTablet800 ? 80 : isTVTouch ? 120 : 80;
  const strokeWidth = isTV65 ? 30 : isTablet800 ? 12 : isTVTouch ? 20 : 15;

  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset =
    circumference - (seconds / initialSeconds) * circumference;

  // [modificación] Debug info para verificar detección - SOLO CUANDO CAMBIA
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // console.log('⏱️ Timer configurado:', { isTV65, isTVTouch, isTablet800, timerSize });
    }
  }, [isTV65, isTVTouch, isTablet800, timerSize]);

  return (
    <motion.div
      className={`flex flex-col items-center justify-center ${
        isTV65 ? "mb-20" : isTablet800 ? "mb-8" : "mb-12"
      }`}
      animate={isUrgent ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
    >
      {/* [modificación] Debug visual eliminado para limpiar interfaz */}

      {/* [modificación] Cronómetro circular optimizado para todos los dispositivos */}
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
          {/* [modificación] Círculo de fondo ultra visible */}
          <circle
            cx={timerSize / 2}
            cy={timerSize / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* [modificación] Círculo de progreso ultra llamativo */}
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

        {/* [modificación] Texto del cronómetro optimizado para todos los dispositivos */}
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
                isTablet800 ? "timer-text" : ""
              }`}
              style={!isTablet800 ? {
                fontSize: isTV65 ? "120px" : isTVTouch ? "72px" : "48px",
                textShadow: "0 6px 12px rgba(0, 0, 0, 0.9), 0 12px 24px rgba(0, 0, 0, 0.7)",
              } : {
                textShadow: "0 6px 12px rgba(0, 0, 0, 0.9), 0 12px 24px rgba(0, 0, 0, 0.7)",
              }}
            >
              {seconds}
            </div>
            <div
              className={`font-bold opacity-90 mt-2 ${
                isTablet800 ? "timer-seconds" : ""
              }`}
              style={!isTablet800 ? {
                fontSize: isTV65 ? "36px" : isTVTouch ? "24px" : "16px",
                textShadow: "0 3px 6px rgba(0, 0, 0, 0.9)",
              } : {
                textShadow: "0 3px 6px rgba(0, 0, 0, 0.9)",
              }}
            >
              segundos
            </div>
          </div>
        </div>
      </div>

      {/* [modificación] Indicador de urgencia optimizado para todos los dispositivos */}
      {isUrgent && (
        <motion.div
          className="mt-6 text-red-400 font-black text-center"
          style={{
            fontSize: isTV65 ? "60px" : isTablet800 ? "24px" : isTVTouch ? "36px" : "24px",
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
}

export default function QuestionDisplay({ question }: QuestionDisplayProps) {
  const [isTablet, setIsTablet] = useState(false);
  const [isTVTouch, setIsTVTouch] = useState(false);
  const [isTV65, setIsTV65] = useState(false);
  const [isTablet800, setIsTablet800] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ width: 0, height: 0 });

  const setGameState = useGameStore((state) => state.setGameState);
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
  const hasTimeUpExecutedRef = useRef(false);

  // [modificación] Tiempos ajustados - incluir tablet 800x1340
  const timerSeconds = useMemo(() => {
    return isTV65 ? 20 : isTablet800 ? 25 : isTVTouch ? 40 : isTablet ? 30 : 25; // [NUEVO] 25 segundos para tablet 800
  }, [isTV65, isTablet800, isTVTouch, isTablet]); // [NUEVO] Agregar isTablet800 a dependencias

  // [modificación] Sistema de ajuste automático basado en longitud de texto
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

  // [modificación] useEffect para detección de dispositivo y actualización de tamaño
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

      // Detectar Tablet
      const isTabletResolution =
        width >= 768 && width <= 1399 && !isTV65Resolution;
      setIsTablet(isTabletResolution);

      // Detectar Tablet 800x1340
      const isTablet800Resolution = (width >= 790 && width <= 810) && (height >= 1330 && height <= 1350); // [NUEVO] Rango más flexible
      setIsTablet800(isTablet800Resolution);

      // Debug info
      const newDebugInfo = { width, height };
      setDebugInfo(newDebugInfo);
      
      // [NUEVO] Log para tablet 800x1340
      if (isTablet800Resolution) {
        console.log('📱 QuestionDisplay: Tablet 800x1340 detectada, aplicando optimizaciones específicas');
      }
    };

    // [modificación] Throttle para optimización
    let timeoutId: NodeJS.Timeout | null = null;
    const throttledResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 500); // [modificación] Throttle aumentado a 500ms
    };

    // [modificación] Ejecutar una vez al montar
    handleResize();

    window.addEventListener("resize", throttledResize);
    return () => {
      window.removeEventListener("resize", throttledResize);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []); // [modificación] Dependencias vacías son correctas para este caso - solo queremos ejecutar en mount

  useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswered(false);
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
        console.log('⏰ QuestionDisplay: Tiempo agotado, enviando jugada al servidor...');
        
        const playData = {
          participant_id: currentParticipant.id,
          session_id: currentParticipant.session_id,
          question_id: question.id,
          answered_correctly: false,
          prize_name: undefined,
          // [modificación] Usar admin_id real de la sesión o null
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
          console.log('✅ QuestionDisplay: Jugada de tiempo agotado guardada exitosamente');
          
          updateCurrentParticipantScore({
            questionId: question.id,
            answeredCorrectly: false,
            prizeWon: undefined,
          });
        } else {
          console.error('❌ QuestionDisplay: Error guardando jugada de tiempo agotado:', result.message);
          
          // Fallback: actualizar store local
          updateCurrentParticipantScore({
            questionId: question.id,
            answeredCorrectly: false,
            prizeWon: undefined,
          });
        }
      }
    } catch (error) {
      console.error('❌ QuestionDisplay: Error de red al guardar jugada de tiempo agotado:', error);
      
      // Fallback: actualizar store local
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
      prizeName: "", // SIN premios para timeout
    });

    setTimeout(() => {
      setGameState("prize");
    }, 3000);
  }, [
    isAnswered,
    question.id,
    question.explanation,
    question.options,
    currentParticipant,
    gameSession,
    updateCurrentParticipantScore,
    setGameState,
    setPrizeFeedback,
  ]);

  const handleAnswer = useCallback(
    async (option: AnswerOption) => {
      if (isAnswered || hasTimeUpExecutedRef.current) return;
      hasTimeUpExecutedRef.current = true;
      setSelectedAnswer(option);
      setIsAnswered(true);
      
      const correctAnswer = option.correct;
      const correctOption = question.options.find((o) => o.correct);
      
      // Mostrar confetti inmediatamente para respuestas correctas
      if (correctAnswer) setShowConfetti(true);

      try {
        // Guardar la jugada en el backend con la lógica de premios únicos
        if (currentParticipant) {
          console.log('🎮 QuestionDisplay: Enviando jugada al servidor...');
          
          const playData = {
            participant_id: currentParticipant.id,
            session_id: currentParticipant.session_id,
            question_id: question.id,
            answered_correctly: correctAnswer,
            prize_name: correctAnswer ? question.prize : undefined,
            // [modificación] Usar admin_id real de la sesión o null
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
            console.log('✅ QuestionDisplay: Jugada guardada exitosamente');
            console.log('🏆 Resultado:', result.result);

            // Actualizar el feedback con la información del servidor
            setPrizeFeedback({
              answeredCorrectly: correctAnswer,
              explanation: !correctAnswer ? question.explanation || "" : "",
              correctOption: correctOption?.text || "",
              prizeName: result.result.prize_awarded || "", // Usar el premio otorgado por el servidor
            });

            // Actualizar el store local (mantener compatibilidad)
            updateCurrentParticipantScore({
              questionId: question.id,
              answeredCorrectly: correctAnswer,
              prizeWon: result.result.prize_awarded,
            });

            // Si ya había ganado un premio, mostrar mensaje especial en el log
            if (result.result.already_won_prize && correctAnswer) {
              console.log('🎉 El participante ya había ganado un premio, pero puede seguir jugando');
            }
          } else {
            console.error('❌ QuestionDisplay: Error guardando jugada:', result.message);
            
            // Fallback: usar lógica local si falla el servidor
            setPrizeFeedback({
              answeredCorrectly: correctAnswer,
              explanation: !correctAnswer ? question.explanation || "" : "",
              correctOption: correctOption?.text || "",
              prizeName: correctAnswer ? question.prize || "" : "",
            });

            updateCurrentParticipantScore({
              questionId: question.id,
              answeredCorrectly: correctAnswer,
              prizeWon: correctAnswer ? question.prize : undefined,
            });
          }
        } else {
          // Sin participante: usar lógica local SIN premios
          console.warn('⚠️ QuestionDisplay: No hay participante actual, usando lógica local');
          setPrizeFeedback({
            answeredCorrectly: correctAnswer,
            explanation: !correctAnswer ? question.explanation || "" : "",
            correctOption: correctOption?.text || "",
            prizeName: "", // SIN premios en modo TV local
          });
        }
      } catch (error) {
        console.error('❌ QuestionDisplay: Error de red al guardar jugada:', error);
        
        // Fallback: usar lógica local SIN premios si hay error de red
        setPrizeFeedback({
          answeredCorrectly: correctAnswer,
          explanation: !correctAnswer ? question.explanation || "" : "",
          correctOption: correctOption?.text || "",
          prizeName: "", // SIN premios en modo fallback
        });

        if (currentParticipant) {
          updateCurrentParticipantScore({
            questionId: question.id,
            answeredCorrectly: correctAnswer,
            prizeWon: correctAnswer ? question.prize : undefined,
          });
        }
      }

      // Cambiar al estado de premio después de 3 segundos
      setTimeout(() => {
        setGameState("prize");
      }, 3000);
    },
    [
      isAnswered,
      question.id,
      question.prize,
      question.explanation,
      question.options,
      currentParticipant,
      gameSession,
      updateCurrentParticipantScore,
      setGameState,
      setPrizeFeedback,
      setShowConfetti,
    ]
  );

  // [modificación] Función para obtener clases de estilo por opción - FORZANDO ESTILOS INLINE
  const getOptionClasses = useCallback(
    (option: AnswerOption) => {
      const baseClasses =
        "group relative w-full text-left transition-all duration-500 transform overflow-hidden";

      // [modificación] Estados visuales según respuesta
      let stateClasses = "";
      if (!isAnswered) {
        stateClasses =
          "bg-gradient-to-r from-blue-600/90 to-purple-600/90 border-blue-300/80 text-white hover:from-blue-500/95 hover:to-purple-500/95 hover:border-blue-200";
      } else if (selectedAnswer === option) {
        if (option.correct) {
          stateClasses =
            "bg-gradient-to-r from-green-500 to-emerald-500 border-green-300 text-white ring-8 ring-green-300/60";
        } else {
          stateClasses =
            "bg-gradient-to-r from-red-500 to-rose-500 border-red-300 text-white ring-8 ring-red-300/60";
        }
      } else if (option.correct) {
        stateClasses =
          "bg-gradient-to-r from-green-400/90 to-emerald-400/90 border-green-200 text-white ring-6 ring-green-200/50";
      } else {
        stateClasses = "bg-gray-700/80 border-gray-400/50 text-gray-200";
      }

      return `${baseClasses} ${stateClasses}`;
    },
    [isAnswered, selectedAnswer]
  );

  // [modificación] Función para obtener estilos inline según dispositivo
  const getOptionStyles = useCallback(() => {
    if (isTV65) {
      // [modificación] NUEVO: Usar clamp para fuente adaptativa con mínimo garantizado
      return {
        padding: "32px 56px", // [modificación] Padding aumentado para acomodar fuente más grande
        minHeight: "120px", // [modificación] Altura mínima aumentada
        maxHeight: "260px", // [modificación] Altura máxima aumentada para más espacio
        borderRadius: "24px",
        borderWidth: "8px",
        fontWeight: "900",
        lineHeight: "1.1", // [modificación] Line-height optimizado
        textShadow:
          "0 4px 8px rgba(0, 0, 0, 0.9), 0 8px 16px rgba(0, 0, 0, 0.7)",
        boxShadow:
          "0 25px 50px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        overflow: "hidden", // [modificación] Evitar desborde del botón
        wordBreak: "break-word" as const, // [modificación] ARREGLADO: Tipo específico para TypeScript
        overflowWrap: "break-word" as const, // [modificación] ARREGLADO: Tipo específico para TypeScript
        hyphens: "auto" as const, // [modificación] ARREGLADO: Tipo específico para TypeScript
      };
    } else if (isTablet800) {
      // [NUEVO] Estilos específicos para tablet 800x1340
      return {
        fontSize: textMetrics.isLong ? "1.2rem" : "1.4rem",
        padding: "20px 24px",
        minHeight: "80px",
        maxHeight: "120px",
        borderRadius: "12px",
        borderWidth: "3px",
        fontWeight: "700",
        lineHeight: "1.3",
        textShadow: "0 2px 4px rgba(0, 0, 0, 0.7)",
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2), inset 0 0 10px rgba(255, 255, 255, 0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        overflow: "hidden",
        wordBreak: "break-word" as const,
        overflowWrap: "break-word" as const,
        hyphens: "auto" as const,
      };
    } else if (isTVTouch) {
      return {
        fontSize: textMetrics.isLong ? "44px" : "52px",
        padding: "36px 44px",
        minHeight: "160px",
        borderRadius: "16px",
        borderWidth: "4px",
        fontWeight: "700",
        lineHeight: "1.3",
      };
    } else {
      return {
        fontSize: textMetrics.isLong ? "36px" : "40px",
        padding: "28px 36px",
        minHeight: "110px",
        borderRadius: "12px",
        borderWidth: "2px",
        fontWeight: "600",
        lineHeight: "1.4",
      };
    }
  }, [isTV65, isTablet800, isTVTouch, textMetrics]); // [NUEVO] Agregar isTablet800 a dependencias

  // [modificación] Animaciones escalonadas
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

  // [modificación] Layout principal con DEBUG VISUAL - OPTIMIZADO PARA TODOS LOS DISPOSITIVOS
  return (
    <div className={`min-h-screen bg-main-gradient relative overflow-hidden ${
      isTablet800 ? 'question-layout-tablet-800' : ''
    }`}>
      {/* [modificación] DEBUG INFO VISUAL - SOLO EN DESARROLLO */}
      {process.env.NODE_ENV === "development" && debugInfo.width > 0 && (
        <div className="fixed top-0 left-0 bg-black/80 text-white p-4 text-lg font-bold z-50 rounded-br-lg">
          <div>
            Resolución: {debugInfo.width}x{debugInfo.height}
          </div>
          <div>
            TV65: {isTV65 ? "SÍ" : "NO"} | TVTouch: {isTVTouch ? "SÍ" : "NO"}
          </div>
          <div>Tablet: {isTablet ? "SÍ" : "NO"}</div>
          <div>Tablet 800x1340: {isTablet800 ? "SÍ" : "NO"}</div>
        </div>
      )}

      {/* [modificación] Partículas de fondo decorativas */}
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
        className={`relative z-10 min-h-screen flex flex-col ${
          isTablet800 ? 'question-layout-tablet-800' : ''
        }`}>
        {/* [modificación] Header con logo - OPTIMIZADO PARA TODOS LOS DISPOSITIVOS */}
        <header className={`w-full flex justify-center items-center ${
          isTablet800 ? 'question-header-tablet-800' : 'pt-24 pb-6'
        }`}>
          <div className={`w-full flex justify-center items-center ${
            isTablet800 ? 'max-w-4xl' : 'max-w-5xl'
          }`}>
            <Logo
              size="lg"
              animated={true}
              withShadow={true}
              className={`w-full h-auto ${isTablet800 ? 'logo-tablet-800' : ''}`} // [NUEVO] Clase específica para tablet 800
            />
          </div>
        </header>

        {/* [modificación] Contenido principal OPTIMIZADO PARA TODOS LOS DISPOSITIVOS */}
        <main
          className={`flex-1 flex flex-col justify-center items-center ${
            isTablet800 ? 'question-main-tablet-800' : ''
          }`}
          style={{
            padding: isTV65 ? "0px 64px 32px 64px" : isTablet800 ? "0px 16px" : "12px 32px", // [NUEVO] Padding optimizado para tablet 800
          }}
        >
          <div
            className="w-full"
            style={{
              maxWidth: isTV65 ? "1800px" : isTablet800 ? "700px" : isTVTouch ? "1200px" : "1000px", // [NUEVO] Ancho máximo para tablet 800
            }}
          >
            <motion.div
              variants={itemVariants}
              className={`flex justify-center ${
                isTV65 ? "timer-container-tv65" : isTablet800 ? "timer-tablet-800" : ""
              }`}
              style={{
                marginBottom: isTV65 ? "6px" : isTablet800 ? "0px" : "12px", 
                marginTop: isTV65 ? "-320px" : isTablet800 ? "0px" : isTVTouch ? "-150px" : "-120px",
                width: isTablet800 ? "100%" : "auto", // Asegurar ancho completo para centrado en tablet 800
                display: isTablet800 ? "flex" : "block", 
                alignItems: isTablet800 ? "center" : "initial",
                justifyContent: isTablet800 ? "center" : "initial"
              }}
            >
              <Timer
                key={`timer-${question.id}-${
                  currentParticipant?.id || "anonymous"
                }`}
                initialSeconds={timerSeconds}
                onTimeUp={handleTimeUp}
                isTV65={isTV65}
                isTVTouch={isTVTouch}
                isTablet800={isTablet800}
              />
            </motion.div>

            {/* [modificación] Contenedor de pregunta OPTIMIZADO PARA TODOS LOS DISPOSITIVOS */}
            <motion.div
              variants={itemVariants}
              className={`relative ${
                isTablet800 
                  ? 'question-container-tablet-800' 
                  : 'bg-black/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl mb-8'
              }`}
              style={!isTablet800 ? {
                padding: isTV65 ? "44px 54px" : "32px 48px",
                marginBottom: isTV65 ? "28px" : "32px",
                boxShadow: isTV65
                  ? "0 25px 50px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)"
                  : "0 20px 40px rgba(0, 0, 0, 0.3)",
              } : {}}
            >
              <h2
                className={`font-marineBold text-white text-center leading-tight ${
                  isTablet800 ? '' : ''
                }`}
                style={!isTablet800 ? {
                  fontSize: isTV65 ? "96px" : isTVTouch ? "56px" : "36px",
                  marginBottom: isTV65 ? "32px" : "16px",
                  textShadow: "0 6px 12px rgba(0, 0, 0, 0.9), 0 12px 24px rgba(0, 0, 0, 0.7)",
                  fontWeight: "900",
                } : {}}
              >
                {question.text}
              </h2>
            </motion.div>

            {/* [modificación] Grid de opciones OPTIMIZADO PARA TODOS LOS DISPOSITIVOS */}
            <motion.div
              variants={itemVariants}
              className={`${
                isTablet800 
                  ? 'options-grid-tablet-800' 
                  : 'grid grid-cols-1'
              }`}
              style={!isTablet800 ? {
                gap: isTV65 ? "24px" : "16px",
              } : {}}
            >
              {question.options.map((option, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: isAnswered ? 1 : isTV65 ? 1.01 : isTablet800 ? 1.02 : 1.02 }} // [NUEVO] Escala para tablet 800
                  whileTap={{ scale: isAnswered ? 1 : isTV65 ? 0.995 : isTablet800 ? 0.98 : 0.98 }} // [NUEVO] Escala para tablet 800
                >
                  <Button
                    variant="custom"
                    onClick={() => handleAnswer(option)}
                    className={`${getOptionClasses(option)} ${
                      isTablet800 
                        ? 'answer-option-tablet-800' 
                        : isTV65 
                        ? 'tv-65-layout' 
                        : ''
                    } btn-option`}
                    style={!isTablet800 ? getOptionStyles() : {}}
                    disabled={isAnswered}
                  >
                    {/* [modificación] Layout específico para cada dispositivo */}
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
                          }}
                        >
                          {String.fromCharCode(65 + index)}
                        </div>
                      </>
                    ) : isTablet800 ? (
                      // [NUEVO] Layout simplificado para tablet 800x1340 - usa clases CSS
                      <>
                        <span className="flex-1 leading-tight break-words">
                          {option.text}
                        </span>
                        <div className="option-icon">
                          {String.fromCharCode(65 + index)}
                        </div>
                      </>
                    ) : (
                      // Layout original para otros dispositivos
                      <div className="flex items-center justify-between w-full h-full">
                        <span className={`flex-1 leading-tight break-words`}>
                          {option.text}
                        </span>
                        <div
                          className="ml-4 rounded-full flex items-center justify-center font-black bg-white/30 text-white"
                          style={{
                            width: isTVTouch ? "56px" : "48px",
                            height: isTVTouch ? "56px" : "48px",
                            fontSize: isTVTouch ? "28px" : "24px",
                            marginLeft: isTVTouch ? "20px" : "16px",
                          }}
                        >
                          {String.fromCharCode(65 + index)}
                        </div>
                      </div>
                    )}
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </main>

        {/* [modificación] Footer OPTIMIZADO PARA TODOS LOS DISPOSITIVOS */}
        <footer
          className={`text-center ${
            isTablet800 ? 'question-footer-tablet-800' : ''
          }`}
          style={!isTablet800 ? {
            padding: isTV65 ? "24px" : "16px",
            minHeight: isTV65 ? "5vh" : "auto",
          } : {}}
        >
          <div
            className={`text-white/60 ${
              isTablet800 ? '' : ''
            }`}
            style={!isTablet800 ? {
              fontSize: isTV65 ? "24px" : "16px",
            } : {}}
          >
            {currentParticipant?.nombre &&
              `Participante: ${currentParticipant.nombre}`}
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
