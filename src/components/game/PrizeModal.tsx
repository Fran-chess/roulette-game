"use client";
import { useGameStore } from "@/store/gameStore";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import {
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import MassiveConfetti from "@/components/ui/MassiveConfetti";

export default function PrizeModal() {
  const setGameState = useGameStore((state) => state.setGameState);
  const prizeFeedback = useGameStore((state) => state.prizeFeedback);
  const resetPrizeFeedback = useGameStore((state) => state.resetPrizeFeedback);
  const setCurrentQuestion = useGameStore((state) => state.setCurrentQuestion);
  const setLastSpinResultIndex = useGameStore((state) => state.setLastSpinResultIndex);
  const setShowConfetti = useGameStore((state) => state.setShowConfetti);
  const showConfetti = useGameStore((state) => state.showConfetti);
  const resetCurrentGame = useGameStore((state) => state.resetCurrentGame);

  const { answeredCorrectly, explanation, correctOption, prizeName } = prizeFeedback;

  // Window size for confetti
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);
    
    return () => {
      window.removeEventListener('resize', updateWindowSize);
      setShowConfetti(false);
    };
  }, [setShowConfetti]);

  const handleReturnToRoulette = () => {
    setLastSpinResultIndex(null);
    setCurrentQuestion(null);
    resetPrizeFeedback();
    setShowConfetti(false);
    setGameState("roulette");
  };

  const handleReturnToStart = () => {
    resetCurrentGame();
  };

  return (
    <>
      {showConfetti && answeredCorrectly && (
        <MassiveConfetti show={showConfetti && answeredCorrectly} windowSize={windowSize} />
      )}
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center justify-center w-full h-full p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="
            w-full max-w-2xl mx-auto text-center
            bg-gray-900/90 shadow-2xl border-4 border-white/40
            rounded-3xl p-6
            sm:p-8
            md:p-10
            lg:p-12
            xl:p-14
          "
        >
          {/* Icon */}
          <div className="mb-4 sm:mb-6">
            {answeredCorrectly ? (
              <CheckCircleIcon className="
                mx-auto text-green-400 animate-bounce
                w-16 h-16
                sm:w-20 sm:h-20
                md:w-24 md:h-24
                lg:w-28 lg:h-28
                xl:w-32 xl:h-32
              " />
            ) : (
              <XCircleIcon className="
                mx-auto text-red-400 animate-pulse
                w-16 h-16
                sm:w-20 sm:h-20
                md:w-24 md:h-24
                lg:w-28 lg:h-28
                xl:w-32 xl:h-32
              " />
            )}
          </div>

          {/* Title */}
          <h2 className={`
            font-bold mb-6
            text-3xl
            sm:text-4xl
            md:text-5xl
            lg:text-6xl
            xl:text-7xl
            ${answeredCorrectly ? "text-green-400" : "text-red-400"}
          `}>
            {answeredCorrectly ? "¡Felicitaciones!" : "¡Sigue intentando!"}
          </h2>

          {/* Message */}
          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            <p className="
              text-white font-semibold
              text-xl
              sm:text-2xl
              md:text-3xl
              lg:text-4xl
            ">
              {answeredCorrectly
                ? "¡Respuesta correcta!"
                : "Respuesta incorrecta"}
            </p>

            {!answeredCorrectly && correctOption && (
              <div className="p-4 sm:p-5 bg-black/50 border-2 border-green-400/50 rounded-xl">
                <p className="
                  text-white
                  text-lg
                  sm:text-xl
                  md:text-2xl
                  lg:text-3xl
                ">
                  <span className="font-bold">Respuesta correcta:</span>
                </p>
                <p className="
                  text-green-400 font-bold mt-2
                  text-xl
                  sm:text-2xl
                  md:text-3xl
                  lg:text-4xl
                ">{correctOption}</p>
              </div>
            )}

            {!answeredCorrectly && explanation && (
              <div className="p-4 sm:p-5 bg-black/50 border-2 border-yellow-400/50 rounded-xl">
                <p className="
                  text-white
                  text-lg
                  sm:text-xl
                  md:text-2xl
                  lg:text-3xl
                ">{explanation}</p>
              </div>
            )}

            {answeredCorrectly && prizeName && (
              <div className="p-5 sm:p-6 bg-green-500/30 rounded-2xl border-3 border-green-400">
                <p className="
                  text-white font-semibold
                  text-xl
                  sm:text-2xl
                  md:text-3xl
                  lg:text-4xl
                ">¡Has ganado!</p>
                <p className="
                  font-bold text-green-400 mt-3
                  text-2xl
                  sm:text-3xl
                  md:text-4xl
                  lg:text-5xl
                ">{prizeName}</p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button
              onClick={handleReturnToRoulette}
              variant="primary"
              className="
                font-bold bg-gradient-to-r from-blue-600 to-blue-500
                hover:from-blue-700 hover:to-blue-600 text-white
                transition-all transform hover:scale-105 shadow-xl
                rounded-full px-8 py-4 text-lg
                sm:px-10 sm:py-5 sm:text-xl
                md:text-2xl
                lg:px-12 lg:py-6 lg:text-3xl
                xl:px-14 xl:py-7 xl:text-4xl
              "
            >
              Jugar de Nuevo
            </Button>
            
            <Button
              onClick={handleReturnToStart}
              variant="secondary"
              className="
                font-bold bg-gray-700 hover:bg-gray-600 text-white
                transition-all transform hover:scale-105 shadow-xl
                rounded-full px-8 py-4 text-lg
                sm:px-10 sm:py-5 sm:text-xl
                md:text-2xl
                lg:px-12 lg:py-6 lg:text-3xl
                xl:px-14 xl:py-7 xl:text-4xl
              "
            >
              Volver al Inicio
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}