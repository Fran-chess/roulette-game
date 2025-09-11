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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-full max-w-2xl mx-auto p-8 rounded-2xl shadow-2xl text-center bg-black/20 backdrop-blur-xl border-2 border-white/40"
        >
          {/* Icon */}
          <div className="mb-6">
            {answeredCorrectly ? (
              <CheckCircleIcon className="w-24 h-24 mx-auto text-green-400 animate-bounce" />
            ) : (
              <XCircleIcon className="w-24 h-24 mx-auto text-red-400 animate-pulse" />
            )}
          </div>

          {/* Title */}
          <h2 className={`text-4xl font-bold mb-4 ${answeredCorrectly ? "text-green-400" : "text-red-400"}`}>
            {answeredCorrectly ? "¡Felicitaciones!" : "¡Sigue intentando!"}
          </h2>

          {/* Message */}
          <div className="space-y-4 mb-8">
            <p className="text-xl text-white">
              {answeredCorrectly
                ? "¡Respuesta correcta!"
                : "Respuesta incorrecta"}
            </p>

            {!answeredCorrectly && correctOption && (
              <div className="p-4 bg-white/10 rounded-lg">
                <p className="text-lg text-white/90">
                  <span className="font-semibold">Respuesta correcta:</span>
                </p>
                <p className="text-xl text-green-400 mt-2">{correctOption}</p>
              </div>
            )}

            {!answeredCorrectly && explanation && (
              <div className="p-4 bg-white/10 rounded-lg">
                <p className="text-lg text-white/90">{explanation}</p>
              </div>
            )}

            {answeredCorrectly && prizeName && (
              <div className="p-4 bg-green-500/20 rounded-lg border-2 border-green-400">
                <p className="text-lg text-white">¡Has ganado!</p>
                <p className="text-2xl font-bold text-green-400 mt-2">{prizeName}</p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleReturnToRoulette}
              variant="primary"
              className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all transform hover:scale-105"
            >
              Jugar de Nuevo
            </Button>
            
            <Button
              onClick={handleReturnToStart}
              variant="secondary"
              className="px-8 py-4 text-lg font-semibold bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all transform hover:scale-105"
            >
              Volver al Inicio
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}