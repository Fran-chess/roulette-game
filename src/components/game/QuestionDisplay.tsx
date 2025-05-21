'use client';
import { useState, useCallback, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { Question, AnswerOption } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';

interface TimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
}

function Timer({ initialSeconds, onTimeUp }: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const isWarning = seconds <= 5;

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
  const setGameState = useGameStore((state) => state.setGameState);
  const currentParticipant = useGameStore((state) => state.currentParticipant);
  const updateCurrentParticipantScore = useGameStore(
    (state) => state.updateCurrentParticipantScore
  );
  const setPrizeFeedback = useGameStore((state) => state.setPrizeFeedback);

  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowFeedback(false);
  }, [question]);

  const handleTimeUp = useCallback(() => {
    if (!isAnswered) {
      if (currentParticipant) {
        updateCurrentParticipantScore({
          questionId: question.id,
          answeredCorrectly: false,
        });
      }
      
      const correctOption = question.options.find(o => o.correct);
      
      setPrizeFeedback({
        answeredCorrectly: false,
        explanation: question.explanation || "",
        correctOption: correctOption?.text || "",
        prizeName: "",
      });
      
      setShowFeedback(true);
      setIsAnswered(true);
      setTimeout(() => {
        setGameState('prize');
      }, 1500);
    }
  }, [isAnswered, question, currentParticipant, updateCurrentParticipantScore, setGameState, setPrizeFeedback]);

  const handleAnswer = useCallback(
    (option: AnswerOption) => {
      if (isAnswered) return;
      setSelectedAnswer(option);
      setIsAnswered(true);
      setShowFeedback(true);

      const correctAnswer = option.correct;
      const prizeWon = correctAnswer ? question.prize : undefined;
      
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

      setTimeout(() => {
        setGameState('prize');
      }, 2500);
    },
    [
      isAnswered, 
      question, 
      currentParticipant, 
      updateCurrentParticipantScore, 
      setGameState,
      setPrizeFeedback
    ]
  );

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

  const cardBgOnDark = "bg-black/5 backdrop-blur-sm";
  const cardBorderOnDark = "border border-white/30";
  const cardHoverStyles = "hover:bg-black/10 hover:border-white/50";
  const cardFocusStyles = "focus:ring-2 focus:ring-celeste-medio focus:ring-opacity-60";

  const getButtonBaseClasses = () =>
    `w-full text-left justify-start p-4 md:p-5 rounded-xl transition-all duration-200 text-base font-marineRegular shadow-md ${cardBorderOnDark} focus:outline-none`;

  const getButtonStateClasses = (option: AnswerOption) => {
  if (isAnswered) {
    const isSelected = selectedAnswer?.text === option.text;
    if (option.correct) {
      // Correcta, verde Tailwind
      return "bg-green-500 text-white ring-green-500 opacity-100 font-semibold border-green-500";
    }
    if (isSelected && !option.correct) {
      // Seleccionada y errónea, rojo Tailwind
      return "bg-red-500 text-white ring-red-400 opacity-100 font-semibold border-red-500";
    }
    // No seleccionada y no es correcta (opaca)
    return "bg-black/5 text-white/60 ring-gray-600 opacity-70 cursor-not-allowed";
  }
  // Estado normal antes de responder
  return `${cardBgOnDark} text-white ${cardHoverStyles} ${cardFocusStyles} hover:scale-[1.02] active:scale-[0.98] border-white/30 hover:border-celeste-medio`;
};

  

  return (
    <motion.div
      key={question.id}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col items-center w-full mx-auto p-0"
    >
      <Timer initialSeconds={15} onTimeUp={handleTimeUp} />

      <div className="bg-black/10 backdrop-blur-sm p-5 rounded-xl mb-6 w-full border border-white/30 shadow-lg">
        <h3 className="text-lg md:text-xl font-marineBold text-white text-center leading-tight">
          {question.text}
        </h3>
      </div>

      <div className="w-full space-y-3 md:space-y-4">
        {question.options.map((option, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Button
              variant="custom"
              onClick={() => handleAnswer(option)}
              className={`${getButtonBaseClasses()} ${getButtonStateClasses(option)} break-words`}
              disabled={isAnswered}
            >
              <span className="block">{option.text}</span>
            </Button>
          </motion.div>
        ))}
      </div>

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
                <p className="text-verde-salud font-marineBold text-xl md:text-2xl">¡Correcto!</p>
              ) : (
                <p className="text-red-400 font-marineBold text-xl md:text-2xl">Incorrecto</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
