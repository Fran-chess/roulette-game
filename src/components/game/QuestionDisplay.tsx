// src/components/game/QuestionDisplay.tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import type { Question, AnswerOption } from "@/types";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

interface TimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
}

function Timer({ initialSeconds, onTimeUp }: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    setSeconds(initialSeconds);
    setIsUrgent(false);
  }, [initialSeconds]);

  useEffect(() => {
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

  const timerSize = 100;
  const strokeWidth = 4;
  const radius = (timerSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (seconds / initialSeconds) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <svg
          className={`transform -rotate-90 transition-all ${
            isUrgent ? "animate-pulse" : ""
          }`}
          width={timerSize}
          height={timerSize}
        >
          <circle
            cx={timerSize / 2}
            cy={timerSize / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={timerSize / 2}
            cy={timerSize / 2}
            r={radius}
            stroke={isUrgent ? "#ef4444" : "#10b981"}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-3xl font-bold ${
              isUrgent ? "text-red-500 animate-pulse" : "text-white"
            }`}
          >
            {seconds}
          </span>
        </div>
      </div>
    </div>
  );
}

interface QuestionDisplayProps {
  question: Question;
  onAnswered?: (result: { correct: boolean; option: AnswerOption | null; timeUp?: boolean }) => void;
}

export default function QuestionDisplay({ question, onAnswered }: QuestionDisplayProps) {
  const setGameState = useGameStore((state) => state.setGameState);
  const setPrizeFeedback = useGameStore((state) => state.setPrizeFeedback);
  const setShowConfetti = useGameStore((state) => state.setShowConfetti);

  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answerState, setAnswerState] = useState<'idle' | 'selected' | 'revealed'>('idle');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const hasTimeUpExecutedRef = useRef(false);

  const timerSeconds = 30;

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
      // Guardar la jugada sin participante ni sesión
      const playData = {
        question_id: question.id,
        answered_correctly: false,
        prize_name: undefined,
      };

      await fetch('/api/plays/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playData),
      });
    } catch (error) {
      console.error('Error al guardar jugada:', error);
    }

    // Actualizar feedback
    setPrizeFeedback({
      answeredCorrectly: false,
      explanation: question.explanation || "",
      correctOption: correctOption?.text || "",
      prizeName: "",
    });

    if (onAnswered) onAnswered({ correct: false, option: null, timeUp: true });
    
    // Ir al estado de premio después de un delay
    setTimeout(() => {
      setGameState("prize");
    }, 2000);
  }, [
    isAnswered,
    question.id,
    question.explanation,
    question.options,
    setPrizeFeedback,
    onAnswered,
    setGameState,
  ]);

  const handleAnswer = useCallback(
    async (option: AnswerOption) => {
      if (isAnswered || hasTimeUpExecutedRef.current || isTransitioning) return;
      
      setIsTransitioning(true);
      setSelectedAnswer(option);
      setAnswerState('selected');
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      hasTimeUpExecutedRef.current = true;
      setIsAnswered(true);
      setAnswerState('revealed');
      
      const correctAnswer = option.correct;
      const correctOption = question.options.find((o) => o.correct);
      
      if (correctAnswer) setShowConfetti(true);

      try {
        // Guardar la jugada sin participante ni sesión
        const playData = {
          question_id: question.id,
          answered_correctly: correctAnswer,
          prize_name: correctAnswer ? question.prize : undefined,
        };

        await fetch('/api/plays/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(playData),
        });

        // Actualizar el feedback
        setPrizeFeedback({
          answeredCorrectly: correctAnswer,
          explanation: !correctAnswer ? question.explanation || "" : "",
          correctOption: correctOption?.text || "",
          prizeName: correctAnswer && question.prize ? question.prize : "",
        });

      } catch (error) {
        console.error('Error al guardar jugada:', error);
        
        setPrizeFeedback({
          answeredCorrectly: correctAnswer,
          explanation: !correctAnswer ? question.explanation || "" : "",
          correctOption: correctOption?.text || "",
          prizeName: "",
        });
      }

      if (onAnswered) onAnswered({ correct: correctAnswer, option });
      
      // Transición al estado de premio
      setTimeout(() => {
        setGameState("prize");
      }, 2500);
    },
    [
      isAnswered,
      isTransitioning,
      question.id,
      question.prize,
      question.explanation,
      question.options,
      setShowConfetti,
      setPrizeFeedback,
      onAnswered,
      setGameState,
    ]
  );

  const getOptionStyle = useCallback((option: AnswerOption) => {
    if (answerState === 'idle') {
      return 'bg-gradient-to-br from-blue-500/80 to-purple-600/80 hover:from-blue-600 hover:to-purple-700';
    }
    
    if (answerState === 'selected') {
      if (selectedAnswer === option) {
        return 'bg-gradient-to-br from-yellow-500/80 to-orange-600/80 animate-pulse';
      }
      return 'bg-gradient-to-br from-gray-600/50 to-gray-700/50 opacity-50';
    }
    
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex items-center justify-center p-4"
    >
      <div className="w-full max-w-4xl">
        <div className="bg-black/40 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/10">
          {/* Timer */}
          <div className="mb-8">
            <Timer
              initialSeconds={timerSeconds}
              onTimeUp={handleTimeUp}
            />
          </div>

          {/* Question */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white text-center mb-2">
              {question.category}
            </h2>
            <p className="text-xl md:text-2xl text-white/90 text-center">
              {question.text}
            </p>
          </motion.div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.options.map((option, index) => (
              <motion.div
                key={index}
                initial={{ x: index % 2 === 0 ? -50 : 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Button
                  onClick={() => handleAnswer(option)}
                  disabled={isAnswered}
                  className={`
                    w-full p-6 text-lg md:text-xl font-semibold text-white
                    rounded-xl transition-all duration-500 transform
                    ${getOptionStyle(option)}
                    ${!isAnswered && 'hover:scale-105 active:scale-95'}
                    ${isAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}
                    shadow-lg
                  `}
                >
                  <span className="flex items-center justify-center gap-3">
                    {answerState === 'revealed' && option.correct && (
                      <span className="text-2xl">✓</span>
                    )}
                    {answerState === 'revealed' && selectedAnswer === option && !option.correct && (
                      <span className="text-2xl">✗</span>
                    )}
                    {option.text}
                  </span>
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Feedback message */}
          {answerState === 'revealed' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center"
            >
              {selectedAnswer?.correct ? (
                <p className="text-2xl font-bold text-green-400">
                  ¡Correcto! 🎉
                </p>
              ) : (
                <div>
                  <p className="text-2xl font-bold text-red-400 mb-2">
                    Incorrecto
                  </p>
                  {question.explanation && (
                    <p className="text-lg text-white/80">
                      {question.explanation}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}