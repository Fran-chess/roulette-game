// src/components/game/QuestionDisplay.tsx
'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { Question, AnswerOption } from '@/types';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';

interface TimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
}

function Timer({ initialSeconds, onTimeUp, isTV65, isTVTouch }: TimerProps & { isTV65: boolean; isTVTouch: boolean }) {
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

  // [modificación] Cronómetro circular responsivo - ULTRA GRANDE para TV65
  // [modificación] Tamaños escalados según dispositivo
  const timerSize = isTV65 ? 500 : isTVTouch ? 300 : 200;
  const radius = isTV65 ? 200 : isTVTouch ? 120 : 80;
  const strokeWidth = isTV65 ? 30 : isTVTouch ? 20 : 15;
  
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (seconds / initialSeconds) * circumference;

  // [modificación] Debug info para verificar detección - SOLO CUANDO CAMBIA
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
// //       console.log('⏱️ Timer configurado:', { isTV65, isTVTouch, timerSize });
    }
  }, [isTV65, isTVTouch, timerSize]); // [modificación] Solo cuando cambian estos valores

  return (
    <motion.div 
      className={`flex flex-col items-center justify-center ${isTV65 ? 'mb-20' : 'mb-12'}`}
      animate={isUrgent ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
    >
      {/* [modificación] Debug visual - SOLO EN DESARROLLO */}
      {process.env.NODE_ENV === 'development' && isTV65 && (
        <div className="bg-red-500 text-white p-4 mb-4 text-2xl font-bold rounded">
          DEBUG: TV65 DETECTADA - Timer: {timerSize}px
        </div>
      )}
      
      {/* [modificación] Cronómetro circular ultra grande para TV */}
      <div className="relative" style={{ width: timerSize + 40, height: timerSize + 40 }}>
        <svg 
          width={timerSize} 
          height={timerSize} 
          className="transform -rotate-90 absolute top-5 left-5"
          style={{ filter: 'drop-shadow(0 15px 40px rgba(0, 0, 0, 0.6))' }}
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
                ? 'drop-shadow(0 0 40px #ef4444) drop-shadow(0 0 80px #ef4444)' 
                : 'drop-shadow(0 0 30px #10b981) drop-shadow(0 0 60px #10b981)'
            }}
          />
        </svg>
        
        {/* [modificación] Texto del cronómetro ultra grande */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ width: timerSize, height: timerSize, top: 20, left: 20 }}
        >
          <div className={`text-center ${isUrgent ? 'text-red-400' : 'text-white'}`}>
            <div 
              className="font-black leading-none"
              style={{ 
                fontSize: isTV65 ? '120px' : isTVTouch ? '72px' : '48px',
                textShadow: '0 6px 12px rgba(0, 0, 0, 0.9), 0 12px 24px rgba(0, 0, 0, 0.7)' 
              }}
            >
              {seconds}
            </div>
            <div 
              className="font-bold opacity-90 mt-2"
              style={{ 
                fontSize: isTV65 ? '36px' : isTVTouch ? '24px' : '16px',
                textShadow: '0 3px 6px rgba(0, 0, 0, 0.9)' 
              }}
            >
              segundos
            </div>
          </div>
        </div>
      </div>

      {/* [modificación] Indicador de urgencia ultra visible - mejorado para 5 segundos */}
      {isUrgent && (
        <motion.div 
          className="mt-6 text-red-400 font-black text-center"
          style={{ 
            fontSize: isTV65 ? '60px' : isTVTouch ? '36px' : '24px',
            textShadow: '0 6px 12px rgba(0, 0, 0, 0.9), 0 0 30px #ef4444' 
          }}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }} // [modificación] Más rápido para mayor urgencia
        >
          {seconds <= 3 ? '¡ÚLTIMOS SEGUNDOS!' : '¡TIEMPO AGOTÁNDOSE!'}
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
  const [debugInfo, setDebugInfo] = useState({ width: 0, height: 0 });

  const setGameState = useGameStore((state) => state.setGameState);
  const currentParticipant = useGameStore((state) => state.currentParticipant);
  const updateCurrentParticipantScore = useGameStore((state) => state.updateCurrentParticipantScore);
  const setPrizeFeedback = useGameStore((state) => state.setPrizeFeedback);
  const setShowConfetti = useGameStore((state) => state.setShowConfetti);

  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const hasTimeUpExecutedRef = useRef(false);

  // [modificación] Tiempos ajustados - 20 segundos para TV65 según solicitud del usuario
  const timerSeconds = useMemo(() => {
    return isTV65 ? 20 : isTVTouch ? 40 : isTablet ? 30 : 25;
  }, [isTV65, isTVTouch, isTablet]);

  // [modificación] Sistema de ajuste automático basado en longitud de texto
  const textMetrics = useMemo(() => {
    const maxLength = Math.max(...question.options.map(opt => opt.text.length));
    const avgLength = question.options.reduce((acc, opt) => acc + opt.text.length, 0) / question.options.length;
    
    return {
      maxLength,
      avgLength,
      isVeryLong: maxLength > 100,
      isLong: maxLength > 60,
      isMedium: maxLength > 30,
      needsCompact: avgLength > 50
    };
  }, [question.options]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // [modificación] Detección corregida para TV65 2160x3840 (portrait y landscape)
      const isTV65Resolution = (width === 2160 && height === 3840) || (width === 3840 && height === 2160);
      const isTVTouchResolution = (width >= 1025 && width < 2160) && !isTV65Resolution;
      const isTabletResolution = (width >= 601 && width <= 1024) && !isTV65Resolution;
      
      // [modificación] Solo actualizar estado si realmente cambió - CONDICIÓN MEJORADA
      if (isTV65 !== isTV65Resolution) setIsTV65(isTV65Resolution);
      if (isTVTouch !== isTVTouchResolution) setIsTVTouch(isTVTouchResolution);
      if (isTablet !== isTabletResolution) setIsTablet(isTabletResolution);
      
      // [modificación] Debug SIMPLIFICADO y con throttle mejorado
      if (process.env.NODE_ENV === 'development') {
        const hasSignificantChange = Math.abs(debugInfo.width - width) > 100 || Math.abs(debugInfo.height - height) > 100;
        if (hasSignificantChange || debugInfo.width === 0) {
// //           console.log('🖥️ Dispositivo actualizado:', { 
// //             width, 
// //             height, 
// //             isTV65Resolution, 
// //             ratio: (width/height).toFixed(2)
// //           });
          setDebugInfo({ width, height });
        }
      }
    };
    
    // [modificación] Ejecutar una vez al inicio
    handleResize();
    
    // [modificación] Throttle mejorado para evitar loops
    let timeoutId: NodeJS.Timeout | null = null;
    const throttledResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 500); // [modificación] Throttle aumentado a 500ms
    };
    
    window.addEventListener("resize", throttledResize);
    return () => {
      window.removeEventListener("resize", throttledResize);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []); // [modificación] DEPENDENCIAS VACÍAS para evitar loop infinito

  useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    hasTimeUpExecutedRef.current = false;
  }, [question.id]);

  const handleTimeUp = useCallback(() => {
    if (isAnswered || hasTimeUpExecutedRef.current) return;
    hasTimeUpExecutedRef.current = true;
    setIsAnswered(true);
    const correctOption = question.options.find((o) => o.correct);
    setPrizeFeedback({
      answeredCorrectly: false,
      explanation: question.explanation || "",
      correctOption: correctOption?.text || "",
      prizeName: "",
    });
    if (currentParticipant) {
      updateCurrentParticipantScore({
        questionId: question.id,
        answeredCorrectly: false,
        prizeWon: undefined,
      });
    }
    setTimeout(() => {
      setGameState("prize");
    }, 3000);
  }, [
    isAnswered,
    question.id,
    question.explanation,
    question.options,
    currentParticipant,
    updateCurrentParticipantScore,
    setGameState,
    setPrizeFeedback,
  ]);

  const handleAnswer = useCallback(
    (option: AnswerOption) => {
      if (isAnswered || hasTimeUpExecutedRef.current) return;
      hasTimeUpExecutedRef.current = true;
      setSelectedAnswer(option);
      setIsAnswered(true);
      const correctAnswer = option.correct;
      const prizeWon = correctAnswer ? question.prize : undefined;
      if (correctAnswer) setShowConfetti(true);
      const correctOption = question.options.find((o) => o.correct);
      setPrizeFeedback({
        answeredCorrectly: correctAnswer,
        explanation: !correctAnswer ? question.explanation || "" : "",
        correctOption: correctOption?.text || "",
        prizeName: prizeWon || "",
      });
      if (currentParticipant) {
        updateCurrentParticipantScore({
          questionId: question.id,
          answeredCorrectly: correctAnswer,
          prizeWon: prizeWon,
        });
      }
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
      updateCurrentParticipantScore,
      setGameState,
      setPrizeFeedback,
      setShowConfetti,
    ]
  );

  // [modificación] Función para obtener clases de estilo por opción - FORZANDO ESTILOS INLINE
  const getOptionClasses = useCallback((option: AnswerOption) => {
    const baseClasses = "group relative w-full text-left transition-all duration-500 transform overflow-hidden";
    
    // [modificación] Estados visuales según respuesta
    let stateClasses = "";
    if (!isAnswered) {
      stateClasses = "bg-gradient-to-r from-blue-600/90 to-purple-600/90 border-blue-300/80 text-white hover:from-blue-500/95 hover:to-purple-500/95 hover:border-blue-200";
    } else if (selectedAnswer === option) {
      if (option.correct) {
        stateClasses = "bg-gradient-to-r from-green-500 to-emerald-500 border-green-300 text-white ring-8 ring-green-300/60";
      } else {
        stateClasses = "bg-gradient-to-r from-red-500 to-rose-500 border-red-300 text-white ring-8 ring-red-300/60";
      }
    } else if (option.correct) {
      stateClasses = "bg-gradient-to-r from-green-400/90 to-emerald-400/90 border-green-200 text-white ring-6 ring-green-200/50";
    } else {
      stateClasses = "bg-gray-700/80 border-gray-400/50 text-gray-200";
    }

    return `${baseClasses} ${stateClasses}`;
  }, [isAnswered, selectedAnswer]);

  // [modificación] Función para obtener estilos inline según dispositivo
  const getOptionStyles = useCallback(() => {
    if (isTV65) {
      const fontSize = textMetrics.isVeryLong ? '48px' : textMetrics.isLong ? '56px' : '68px';
      return {
        fontSize,
        padding: '32px 48px',
        minHeight: textMetrics.isVeryLong ? '180px' : textMetrics.isLong ? '160px' : '140px',
        borderRadius: '24px',
        borderWidth: '8px',
        fontWeight: '900',
        lineHeight: '1.2',
        textShadow: '0 4px 8px rgba(0, 0, 0, 0.9), 0 8px 16px rgba(0, 0, 0, 0.7)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)'
      };
    } else if (isTVTouch) {
      return {
        fontSize: textMetrics.isLong ? '28px' : '36px',
        padding: '24px 32px',
        minHeight: '120px',
        borderRadius: '16px',
        borderWidth: '4px',
        fontWeight: '700',
        lineHeight: '1.3'
      };
    } else {
      return {
        fontSize: textMetrics.isLong ? '20px' : '24px',
        padding: '16px 24px',
        minHeight: '80px',
        borderRadius: '12px',
        borderWidth: '2px',
        fontWeight: '600',
        lineHeight: '1.4'
      };
    }
  }, [isTV65, isTVTouch, textMetrics]);

  // [modificación] Animaciones escalonadas
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  // [modificación] Layout principal con DEBUG VISUAL - OPTIMIZADO PARA TV65
  return (
    <div className="min-h-screen bg-main-gradient relative overflow-hidden">
      {/* [modificación] DEBUG INFO VISUAL - SOLO EN DESARROLLO */}
      {process.env.NODE_ENV === 'development' && debugInfo.width > 0 && (
        <div className="fixed top-0 left-0 bg-black/80 text-white p-4 text-lg font-bold z-50 rounded-br-lg">
          <div>Resolución: {debugInfo.width}x{debugInfo.height}</div>
          <div>TV65: {isTV65 ? 'SÍ' : 'NO'} | TVTouch: {isTVTouch ? 'SÍ' : 'NO'}</div>
          <div>Tablet: {isTablet ? 'SÍ' : 'NO'}</div>
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
        className="relative z-10 min-h-screen flex flex-col"
      >
        {/* [modificación] Header con logo restaurado a tamaño completo */}
        <header 
          className="flex justify-center items-center relative"
          style={{
            padding: isTV65 ? '48px 64px' : isTVTouch ? '32px 48px' : '24px 32px', // [modificación] Padding completo restaurado
            minHeight: isTV65 ? '15vh' : isTVTouch ? '12vh' : 'auto', // [modificación] RESTAURADO a 15vh para dar espacio al logo
            background: isTV65 ? 'rgba(0, 0, 0, 0.1)' : 'transparent', // [modificación] Fondo sutil para TV65
            borderBottom: isTV65 ? '2px solid rgba(255, 255, 255, 0.1)' : 'none'
          }}
        >
          {/* [modificación] Debug específico para logo en TV65 - SOLO EN DESARROLLO */}
          {process.env.NODE_ENV === 'development' && isTV65 && (
            <div className="absolute top-2 left-2 bg-green-500 text-white px-4 py-2 text-xl font-bold rounded z-20">
              📺 TV65 ACTIVA - Logo: {isTV65 ? 'LG' : 'MD'}
            </div>
          )}
          
          {/* [modificación] Logo con tamaño completo restaurado */}
          <div 
            className="relative z-10"
            style={{
              transform: isTV65 ? 'scale(1.2)' : 'scale(1)', // [modificación] Escala mantenida
              filter: isTV65 
                ? 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3)) contrast(120%) brightness(110%)' 
                : 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2))',
              transition: 'all 0.3s ease'
            }}
          >
            <Logo 
              size={isTV65 ? "lg" : isTVTouch ? "lg" : "md"} 
              animated={true} 
              withShadow={true}
              className={isTV65 ? "logo-tv65-enhanced" : ""} 
            />
          </div>
          
          {/* [modificación] Indicador visual adicional para TV65 */}
          {isTV65 && (
            <div 
              className="absolute bottom-2 right-2 text-white/50 text-sm"
              style={{ fontSize: '20px' }}
            >
              TV65 Mode Active
            </div>
          )}
        </header>

        {/* [modificación] Contenido principal SIN padding superior para acercar cronómetro */}
        <main 
          className="flex-1 flex flex-col justify-center items-center"
          style={{
            padding: isTV65 ? '0px 64px 32px 64px' : '24px 32px' // [modificación] Sin padding superior en TV65
          }}
        >
          <div 
            className="w-full"
            style={{
              maxWidth: isTV65 ? '1800px' : isTVTouch ? '1200px' : '1000px'
            }}
          >
            
            {/* [modificación] Cronómetro MUY cerca del header con margen negativo agresivo */}
            <motion.div 
              variants={itemVariants} 
              className={`flex justify-center ${isTV65 ? 'timer-container-tv65' : ''}`}
              style={{
                marginBottom: isTV65 ? '32px' : '32px', // [modificación] Margen inferior normal
                marginTop: isTV65 ? '-80px' : '0px' // [modificación] Margen negativo MUY GRANDE para TV65
              }}
            >
              <Timer
                key={`timer-${question.id}-${currentParticipant?.id || 'anonymous'}`}
                initialSeconds={timerSeconds}
                onTimeUp={handleTimeUp}
                isTV65={isTV65}
                isTVTouch={isTVTouch}
              />
            </motion.div>

            {/* [modificación] Contenedor de pregunta decorativo optimizado para TV65 */}
            <motion.div
              variants={itemVariants}
              className="relative bg-black/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl mb-8"
              style={{
                padding: isTV65 ? '48px 64px' : '32px 48px',
                marginBottom: isTV65 ? '48px' : '32px',
                boxShadow: isTV65 
                  ? '0 25px 50px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)' 
                  : '0 20px 40px rgba(0, 0, 0, 0.3)'
              }}
            >
              <h2 
                className="font-marineBold text-white text-center leading-tight"
                style={{
                  fontSize: isTV65 ? '96px' : isTVTouch ? '56px' : '36px',
                  marginBottom: isTV65 ? '32px' : '16px',
                  textShadow: '0 6px 12px rgba(0, 0, 0, 0.9), 0 12px 24px rgba(0, 0, 0, 0.7)',
                  fontWeight: '900'
                }}
              >
                {question.text}
              </h2>
            </motion.div>

            {/* [modificación] Grid de opciones responsivo optimizado para TV65 */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1"
              style={{
                gap: isTV65 ? '32px' : '16px'
              }}
            >
              {question.options.map((option, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: isAnswered ? 1 : (isTV65 ? 1.01 : 1.02) }}
                  whileTap={{ scale: isAnswered ? 1 : (isTV65 ? 0.995 : 0.98) }}
                >
                  <Button
                    variant="custom"
                    onClick={() => handleAnswer(option)}
                    className={getOptionClasses(option)}
                    style={getOptionStyles()}
                    disabled={isAnswered}
                  >
                    <div className="flex items-center justify-between w-full h-full">
                      <span className="flex-1 leading-tight break-words">
                        {option.text}
                      </span>
                      {/* [modificación] Indicador de opción optimizado para TV65 */}
                      <div 
                        className="ml-4 rounded-full flex items-center justify-center font-black bg-white/30 text-white"
                        style={{
                          width: isTV65 ? '80px' : '48px',
                          height: isTV65 ? '80px' : '48px',
                          fontSize: isTV65 ? '36px' : '24px',
                          marginLeft: isTV65 ? '32px' : '16px'
                        }}
                      >
                        {String.fromCharCode(65 + index)}
                      </div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </main>

        {/* [modificación] Footer minimalista optimizado para TV65 */}
        <footer 
          className="text-center"
          style={{
            padding: isTV65 ? '24px' : '16px',
            minHeight: isTV65 ? '5vh' : 'auto'
          }}
        >
          <div 
            className="text-white/60"
            style={{
              fontSize: isTV65 ? '24px' : '16px'
            }}
          >
            {currentParticipant?.nombre && `Participante: ${currentParticipant.nombre}`}
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
