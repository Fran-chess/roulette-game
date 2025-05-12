"use client";

import { useEffect, useState, useCallback } from "react";
import { useGameStore } from "@/store/gameStore";
import VideoBackground from "@/components/layout/VideoBackground";
import ScreenSaver from "@/components/layout/ScreenSaver"; // Capa de interacción
import RegistrationForm from "@/components/game/RegistrationForm";
import RouletteWheel from "@/components/game/RouletteWheel";
import QuestionDisplay from "@/components/game/QuestionDisplay";
import PrizeModal from "@/components/game/PrizeModal";
import questionsData from "@/data/questions.json";
import type { Question } from "@/types";
import { useInactivityTimer } from "@/lib/hooks/useInactivityTimer";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

// [modificación] Logs para diagnosticar la carga del JSON
console.log("Contenido crudo de questionsData:", questionsData);
const allQuestions: Question[] = questionsData as Question[];
console.log("Objeto allQuestions después de la asignación:", allQuestions);
console.log("Número de preguntas en allQuestions:", allQuestions.length);

const SCREENSAVER_TIMEOUT = 120000; // 2 minutos
const QUESTION_THINKING_TIMEOUT = 300000; // 5 minutos

export default function HomePage() {
  // [modificación] Uso de selectores individuales para mejorar rendimiento
  const gameState = useGameStore((state) => state.gameState);
  const setGameState = useGameStore((state) => state.setGameState);
  const currentQuestion = useGameStore((state) => state.currentQuestion);
  const setCurrentQuestion = useGameStore((state) => state.setCurrentQuestion);
  const lastSpinResultIndex = useGameStore((state) => state.lastSpinResultIndex);
  const setLastSpinResultIndex = useGameStore((state) => state.setLastSpinResultIndex);
  const resetCurrentGame = useGameStore((state) => state.resetCurrentGame);
  const setCurrentParticipant = useGameStore((state) => state.setCurrentParticipant);

  const [isTransitioning, setIsTransitioning] = useState(false);

  // [modificación] Funciones de callback memoizadas
  const inactivityCallback = useCallback(() => {
    if (gameState !== "screensaver" && !isTransitioning) {
      console.log(
        `Inactividad detectada en estado '${gameState}'. Volviendo al modo reposo.`
      );
      setIsTransitioning(true);
      setGameState("screensaver");
      resetCurrentGame();
      setCurrentParticipant(null);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 1000);
    }
  }, [gameState, isTransitioning, setGameState, resetCurrentGame, setCurrentParticipant]);

  const currentInactivityTimeout =
    gameState === "question" ? QUESTION_THINKING_TIMEOUT : SCREENSAVER_TIMEOUT;
  const { isThinking } = useInactivityTimer(
    currentInactivityTimeout,
    inactivityCallback,
    gameState,
    {
      minMovementThreshold: 5,
      gameStateFilter: ["question", "roulette", "prize"],
    }
  );

  const handleScreenSaverInteraction = useCallback(() => {
    if (gameState === "screensaver" && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentParticipant(null); // Limpiar participante anterior
      resetCurrentGame(); // Resetear datos del juego anterior
      setGameState("register"); // Ir al formulario de registro
      setTimeout(() => {
        setIsTransitioning(false);
      }, 800);
    }
  }, [gameState, isTransitioning, setCurrentParticipant, resetCurrentGame, setGameState]);

  // [modificación] Efecto optimizado para evitar bucles infinitos
  useEffect(() => {
    // Solo actuar si estamos en 'roulette' Y tenemos un índice no nulo
    if (gameState === "roulette" && lastSpinResultIndex !== null) {
      console.log(`[HomePage] useEffect [roulette check] - Índice recibido: ${lastSpinResultIndex}`);
      
      // Primero capturar el valor actual para usarlo sin crear dependencias reactivas
      const indexToUse = lastSpinResultIndex;
      
      // Limpiar INMEDIATAMENTE el índice para evitar nuevas ejecuciones
      setLastSpinResultIndex(null);
      
      // Validar el índice antes de usarlo
      if (indexToUse >= 0 && indexToUse < allQuestions.length) {
        console.log(`[HomePage] Índice válido (${indexToUse}). Seleccionando pregunta y cambiando a 'question'.`);
        
        // Solo actualizar el estado si el índice es válido
        const selectedQuestion = allQuestions[indexToUse];
        setCurrentQuestion(selectedQuestion);
        setGameState("question");
      } else {
        console.error(`[HomePage] Índice inválido: ${indexToUse}. No se realizó ninguna acción.`);
      }
    }
  }, [gameState, lastSpinResultIndex, setCurrentQuestion, setGameState, setLastSpinResultIndex]);

  const gameContentAreaVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 50 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut", delay: 0.1 },
    }, // Reducido el delay
    exit: {
      opacity: 0,
      scale: 0.9,
      y: -30,
      transition: { duration: 0.4, ease: "easeIn" },
    },
  };

  const paddingTopForRegistrationForm = "pt-24";

  return (
    <main
      className={`flex flex-col items-center justify-center min-h-screen text-center relative overflow-hidden 
                    transition-colors duration-700 ease-in-out ${
                      gameState === "screensaver"
                        ? "bg-black"
                        : "bg-azul-intenso"
                    }`}
    >
      <VideoBackground
        videoSrc="/videos/intro-loop.mp4"
        isActive={gameState === "screensaver" && !isTransitioning}
      />

      {/* El logo de la empresa AHORA solo se muestra si NO estamos en screensaver */}
      <AnimatePresence>
        {gameState !== "screensaver" && !isTransitioning && (
          <motion.div
            key="companyLogo"
            className="absolute top-1 left-0 right-0 mx-auto w-fit z-30"
            initial={{ opacity: 0, y: -20 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.5, delay: 0.3 },
            }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
          >
            <Image
              src="/images/8.svg"
              alt="Logo Empresa"
              width={220}
              height={67}
              priority
              className=""
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {gameState === "screensaver" && !isTransitioning && (
          <motion.div
            key="screensaverUI"
            className="fixed inset-0 z-20" // Encima del video
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.1 } }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          >
            {/* ScreenSaver ahora no tiene texto propio, es solo la capa de interacción */}
            <ScreenSaver
              onInteraction={handleScreenSaverInteraction}
              isVisible={true}
            />
            {/* El texto que estaba aquí ("¡Gira la Ruleta!", "Toca para Jugar") HA SIDO ELIMINADO */}
          </motion.div>
        )}

        {(gameState === "register" ||
          gameState === "roulette" ||
          gameState === "question" ||
          gameState === "prize") && (
          <motion.div
            key={gameState}
            className={`relative z-10 w-full flex items-center justify-center max-w-xl md:max-w-2xl lg:max-w-3xl px-4 ${paddingTopForRegistrationForm}`}
            variants={gameContentAreaVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {gameState === "register" && <RegistrationForm />}
            {gameState === "roulette" &&
              (allQuestions.length > 0 ? (
                <RouletteWheel questions={allQuestions} />
              ) : (
                <div className="text-red-500 bg-white p-4 rounded-md">
                  Error: No hay preguntas cargadas.
                </div>
              ))}
            {gameState === "question" && currentQuestion && (
              <QuestionDisplay question={currentQuestion} />
            )}
            {gameState === "prize" && <PrizeModal />}
          </motion.div>
        )}
      </AnimatePresence>

      {isThinking && gameState !== "screensaver" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed bottom-5 right-5 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm z-50 shadow-lg"
        >
          Pensando...
        </motion.div>
      )}
    </main>
  );
}
