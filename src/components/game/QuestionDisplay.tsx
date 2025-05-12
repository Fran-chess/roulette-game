// src/components/game/QuestionDisplay.tsx
'use client';
import { useState, useCallback, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { Question, AnswerOption } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button'; // Tu componente Button personalizado

// [modificación] Componente Timer para el cronómetro
interface TimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
}

// [modificación] Componente de cronómetro actualizado
function Timer({ initialSeconds, onTimeUp }: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const isWarning = seconds <= 5; // [modificación] Estado para cambiar el color a rojo cuando quedan 5 segundos o menos

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prevSeconds) => {
        if (prevSeconds <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prevSeconds - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimeUp]);

  // [modificación] Clases para el contenedor del cronómetro con borde redondo
  const timerContainerClasses = `
    border-2 ${isWarning ? 'border-red-500' : 'border-white/40'}
    rounded-full w-16 h-16 flex items-center justify-center
    bg-black/20 shadow-lg
    transition-colors duration-300
  `;

  // [modificación] Clases para el número del cronómetro con efecto de latido mejorado
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
      
      {/* [modificación] Estilos personalizados para la animación de latido */}
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
  const setGameState = useGameStore((state) => state.setGameState);
  const currentParticipant = useGameStore((state) => state.currentParticipant);
  const updateCurrentParticipantScore = useGameStore(
    (state) => state.updateCurrentParticipantScore
  );

  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowFeedback(false);
  }, [question]);

  // [modificación] Manejador para cuando se acaba el tiempo
  const handleTimeUp = useCallback(() => {
    if (!isAnswered) {
      // Si no se ha respondido, tratamos como respuesta incorrecta
      if (currentParticipant) {
        updateCurrentParticipantScore({
          questionId: question.id,
          answeredCorrectly: false,
        });
      }
      
      setShowFeedback(true);
      setIsAnswered(true);
      
      setTimeout(() => {
        setGameState('prize');
      }, 1500);
    }
  }, [isAnswered, question, currentParticipant, updateCurrentParticipantScore, setGameState]);

  const handleAnswer = useCallback(
    (option: AnswerOption) => {
      if (isAnswered) return;
      setSelectedAnswer(option);
      setIsAnswered(true);
      setShowFeedback(true);

      const correctAnswer = option.correct;
      const prizeWon = correctAnswer ? question.prize : undefined;

      if (currentParticipant) {
        updateCurrentParticipantScore({
          questionId: question.id,
          answeredCorrectly: correctAnswer,
          prizeWon: prizeWon,
        });
      }

      setTimeout(() => {
        setGameState('prize');
      }, 2500); // Tiempo para feedback y explicación
    },
    [isAnswered, question, currentParticipant, updateCurrentParticipantScore, setGameState]
  );

  // [modificación] Mejoradas las animaciones para fluidez
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.06,
      },
    },
    exit: { opacity: 0, scale: 0.94, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25, ease: "easeOut" },
    },
  };

  // [modificación] Estilos base para consistencia visual
  const textOnDarkBase = "text-white";
  const labelColorOnDark = "text-gray-200";
  const cardBgOnDark = "bg-black/20";
  const cardBorderOnDark = "border border-white/30";
  const cardHoverStyles = "hover:bg-black/30 hover:border-white/50";
  const cardFocusStyles = "focus:ring-2 focus:ring-teal-400 focus:ring-opacity-60";

  // [modificación] Función mejorada para los estilos base de botones
  const getButtonBaseClasses = () => `w-full text-left justify-start p-4 md:p-5 rounded-xl transition-all duration-200 text-base font-marineRegular shadow-md ${cardBorderOnDark} focus:outline-none`;

  // [modificación] Estilos mejorados para los estados de botones
  const getButtonStateClasses = (option: AnswerOption) => {
    if (isAnswered) {
      const isSelected = selectedAnswer?.text === option.text;
      if (option.correct) {
        return `bg-green-500/90 ${textOnDarkBase} ring-green-400 ${isSelected ? 'animate-pulse-once' : ''} opacity-100`;
      }
      if (isSelected && !option.correct) {
        return 'bg-red-500/90 text-white ring-red-400 opacity-100';
      }
      // Opciones no seleccionadas
      return 'bg-gray-500/30 text-gray-300 ring-gray-600 opacity-70 cursor-not-allowed';
    }
    // Estilo para botones ANTES de responder
    return `${cardBgOnDark} ${textOnDarkBase} ${cardHoverStyles} ${cardFocusStyles} hover:scale-[1.02] active:scale-[0.98] border-celeste-medio/60 hover:border-celeste-medio`;
  };

  return (
    <motion.div
      key={question.id}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`flex flex-col items-center w-full max-w-md mx-auto p-6 md:p-8 rounded-2xl bg-gradient-to-b from-celeste-medio/90 to-azul-intenso/90 ${textOnDarkBase} shadow-2xl`}
      style={{ 
        minHeight: "auto",
        maxHeight: "85vh",
        marginTop: "60px", // [modificación] Añadido margen superior para evitar superposición con el logo
      }}
    >
      {/* [modificación] Cronómetro actualizado a 15 segundos */}
      <Timer initialSeconds={15} onTimeUp={handleTimeUp} />

      {/* [modificación] Contenedor de la pregunta con mejor visibilidad */}
      <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl mb-6 w-full">
        <h3 className="text-lg md:text-xl font-marineBold text-white text-center leading-tight">
          {question.text}
        </h3>
      </div>

      {/* [modificación] Opciones de respuesta sin scroll */}
      <div className="w-full space-y-3 md:space-y-4">
        {question.options.map((option, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Button
              onClick={() => handleAnswer(option)}
              className={`${getButtonBaseClasses()} ${getButtonStateClasses(option)} break-words`}
              disabled={isAnswered}
            >
              <span className="block">{option.text}</span>
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Contenedor para el feedback, se posicionará abajo */}
      <div className="mt-6 pt-4 border-t border-white/20 w-full">
        <AnimatePresence mode="wait">
          {showFeedback && isAnswered && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.3 } }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
              className="text-center"
            >
              {selectedAnswer?.correct ? (
                <p className="text-green-400 font-marineBold text-xl md:text-2xl">¡Correcto!</p>
              ) : (
                <p className="text-red-400 font-marineBold text-xl md:text-2xl">Incorrecto</p>
              )}
              {/* [modificación] Se elimina la explicación para mostrarla en PrizeModal */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}