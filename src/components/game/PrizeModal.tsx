"use client";
import { useGameStore } from "@/store/gameStore";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { useEffect } from "react";

export default function PrizeModal() {
  const setGameState = useGameStore((state) => state.setGameState);
  const resetCurrentGame = useGameStore((state) => state.resetCurrentGame);
  const currentParticipant = useGameStore((state) => state.currentParticipant);
  const setCurrentParticipant = useGameStore((state) => state.setCurrentParticipant);
  const prizeFeedback = useGameStore((state) => state.prizeFeedback);
  const resetPrizeFeedback = useGameStore((state) => state.resetPrizeFeedback);
  const setShowConfetti = useGameStore((state) => state.setShowConfetti);

  const { answeredCorrectly, explanation, correctOption, prizeName } =
    prizeFeedback;

  // Normalización del nombre de la imagen (igual que antes)
  const prizeImage = prizeName
    ? `/images/premios/${prizeName.replace(/\s+/g, "-")}.png`
    : null;

  // Efecto para mostrar confeti cuando la respuesta es correcta
  useEffect(() => {
    if (answeredCorrectly) {
      setShowConfetti(true);
    }
  }, [answeredCorrectly, setShowConfetti]);

  const gameSession = useGameStore((state) => state.gameSession);

  const resetSessionForNextPlayer = async () => {
    if (gameSession) {
      try {
        await fetch('/api/admin/sessions/reset-player', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: gameSession.session_id }),
        });
      } catch (err) {
        console.error('Error resetting session:', err);
      }
    }
  };

  const handlePlayAgain = async () => {
    await resetSessionForNextPlayer();
    resetCurrentGame();
    setCurrentParticipant(null);
    resetPrizeFeedback();
    setShowConfetti(false);
    setGameState("register");
  };

  const handleGoHome = async () => {
    await resetSessionForNextPlayer();
    resetCurrentGame();
    setCurrentParticipant(null);
    resetPrizeFeedback();
    setShowConfetti(false);
    setGameState("screensaver");
  };

  if (answeredCorrectly === null) {
    return null;
  }

  // --- Variantes de Animación ---
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay: 0.1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 30,
      transition: { duration: 0.2, ease: "easeIn" },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.3, duration: 0.4 },
    },
  };

  // --- Estilos Comunes ---
  const modalBaseClasses =
    "w-full max-w-md mx-auto p-6 md:p-10 rounded-2xl shadow-2xl text-center";

  return (
    <motion.div
      key="prizeModalBackdrop"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/50 backdrop-blur-[2px]"
      aria-modal="true"
      role="dialog"
    >


      <motion.div
        key="prizeModalContent"
        variants={modalVariants}
        className={`${modalBaseClasses} bg-black/10 backdrop-blur-sm border border-white/30 text-white flex flex-col items-center shadow-lg`}
      >
        {answeredCorrectly === false ? (
          // --- Vista: Respuesta Incorrecta ---
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="w-full"
          >
            <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-marineBold text-white mb-6">
              ¡Respuesta Incorrecta!
            </h2>

            <div className="my-4 bg-black/10 p-4 rounded-lg border border-red-400/30 text-white">
              <p className="font-marineBold mb-1">Respuesta correcta:</p>
              <p className="text-lg font-marineBold text-verde-salud mb-2">
                {correctOption}
              </p>
              {explanation && (
                <p className="text-white/90 text-base">{explanation}</p>
              )}
            </div>

            <Button
              onClick={handlePlayAgain}
              variant="primary"
              className="
    w-full max-w-xs mx-auto
    text-white font-marineBold text-lg py-3 rounded-xl
    shadow-2xl border-2 border-celeste-medio
    bg-gradient-to-r from-azul-intenso via-celeste-medio to-verde-salud
    transition-all duration-200
    hover:scale-105 hover:shadow-[0_0_25px_8px_rgba(20,220,180,0.35)]
    active:scale-95
    focus:outline-none focus:ring-4 focus:ring-celeste-medio/40
  "
            >
              Jugar de nuevo
            </Button>
          </motion.div>
        ) : (
          // --- Vista: Respuesta Correcta (con o sin premio) ---
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="w-full"
          >
            <CheckCircleIcon className="w-16 h-16 text-verde-salud mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-marineBlack text-white mb-2">
              ¡Felicitaciones {currentParticipant?.nombre}!
            </h2>
            <p className="text-lg text-white mb-4 font-marineRegular">
              ¡Respuesta correcta!
            </p>

            {prizeName && (
              <>
                {prizeImage && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      transition: { delay: 0.4, duration: 0.5 },
                    }}
                    className="my-5 flex justify-center"
                  >
                    <Image
                      src={prizeImage}
                      alt={prizeName}
                      width={120}
                      height={120}
                      className="object-contain rounded-lg shadow-md bg-black/15 p-2 border border-white/30"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </motion.div>
                )}
                <p className="text-lg text-white mb-1 font-marineRegular">
                  Has ganado:
                </p>
                <p className="text-xl md:text-2xl font-marineBold text-white mb-5">
                  {prizeName}
                </p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: 0.5, duration: 0.4 },
                  }}
                  className="bg-black/5 border border-white/30 text-white p-4 rounded-xl mt-4 mb-8 text-sm md:text-base font-marineRegular shadow-md"
                >
                  Por favor, acércate al mostrador principal para retirar tu
                  premio: <span className="font-marineBold">{prizeName}</span>.
                  ¡Gracias por participar!
                </motion.div>
              </>
            )}

            {!prizeName && (
              <p className="text-md text-white mb-8 mt-4 font-marineRegular">
                ¡Bien hecho! Sigue participando.
              </p>
            )}

            <Button
              onClick={handleGoHome}
              variant="secondary"
              className="w-full max-w-xs mx-auto bg-black/10 border border-white/30 hover:bg-black/20 hover:border-white/50 text-white font-marineBold text-lg py-3 rounded-xl shadow-lg transform active:scale-95 transition-all duration-300"
            >
              Volver al Inicio
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
