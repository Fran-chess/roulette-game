'use client';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { Question, AnswerOption } from '@/types';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';

interface TimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
}

function Timer({ initialSeconds, onTimeUp }: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const isWarning = seconds <= 5;
  
  const onTimeUpRef = useRef(onTimeUp);
  const hasTimeUpExecutedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    setSeconds(initialSeconds);
    hasTimeUpExecutedRef.current = false;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    console.log(`⏱️ Timer: Iniciado con ${initialSeconds} segundos`);
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds === 0 && !hasTimeUpExecutedRef.current) {
      hasTimeUpExecutedRef.current = true;
      console.log(`⏱️ Timer: ¡Tiempo agotado! Ejecutando onTimeUp...`);
      setTimeout(() => {
        onTimeUpRef.current();
      }, 0);
    }
  }, [seconds]);

  useEffect(() => {
    if (seconds <= 0) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setSeconds((prevSeconds) => {
        const newSeconds = prevSeconds - 1;
        
        if (newSeconds > 0 && newSeconds <= 3) {
          console.log(`⏱️ Timer: ${newSeconds} segundos restantes`);
        }
        
        return Math.max(0, newSeconds);
      });
    }, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [initialSeconds, seconds]);

  const timerContainerClasses = `
    border-2 ${isWarning ? 'border-red-500' : 'border-white/40'}
    rounded-full w-16 h-16 flex items-center justify-center
    bg-black/5 backdrop-blur-sm shadow-lg
    transition-colors duration-300
  `;

  const timerNumberClasses = `
    font-marineBlack text-2xl
    ${isWarning ? 'text-red-500' : 'text-white'}
    transition-colors duration-300
    ${isWarning ? 'animate-[heartbeat_1s_ease-in-out_infinite]' : ''}
  `;

  return (
    <div className="flex justify-center items-center mb-5">
      <div className={timerContainerClasses}>
        <span className={timerNumberClasses}>{seconds}</span>
      </div>
      <style jsx>{`
        @keyframes heartbeat {
          0% { transform: scale(1); }
          25% { transform: scale(1.3); }
          40% { transform: scale(1); }
          60% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        .animate-\\[heartbeat_1s_ease-in-out_infinite\\] {
          animation: heartbeat 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

interface QuestionDisplayProps {
  question: Question;
}

export default function QuestionDisplay({ question }: QuestionDisplayProps) {
  const [isTablet, setIsTablet] = useState(false);
  const [isTVTouch, setIsTVTouch] = useState(false);
  
  const setGameState = useGameStore((state) => state.setGameState);
  const currentParticipant = useGameStore((state) => state.currentParticipant);
  const updateCurrentParticipantScore = useGameStore(
    (state) => state.updateCurrentParticipantScore
  );
  const setPrizeFeedback = useGameStore((state) => state.setPrizeFeedback);
  const setShowConfetti = useGameStore((state) => state.setShowConfetti);

  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  
  const hasTimeUpExecutedRef = useRef(false);

  const timerSeconds = useMemo(() => {
    return isTVTouch ? 20 : isTablet ? 18 : 15;
  }, [isTVTouch, isTablet]);

  const questionContainerClasses = useMemo(() => {
    const baseClasses = "bg-black/10 backdrop-blur-sm rounded-xl mb-6 w-full border border-white/30 shadow-lg";
    
    if (isTVTouch) {
      return `${baseClasses} p-8 touch-spacing-lg touch-shadow`;
    } else if (isTablet) {
      return `${baseClasses} p-6 touch-spacing-md touch-shadow`;
    }
    return `${baseClasses} p-5`;
  }, [isTVTouch, isTablet]);

  const questionTextClasses = useMemo(() => {
    const baseClasses = "font-marineBold text-white text-center leading-tight";
    
    if (isTVTouch) {
      return `${baseClasses} text-touch-3xl high-contrast-text`;
    } else if (isTablet) {
      return `${baseClasses} text-touch-2xl`;
    }
    return `${baseClasses} text-lg md:text-xl`;
  }, [isTVTouch, isTablet]);

  const optionsContainerClasses = useMemo(() => {
    if (isTVTouch) {
      return "w-full space-y-6";
    } else if (isTablet) {
      return "w-full space-y-4";
    }
    return "w-full space-y-3 md:space-y-4";
  }, [isTVTouch, isTablet]);

  const buttonBaseClasses = useMemo(() => {
    const baseClasses = "w-full text-left transition-all duration-200 break-words touch-target";
    
    if (isTVTouch) {
      return `${baseClasses} btn-touch text-touch-xl py-6 px-8 rounded-touch-xl touch-shadow touch-hover`;
    } else if (isTablet) {
      return `${baseClasses} btn-touch text-touch-lg py-4 px-6 rounded-touch-lg touch-shadow touch-hover`;
    }
    return `${baseClasses} py-3 px-4 rounded-lg`;
  }, [isTVTouch, isTablet]);

  const containerClasses = useMemo(() => {
    if (isTVTouch) {
      return "flex flex-col items-center w-full mx-auto p-0 tv-ultra-layout";
    } else if (isTablet) {
      return "flex flex-col items-center w-full mx-auto p-0 tablet-flex";
    }
    return "flex flex-col items-center w-full mx-auto p-0";
  }, [isTVTouch, isTablet]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      setIsTablet(width >= 601 && width <= 1024);
      setIsTVTouch(width >= 1025);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    hasTimeUpExecutedRef.current = false;
    console.log(`📝 QuestionDisplay: Nueva pregunta cargada: ${question.category} (ID: ${question.id})`);
  }, [question.id, question.category]);

  const handleTimeUp = useCallback(() => {
    if (isAnswered || hasTimeUpExecutedRef.current) {
      console.log(`⏱️ QuestionDisplay: handleTimeUp ya ejecutado, ignorando...`);
      return;
    }
    
    hasTimeUpExecutedRef.current = true;
    console.log(`⏱️ QuestionDisplay: Tiempo agotado para pregunta: ${question.category}`);
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

    console.log(`⏱️ QuestionDisplay: Cambiando estado a 'prize' por tiempo agotado...`);
    setTimeout(() => {
      setGameState("prize");
    }, 500);
  }, [
    isAnswered,
    question.id,
    question.category,
    question.explanation,
    question.options,
    currentParticipant,
    updateCurrentParticipantScore,
    setGameState,
    setPrizeFeedback,
  ]);

  const handleAnswer = useCallback(
    (option: AnswerOption) => {
      if (isAnswered || hasTimeUpExecutedRef.current) {
        console.log(`👆 QuestionDisplay: handleAnswer ya ejecutado, ignorando...`);
        return;
      }
      
      hasTimeUpExecutedRef.current = true;
      console.log(`👆 QuestionDisplay: Usuario seleccionó opción: ${option.text} (correcta: ${option.correct})`);
      setSelectedAnswer(option);
      setIsAnswered(true);

      const correctAnswer = option.correct;
      const prizeWon = correctAnswer ? question.prize : undefined;

      if (correctAnswer) {
        console.log(`🎉 QuestionDisplay: ¡Respuesta correcta! Premio: ${prizeWon || 'Ninguno'}`);
        setShowConfetti(true);
      } else {
        console.log(`❌ QuestionDisplay: Respuesta incorrecta`);
      }
      
      const correctOption = question.options.find(o => o.correct);

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

      console.log(`👆 QuestionDisplay: Cambiando estado a 'prize'...`);
      setTimeout(() => {
        setGameState('prize');
      }, 500);
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
      setShowConfetti
    ]
  );

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: isTVTouch ? 0.7 : isTablet ? 0.6 : 0.5,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: isTVTouch ? 0.1 : isTablet ? 0.08 : 0.06,
      },
    },
    exit: { opacity: 0, scale: 0.94, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: isTVTouch ? 20 : isTablet ? 16 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25, ease: "easeOut" },
    },
  };

  const cardBgOnDark = "bg-black/5 backdrop-blur-sm";
  const cardBorderOnDark = "border border-white/30";
  const cardHoverStyles = "hover:bg-black/10 hover:border-white/50";
  const cardFocusStyles = "focus:ring-2 focus:ring-celeste-medio focus:ring-opacity-60";

  const getButtonStateClasses = useCallback((option: AnswerOption) => {
    if (!isAnswered) {
      return `${cardBgOnDark} ${cardBorderOnDark} ${cardHoverStyles} ${cardFocusStyles} text-white font-marineBold`;
    }

    if (selectedAnswer === option) {
      if (option.correct) {
        return "bg-green-500/80 border-green-400 text-white font-marineBold shadow-lg";
      } else {
        return "bg-red-500/80 border-red-400 text-white font-marineBold shadow-lg";
      }
    }

    if (option.correct) {
      return "bg-green-500/60 border-green-400 text-white font-marineBold shadow-lg";
    }

    return "bg-black/20 border-white/20 text-white/60 font-marineBold";
  }, [isAnswered, selectedAnswer]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={containerClasses}
    >
      <Timer 
        key={`timer-${question.id}-${currentParticipant?.id || 'anonymous'}`}
        initialSeconds={timerSeconds} 
        onTimeUp={handleTimeUp} 
      />

      <div className={questionContainerClasses}>
        <h3 className={questionTextClasses}>
          {question.text}
        </h3>
      </div>

      <div className={optionsContainerClasses}>
        {question.options.map((option, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Button
              variant="custom"
              onClick={() => handleAnswer(option)}
              className={`${buttonBaseClasses} ${getButtonStateClasses(option)}`}
              disabled={isAnswered}
            >
              <span className="block">{option.text}</span>
            </Button>
          </motion.div>
        ))}
      </div>

      <div className={`mt-6 pt-4 border-t border-white/20 w-full ${isTVTouch ? 'mt-8 pt-6' : isTablet ? 'mt-6 pt-5' : ''}`}></div>
    </motion.div>
  );
}
