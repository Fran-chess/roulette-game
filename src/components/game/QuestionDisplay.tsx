/**
 * Componente de Visualización de Preguntas
 * Versión refactorizada y modularizada
 */

"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import TimerCircle from "@/components/ui/TimerCircle";
import { useTimer } from "@/hooks/useTimer";
import { useQuestionLogic } from "@/hooks/useQuestionLogic";
import { audioService, SoundType } from "@/services/audio/audioService";
import type { Question, AnswerOption } from "@/types";

/**
 * Props del componente
 */
interface QuestionDisplayProps {
  question: Question;
  onAnswered?: (result: {
    correct: boolean;
    option: AnswerOption | null;
    timeUp?: boolean;
  }) => void;
}

/**
 * Componente QuestionDisplay
 * Muestra una pregunta con opciones y temporizador
 *
 * @component
 * @example
 * ```tsx
 * <QuestionDisplay
 *   question={currentQuestion}
 *   onAnswered={(result) => console.log(result)}
 * />
 * ```
 */
export default function QuestionDisplay({
  question,
  onAnswered,
}: QuestionDisplayProps) {
  // Timer con hook personalizado
  const timer = useTimer({
    initialSeconds: 30,
    onTimeUp: () => handleTimeUp(),
    urgentThreshold: 5,
    autoStart: true,
  });

  // Lógica de preguntas con hook personalizado
  const {
    selectedAnswer,
    isAnswered,
    answerState,
    handleAnswer: processAnswer,
    handleTimeUp: processTimeUp,
    getOptionStyle,
  } = useQuestionLogic({
    question,
    onAnswered,
  });

  // Manejadores con efectos de sonido
  const handleTimeUp = async () => {
    audioService.playSound(SoundType.TIMEOUT);
    await processTimeUp();
  };

  const handleAnswer = async (option: AnswerOption) => {
    audioService.playSound(SoundType.SELECT);
    await processAnswer(option);

    // Reproducir sonido según resultado
    setTimeout(() => {
      if (option.correct) {
        audioService.playVictorySound();
      } else {
        audioService.playDefeatSound();
      }
    }, 400);
  };

  // Efecto de sonido para contador urgente
  useEffect(() => {
    if (timer.isUrgent && timer.seconds > 0 && !isAnswered) {
      audioService.playSound(SoundType.COUNTDOWN);
    }
  }, [timer.seconds, timer.isUrgent, isAnswered]);

  // Resume audio context al montar
  useEffect(() => {
    audioService.resumeContext();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex items-center justify-center p-4"
    >
      <div className="w-full max-w-4xl">
        <div className="relative">
          {/* Timer */}
          <div className="mb-6">
            <TimerCircle
              seconds={timer.seconds}
              initialSeconds={30}
              isUrgent={timer.isUrgent}
            />
          </div>

          {/* Categoría y Pregunta */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2
              className="
              font-bold text-yellow-400 text-center mb-4
              text-2xl
              sm:text-3xl
              md:text-4xl
              lg:text-5xl
              xl:text-6xl
            "
            >
              {question.category}
            </h2>
            <p
              className="
              text-white font-semibold text-center
              text-xl
              sm:text-2xl
              md:text-3xl
              lg:text-4xl
              xl:text-5xl
            "
            >
              {question.text}
            </p>
          </motion.div>

          {/* Opciones de Respuesta */}
          <div
            className="
            grid gap-3
            grid-cols-1
            sm:gap-4
            md:grid-cols-2 md:gap-4
            lg:gap-5
            xl:gap-6
          "
          >
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
                    w-full font-bold text-white
                    rounded-2xl transition-all duration-500 transform
                    shadow-xl border-2 border-white/30
                    p-5 text-lg
                    sm:p-6 sm:text-xl
                    md:p-7 md:text-2xl
                    lg:p-8 lg:text-3xl
                    xl:p-10 xl:text-4xl
                    ${getOptionStyle(option)}
                    ${!isAnswered && "hover:scale-105 active:scale-95 hover:shadow-2xl"}
                    ${isAnswered ? "cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  <span className="flex items-center justify-center gap-3">
                    {/* Icono de resultado */}
                    {answerState === "revealed" && option.correct && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-2xl"
                      >
                        ✓
                      </motion.span>
                    )}
                    {answerState === "revealed" &&
                      selectedAnswer === option &&
                      !option.correct && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-2xl"
                        >
                          ✗
                        </motion.span>
                      )}
                    {option.text}
                  </span>
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Mensaje de Feedback */}
          {answerState === "revealed" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 text-center"
            >
              {selectedAnswer?.correct ? (
                <motion.p
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="
                  font-bold text-green-400
                  text-2xl
                  sm:text-3xl
                  md:text-4xl
                  lg:text-5xl
                "
                >
                  ¡Correcto! 🎉
                </motion.p>
              ) : (
                <div>
                  <motion.p
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="
                    font-bold text-red-400 mb-2
                    text-2xl
                    sm:text-3xl
                    md:text-4xl
                    lg:text-5xl
                  "
                  >
                    {timer.seconds === 0 ? "¡Tiempo agotado!" : "Incorrecto"}
                  </motion.p>
                  {question.explanation && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="
                      text-white/80
                      text-base
                      sm:text-lg
                      md:text-xl
                      lg:text-2xl
                    "
                    >
                      {question.explanation}
                    </motion.p>
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