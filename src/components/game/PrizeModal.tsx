// src/components/game/PrizeModal.tsx
'use client';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Importación dinámica para evitar problemas de SSR con window
const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

export default function PrizeModal() {
  const setGameState = useGameStore(state => state.setGameState);
  const resetCurrentGame = useGameStore(state => state.resetCurrentGame);
  const currentParticipant = useGameStore(state => state.currentParticipant);
  const setCurrentParticipant = useGameStore(state => state.setCurrentParticipant);

  // Estado para confeti
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  // Simplificamos la lógica de estado basada directamente en `answeredCorrectly`
  const answeredCorrectly = currentParticipant?.answeredCorrectly;
  const prizeName = currentParticipant?.prizeWon; // Puede ser null/undefined si no ganó premio

  // Normalización del nombre de la imagen (igual que antes)
  const prizeImage = prizeName ? `/images/premios/${prizeName.replace(/\s+/g, '-')}.png` : null;

  // Efecto para gestionar el confeti
  useEffect(() => {
    // Actualizar tamaño de ventana para el confeti
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Mostrar confeti cuando responde correctamente
    if (answeredCorrectly) {
      setShowConfetti(true);
      
      // Detener confeti después de 5 segundos
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
    
    // Listener para tamaño de ventana
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [answeredCorrectly]);

  const handlePlayAgain = () => {
    resetCurrentGame();
    setCurrentParticipant(null);
    setGameState('register'); // Va directo al registro para el próximo participante
  };

  const handleGoHome = () => {
    resetCurrentGame();
    setCurrentParticipant(null);
    setGameState('screensaver'); // Vuelve a la pantalla de inicio/reposo
  };

  // Si no hay participante, no mostrar nada (igual que antes)
  if (!currentParticipant) {
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
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: 0.1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 30,
      transition: { duration: 0.2, ease: 'easeIn' },
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
  // [modificación] Estilo actualizado para coincidir con el degradado de fondo azul-turquesa
  const modalBaseClasses = "w-full max-w-md mx-auto p-6 md:p-10 rounded-2xl shadow-2xl text-center";

  return (
    <motion.div
      key="prizeModalBackdrop"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      // [modificación] Cambiado el fondo negro por el degradado azul-turquesa que usa el resto de la aplicación
      className="fixed inset-0 bg-gradient-to-b from-teal-500 to-blue-500 flex items-center justify-center p-4 z-50"
      aria-modal="true"
      role="dialog"
    >
      {/* Componente Confetti que se muestra cuando hay respuesta correcta */}
      {showConfetti && answeredCorrectly && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.2}
          colors={['#FFC107', '#FF9800', '#FF5722', '#4CAF50', '#2196F3', '#9C27B0']} // Colores festivos
        />
      )}

      <motion.div
        key="prizeModalContent"
        variants={modalVariants}
        // [modificación] Fondo semi-transparente para el contenido del modal, similar al registro
        className={`${modalBaseClasses} bg-blue-500/30 backdrop-blur-sm border border-white/20 text-white flex flex-col items-center`}
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
            <h2 className="text-2xl md:text-3xl font-marineBold text-white mb-8">
              ¡Respuesta Incorrecta!
            </h2>
            <Button
              onClick={handlePlayAgain}
              variant="primary"
              // [modificación] Botón naranja similar al botón de registro
              className="w-full max-w-xs mx-auto bg-orange-500 hover:bg-orange-600 text-white font-marineBold text-lg py-3 rounded-xl shadow-lg transform active:scale-95"
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
            <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-marineBlack text-white mb-2">
              ¡Felicitaciones {prizeName ? 'ganador' : currentParticipant.nombre}!
            </h2>
            <p className="text-lg text-white mb-4 font-marineRegular">
              ¡Respuesta correcta!
            </p>

            {prizeName && (
              <>
                {prizeImage && (
                  <motion.div
                   initial={{ scale: 0.5, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1, transition: { delay: 0.4, duration: 0.5 } }}
                   className="my-5 flex justify-center"
                  >
                    <Image
                      src={prizeImage}
                      alt={prizeName}
                      width={120}
                      height={120}
                      // [modificación] Fondo más claro para la imagen
                      className="object-contain rounded-lg shadow-md bg-white/30 p-2"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </motion.div>
                )}
                <p className="text-lg text-white mb-1 font-marineRegular">Has ganado:</p>
                <p className="text-xl md:text-2xl font-marineBold text-white mb-5">{prizeName}</p>

                {/* Párrafo especial para retirar premio */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.4 } }}
                  // [modificación] Estilo más similar al resto de componentes
                  className="bg-white/10 border border-white/30 text-white p-4 rounded-lg mt-4 mb-8 text-sm md:text-base font-marineRegular"
                >
                  Por favor, acércate al mostrador principal para retirar tu premio: <span className="font-marineBold">{prizeName}</span>. ¡Gracias por participar!
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
              // [modificación] Estilo más claro para el botón de volver
              className="w-full max-w-xs mx-auto bg-transparent border border-white hover:bg-white/20 text-white font-marineBold text-lg py-3 rounded-xl shadow-lg transform active:scale-95"
            >
              Volver al Inicio
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}