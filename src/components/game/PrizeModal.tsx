"use client";
import { useGameStore } from "@/store/gameStore";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
// [modificación] Eliminación del import de Image ya que no mostraremos imágenes de premios
// import Image from "next/image";
import {
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import MassiveConfetti from "@/components/ui/MassiveConfetti";


interface PrizeModalProps {
  onGoToScreen?: (screen: 'waiting' | 'roulette' | 'question' | 'prize') => void;
}

export default function PrizeModal({ onGoToScreen }: PrizeModalProps) {
  const params = useParams();
  const sessionIdFromParams = params.sessionId as string;

  // [modificación] Estados para detección de tipo de pantalla
  const [isTablet, setIsTablet] = useState(false);
  const [isTVTouch, setIsTVTouch] = useState(false);
  const [isTV65, setIsTV65] = useState(false);
  const [isTabletPortrait, setIsTabletPortrait] = useState(false); // [NUEVO] Universal para tablets verticales
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });


  const setGameState = useGameStore((state) => state.setGameState);
  const currentParticipant = useGameStore((state) => state.currentParticipant);
  const gameSession = useGameStore((state) => state.gameSession);
  const loadQueueFromDB = useGameStore((state) => state.loadQueueFromDB);
  const prizeFeedback = useGameStore((state) => state.prizeFeedback);
  const resetPrizeFeedback = useGameStore((state) => state.resetPrizeFeedback);
  const setCurrentQuestion = useGameStore((state) => state.setCurrentQuestion);
  const setLastSpinResultIndex = useGameStore(
    (state) => state.setLastSpinResultIndex
  );
  const setShowConfetti = useGameStore((state) => state.setShowConfetti);
  const gameState = useGameStore((state) => state.gameState);
  const showConfetti = useGameStore((state) => state.showConfetti);
  const moveToNext = useGameStore((state) => state.moveToNext);
  const setNextParticipant = useGameStore((state) => state.setNextParticipant);

  const { answeredCorrectly, explanation, correctOption } =
    prizeFeedback;

  // [OPTIMIZADO] useEffect para detección mejorada de tablets modernos
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Detectar 2160×3840 (TV 65") tanto en vertical como horizontal
      const isTV65Resolution =
        (width >= 2160 && height >= 3840) || (width >= 3840 && height >= 2160);

      setIsTV65(isTV65Resolution);
      setIsTVTouch(width >= 1280 && !isTV65Resolution);
      
      // [OPTIMIZADO] Detectar tablets en orientación vertical con mejor rango PRIMERO
      const isTabletPortraitResolution = 
        width >= 600 && width <= 1279 && 
        height > width && // Orientación vertical
        height >= 800 && // Altura mínima optimizada
        !isTV65Resolution;
      setIsTabletPortrait(isTabletPortraitResolution);
      
      // [OPTIMIZADO] Detectar tablets modernos (600px-1279px) DESPUÉS
      const isTabletModern = width >= 600 && width <= 1279 && !isTV65Resolution && !isTabletPortraitResolution;
      setIsTablet(isTabletModern);
      
      setWindowSize({ width, height });

    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // [OPTIMIZADO] Estilos responsivos mejorados para tablets modernos
  const modalContainerClasses = useMemo(() => {
    if (isTV65) {
      return "w-full max-w-7xl mx-auto p-24 rounded-4xl shadow-3xl text-center bg-black/15 backdrop-blur-xl border-4 border-white/60";
    } else if (isTabletPortrait) {
      // [OPTIMIZADO] Más padding para tablets verticales para evitar que el contenido toque los bordes
      return `w-full max-w-2xl mx-auto p-8 rounded-2xl shadow-2xl text-center bg-black/15 backdrop-blur-xl border-2 border-white/40 prize-modal-tablet-modern`;
    } else if (isTVTouch) {
      return "w-full max-w-3xl mx-auto p-16 rounded-2xl shadow-2xl text-center bg-black/10 backdrop-blur-sm border border-white/30";
    } else if (isTablet) {
      // [OPTIMIZADO] Más padding para tablets horizontales para evitar que el contenido toque los bordes
      return "w-full max-w-3xl mx-auto p-12 rounded-2xl shadow-2xl text-center bg-black/12 backdrop-blur-lg border-2 border-white/35 prize-modal-tablet-landscape";
    }
    return "w-full max-w-md mx-auto p-8 md:p-12 rounded-2xl shadow-2xl text-center bg-black/10 backdrop-blur-sm border border-white/30";
  }, [isTV65, isTabletPortrait, isTVTouch, isTablet]);

  const iconClasses = useMemo(() => {
    if (isTV65) {
      return "w-32 h-32 mx-auto mb-8";
    } else if (isTabletPortrait) {
      // [OPTIMIZADO] Tamaño responsive para tablets verticales
      const size = Math.max(20, Math.min(32, windowSize.width * 0.08));
      return `w-${Math.round(size/4)*4} h-${Math.round(size/4)*4} mx-auto mb-6`;
    } else if (isTVTouch) {
      return "w-24 h-24 mx-auto mb-6";
    } else if (isTablet) {
      // [OPTIMIZADO] Tamaño para tablets horizontales
      const size = Math.max(24, Math.min(28, windowSize.width * 0.035));
      return `w-${Math.round(size/4)*4} h-${Math.round(size/4)*4} mx-auto mb-5`;
    }
    return "w-16 h-16 mx-auto mb-4";
  }, [isTV65, isTabletPortrait, isTVTouch, isTablet, windowSize.width]);


  const titleClasses = useMemo(() => {
    const baseClasses =
      "font-marineBlack text-white mb-6 leading-tight drop-shadow-2xl";

    if (isTV65) {
      return `${baseClasses} text-[10rem] font-extrabold mb-12 text-shadow-ultra-strong`;
    } else if (isTabletPortrait) {
      // [OPTIMIZADO] Tamaño responsive para tablets verticales
      return `${baseClasses} font-extrabold mb-4 tablet-title-responsive`;
    } else if (isTVTouch) {
      return `${baseClasses} text-[5rem] lg:text-[6rem] mb-8`;
    } else if (isTablet) {
      // [OPTIMIZADO] Tamaño para tablets horizontales
      return `${baseClasses} font-extrabold mb-6 tablet-landscape-title`;
    }
    return `${baseClasses} text-3xl md:text-4xl`;
  }, [isTV65, isTabletPortrait, isTVTouch, isTablet]);

  // [modificación] Mejorar el tamaño de "¡Respuesta correcta!"
  const correctAnswerTitleClasses = useMemo(() => {
    const baseClasses =
      "text-verde-salud font-marineBlack mb-4 leading-tight drop-shadow-2xl";

    if (isTV65) {
      return `${baseClasses} text-[8rem] font-extrabold mb-10 text-shadow-ultra-strong`;
    } else if (isTabletPortrait) {
      // [NUEVO] Tamaño específico para tablet 800x1340
      return `${baseClasses} text-tablet-800-lg mb-4`;
    } else if (isTVTouch) {
      return `${baseClasses} text-[4.5rem] lg:text-[5rem] mb-6`;
    } else if (isTablet) {
      return `${baseClasses} text-[3rem] lg:text-[3.5rem] mb-4`;
    }
    return `${baseClasses} text-2xl md:text-3xl`;
  }, [isTV65, isTabletPortrait, isTVTouch, isTablet]);

  const subtitleClasses = useMemo(() => {
    const baseClasses = "text-white font-marineRegular leading-relaxed";

    if (isTV65) {
      return `${baseClasses} text-[6rem] mb-12 text-shadow-strong`;
    } else if (isTabletPortrait) {
      // [NUEVO] Tamaño específico para tablet 800x1340
      return `${baseClasses} text-tablet-800-md mb-6`;
    } else if (isTVTouch) {
      return `${baseClasses} text-[3rem] lg:text-[3.5rem] mb-8`;
    } else if (isTablet) {
      return `${baseClasses} text-[2.5rem] lg:text-[3rem] mb-6`;
    }
    return `${baseClasses} text-xl mb-4`;
  }, [isTV65, isTabletPortrait, isTVTouch, isTablet]);

  const explanationContainerClasses = useMemo(() => {
    const baseClasses = "bg-black/10 rounded-lg border text-white mx-4";

    if (isTV65) {
      return `${baseClasses} p-16 rounded-2xl border-4 border-red-400/40 my-12 mx-8`;
    } else if (isTabletPortrait) {
      // [OPTIMIZADO] Más padding y márgenes para tablets verticales
      return `${baseClasses} p-8 rounded-xl border-2 border-red-400/35 my-6 mx-4`;
    } else if (isTVTouch) {
      return `${baseClasses} p-12 rounded-xl border-2 border-red-400/35 my-8 mx-6`;
    } else if (isTablet) {
      return `${baseClasses} p-8 rounded-lg border-2 border-red-400/30 my-6 mx-4`;
    }
    return `${baseClasses} p-6 border-red-400/30 my-4`;
  }, [isTV65, isTabletPortrait, isTVTouch, isTablet]);

  const explanationTextClasses = useMemo(() => {
    const baseClasses = "font-marineBold";

    if (isTV65) {
      return `${baseClasses} text-[5rem] mb-4 text-shadow-strong`;
    } else if (isTabletPortrait) {
      // [NUEVO] Tamaño específico para tablet 800x1340
      return `${baseClasses} text-tablet-800-md mb-2`;
    } else if (isTVTouch) {
      return `${baseClasses} text-[2.5rem] lg:text-[3rem] mb-3`;
    } else if (isTablet) {
      return `${baseClasses} text-[1.8rem] lg:text-[2.2rem] mb-2`;
    }
    return `${baseClasses} text-lg mb-1`;
  }, [isTV65, isTabletPortrait, isTVTouch, isTablet]);

  const correctAnswerClasses = useMemo(() => {
    const baseClasses = "font-marineBold text-verde-salud";

    if (isTV65) {
      return `${baseClasses} text-[5.5rem] mb-8 text-shadow-strong`;
    } else if (isTabletPortrait) {
      // [NUEVO] Tamaño específico para tablet 800x1340
      return `${baseClasses} text-tablet-800-md mb-3`;
    } else if (isTVTouch) {
      return `${baseClasses} text-[2.6rem] lg:text-[3.2rem] mb-4`;
    } else if (isTablet) {
      return `${baseClasses} text-[2.1rem] lg:text-[2.5rem] mb-3`;
    }
    return `${baseClasses} text-xl mb-2`;
  }, [isTV65, isTabletPortrait, isTVTouch, isTablet]);

  const explanationDetailClasses = useMemo(() => {
    const baseClasses = "text-white/90";

    if (isTV65) {
      return `${baseClasses} text-[4.2rem] leading-relaxed text-shadow-soft`;
    } else if (isTabletPortrait) {
      // [NUEVO] Tamaño específico para tablet 800x1340
      return `${baseClasses} text-tablet-800-sm leading-relaxed`;
    } else if (isTVTouch) {
      return `${baseClasses} text-[2.1rem] lg:text-[2.5rem] leading-relaxed`;
    } else if (isTablet) {
      return `${baseClasses} text-[1.6rem] lg:text-[2rem] leading-relaxed`;
    }
    return `${baseClasses} text-lg`;
  }, [isTV65, isTabletPortrait, isTVTouch, isTablet]);

  // Clases para mensaje de felicitaciones
  const congratulationsMessageClasses = useMemo(() => {
    const baseClasses = "font-marineBold text-white mb-6";

    if (isTV65) {
      return `${baseClasses} text-[6rem] mb-8 text-shadow-strong`;
    } else if (isTabletPortrait) {
      return `${baseClasses} text-tablet-800-lg mb-6`;
    } else if (isTVTouch) {
      return `${baseClasses} text-[3rem] lg:text-[3.5rem] mb-6`;
    } else if (isTablet) {
      return `${baseClasses} text-[2.5rem] lg:text-[3rem] mb-6`;
    }
    return `${baseClasses} text-xl md:text-2xl`;
  }, [isTV65, isTabletPortrait, isTVTouch, isTablet]);

  // [modificación] Eliminar prizeInstructionsClasses ya que no mostraremos las instrucciones del mostrador
  // const prizeInstructionsClasses = useMemo(() => {
  //   const baseClasses = "bg-black/5 border border-white/30 text-white p-4 rounded-xl mt-4 mb-8 font-marineRegular shadow-md";
  //
  //   if (isTV65) {
  //     return `${baseClasses} p-16 rounded-2xl mt-12 mb-16 text-[4.2rem] leading-relaxed text-shadow-soft`;
  //   } else if (isTVTouch) {
  //     return `${baseClasses} p-10 rounded-xl mt-8 mb-12 text-[2.1rem] lg:text-[2.5rem] leading-relaxed`;
  //   } else if (isTablet) {
  //     return `${baseClasses} p-6 rounded-lg mt-6 mb-10 text-[1.6rem] lg:text-[2rem] leading-relaxed`;
  //   }
  //   return `${baseClasses} text-base md:text-lg`;
  // }, [isTV65, isTVTouch, isTablet]);

  const buttonContainerClasses = useMemo(() => {
    if (isTV65) {
      return "flex flex-col gap-8 w-full max-w-4xl mx-auto px-4";
    } else if (isTabletPortrait) {
      // [OPTIMIZADO] Más margen lateral para tablets verticales
      return "flex flex-col gap-4 w-full max-w-lg mx-auto px-4";
    } else if (isTVTouch) {
      return "flex flex-col gap-6 w-full max-w-2xl mx-auto px-6";
    } else if (isTablet) {
      return "flex flex-col gap-4 w-full max-w-xl mx-auto px-4";
    }
    return "flex flex-col gap-3 w-full max-w-xs mx-auto px-2";
  }, [isTV65, isTabletPortrait, isTVTouch, isTablet]);

  const buttonClasses = useMemo(() => {
    const baseClasses =
      "w-full font-marineBold rounded-xl shadow-2xl border-2 border-celeste-medio bg-gradient-to-r from-azul-intenso via-celeste-medio to-verde-salud transition-all duration-200 hover:scale-105 hover:shadow-[0_0_25px_8px_rgba(20,220,180,0.35)] active:scale-95 focus:outline-none focus:ring-4 focus:ring-celeste-medio/40";

    if (isTV65) {
      return `${baseClasses} text-[4.8rem] py-12 px-16 rounded-2xl border-4 text-shadow-strong`;
    } else if (isTabletPortrait) {
      // [OPTIMIZADO] Botón responsive para tablets verticales
      return `${baseClasses} rounded-xl border-2 tablet-button-portrait`;
    } else if (isTVTouch) {
      return `${baseClasses} text-[2.6rem] lg:text-[3.2rem] py-8 px-12`;
    } else if (isTablet) {
      // [OPTIMIZADO] Botón para tablets horizontales
      return `${baseClasses} rounded-xl border-3 tablet-button-landscape`;
    }
    return `${baseClasses} text-xl py-3`;
  }, [isTV65, isTabletPortrait, isTVTouch, isTablet]);

  const secondaryButtonClasses = useMemo(() => {
    const baseClasses =
      "w-full bg-black/10 border border-white/30 hover:bg-black/20 hover:border-white/50 text-white font-marineBold rounded-xl shadow-lg transform active:scale-95 transition-all duration-300";

    if (isTV65) {
      return `${baseClasses} text-[4.8rem] py-12 px-16 rounded-2xl border-4 text-shadow-soft`;
    } else if (isTabletPortrait) {
      // [NUEVO] Botón secundario específico para tablets verticales
      return `${baseClasses} text-tablet-portrait-md py-4 px-8 rounded-xl border-2 modal-button`;
    } else if (isTVTouch) {
      return `${baseClasses} text-[2.6rem] lg:text-[3.2rem] py-8 px-12`;
    } else if (isTablet) {
      return `${baseClasses} text-[2.1rem] lg:text-[2.5rem] py-6 px-10`;
    }
    return `${baseClasses} text-xl py-3`;
  }, [isTV65, isTabletPortrait, isTVTouch, isTablet]);

  // Component lifecycle tracking removed for production

  const handlePlayAgain = async () => {
    setCurrentQuestion(null);
    setLastSpinResultIndex(null);
    setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
    setTimeout(() => {
      if (onGoToScreen) {
        onGoToScreen('roulette');
      } else {
        setGameState("inGame");
      }
      resetPrizeFeedback();
    }, 50);
  };

  const handleGoHome = async () => {
    // Finalize current participant first
    if (currentParticipant) {
      try {
        await fetch('/api/participants/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: currentParticipant.id,
            status: 'completed'
          }),
        });
      } catch (error) {
        console.error('Error marcando participante como completado:', error);
      }
    }
    
    setCurrentQuestion(null);
    setLastSpinResultIndex(null);
    resetPrizeFeedback();
    
    setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
    
    // Función para obtener sessionId con múltiples intentos
    const getSessionIdWithRetry = async (maxRetries = 3): Promise<string | null> => {
      // Intento 1: gameSession desde store
      let sessionId = gameSession?.session_id;
      if (sessionId) {
        return sessionId;
      }
      
      // Intento 2: sessionId desde parámetros URL
      sessionId = sessionIdFromParams;
      if (sessionId) {
        return sessionId;
      }
      
      // Intento 3: Obtener sesión activa via API con reintentos
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch('/api/sessions/active', {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.hasActiveSession && data.session?.session_id) {
              const activeSessionId = data.session.session_id;
              
              // Actualizar gameSession en el store para futuros usos
              const { setGameSession } = useGameStore.getState();
              setGameSession(data.session);
              
              return activeSessionId;
            }
          }
        } catch (error) {
          console.error(`Error obteniendo sesión activa (intento ${attempt}):`, error);
        }
        
        // Esperar antes del siguiente intento (excepto en el último)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
      
      return null;
    };
    
    // Obtener sessionId con reintentos
    const sessionId = await getSessionIdWithRetry();
    
    if (sessionId) {
      await loadQueueFromDB(sessionId);
      
      // Obtener cola actualizada después de la recarga
      const { waitingQueue } = useGameStore.getState();
      
      // Check if there are participants in queue
      if (waitingQueue.length > 0) {
        // Set the next participant for the transition screen
        const nextParticipant = waitingQueue[0];
        setNextParticipant(nextParticipant);
        
        // There are participants waiting - show transition and then start next participant
        setGameState('transition');
        // moveToNext will handle the actual transition to the next participant
        setTimeout(async () => {
          await moveToNext();
        }, 2000); // Show transition for 2 seconds
      } else {
        // No participants in queue - go to screensaver/waiting
        await moveToNext(); // This will set gameState to 'screensaver' when queue is empty
      }
    } else {
      console.error('No se pudo obtener sessionId - usando fallback');
      // Fallback: simplemente usar moveToNext para manejar la transición
      await moveToNext();
    }
  };

  // [modificación] Verificación más estricta para evitar renders innecesarios
  if (
    gameState !== "prize" ||
    answeredCorrectly === null ||
    typeof answeredCorrectly === "undefined"
  ) {
    // Si gameState es 'prize' pero answeredCorrectly es null, hay estado inconsistente - resetear
    if (
      gameState === "prize" &&
      (answeredCorrectly === null || typeof answeredCorrectly === "undefined")
    ) {
      // Estado inconsistente detectado - reseteando
      // Reset automático para evitar loops
      setTimeout(() => {
        setGameState("inGame");
        resetPrizeFeedback();
      }, 0);
    }
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
        type: "spring" as const,
        stiffness: 300,
        damping: 25,
        delay: 0.1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 30,
      transition: { 
        duration: 0.2, 
        ease: "easeIn" as const
      },
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
  // [modificación] Remover modalBaseClasses estático - ahora se usa modalContainerClasses dinámico

  return (
    <motion.div
      key={`prizeModal-${currentParticipant?.id || "anonymous"}`}
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
        // [modificación] Usar modalContainerClasses dinámico en lugar de modalBaseClasses estático
        className={`${modalContainerClasses} text-white flex flex-col items-center shadow-lg`}
      >
        {answeredCorrectly === false ? (
          // --- Vista: Respuesta Incorrecta ---
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="w-full"
          >
            <XCircleIcon className={`${iconClasses} text-red-500`} />
            <h2 className={titleClasses}>¡Respuesta Incorrecta!</h2>

            <div className={explanationContainerClasses}>
              <p className={explanationTextClasses}>Respuesta correcta:</p>
              <p className={correctAnswerClasses}>{correctOption}</p>
              {explanation && (
                <p className={explanationDetailClasses}>{explanation}</p>
              )}
            </div>

            <div className={buttonContainerClasses}>
              <Button
                onClick={handlePlayAgain}
                variant="primary"
                className={buttonClasses}
              >
                Volver a jugar
              </Button>

              <Button
                onClick={handleGoHome}
                variant="secondary"
                className={secondaryButtonClasses}
              >
                Volver al inicio
              </Button>
            </div>
          </motion.div>
        ) : (
          // --- Vista: Respuesta Correcta (solo felicitaciones) ---
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="w-full"
          >
            <CheckCircleIcon className={`${iconClasses} text-verde-salud`} />
            <h2 className={titleClasses}>
              ¡Felicitaciones{currentParticipant?.nombre ? ` ${currentParticipant.nombre}` : ''}!
            </h2>
            <h3 className={correctAnswerTitleClasses}>¡Respuesta correcta!</h3>

            {/* Mensaje de felicitaciones */}
            <p className={congratulationsMessageClasses}>
              ¡Excelente trabajo, gracias por acercarte a jugar!
            </p>
            <p className={subtitleClasses}>
              ¡Sigue jugando y divirtiéndote!
            </p>

            <div className={buttonContainerClasses}>
              <Button
                onClick={handlePlayAgain}
                variant="primary"
                className={buttonClasses}
              >
                Volver a jugar
              </Button>

              <Button
                onClick={handleGoHome}
                variant="secondary"
                className={secondaryButtonClasses}
              >
                Volver al inicio
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* [modificación] - Sistema de confetti masivo solo para respuestas correctas */}
      <MassiveConfetti
        show={showConfetti && answeredCorrectly === true}
        windowSize={windowSize}
        isTV65={isTV65}
        isTabletPortrait={isTabletPortrait}
      />

      {/* [modificación] Agregar estilos CSS para sombras de texto */}
      <style jsx global>{`
        .text-shadow-ultra-strong {
          text-shadow: 0 6px 12px rgba(0, 0, 0, 1),
            0 12px 24px rgba(0, 0, 0, 0.9), 0 24px 48px rgba(0, 0, 0, 0.8),
            0 48px 96px rgba(0, 0, 0, 0.6), 0 0 60px rgba(255, 255, 255, 0.15),
            2px 2px 0 rgba(0, 0, 0, 0.8), -2px -2px 0 rgba(0, 0, 0, 0.8);
        }

        .text-shadow-strong {
          text-shadow: 0 3px 6px rgba(0, 0, 0, 1), 0 6px 12px rgba(0, 0, 0, 0.8),
            0 12px 24px rgba(0, 0, 0, 0.6), 1px 1px 0 rgba(0, 0, 0, 0.9),
            -1px -1px 0 rgba(0, 0, 0, 0.9);
        }

        .text-shadow-soft {
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8),
            0 4px 8px rgba(0, 0, 0, 0.6), 1px 1px 0 rgba(0, 0, 0, 0.7);
        }

        .rounded-4xl {
          border-radius: 2.5rem;
        }

        .shadow-3xl {
          box-shadow: 0 35px 70px -12px rgba(0, 0, 0, 0.9),
            0 0 80px rgba(255, 255, 255, 0.25),
            inset 0 3px 6px rgba(255, 255, 255, 0.15);
        }

        /* [modificación] Clases específicas para TV 65" */
        .text-\\[10rem\\] {
          font-size: 10rem !important;
        }

        .text-\\[8rem\\] {
          font-size: 8rem !important;
        }

        .text-\\[7rem\\] {
          font-size: 7rem !important;
        }

        .text-\\[6\\.5rem\\] {
          font-size: 6.5rem !important;
        }

        .text-\\[6rem\\] {
          font-size: 6rem !important;
        }

        .text-\\[5\\.5rem\\] {
          font-size: 5.5rem !important;
        }

        .text-\\[5rem\\] {
          font-size: 5rem !important;
        }

        .text-\\[4\\.8rem\\] {
          font-size: 4.8rem !important;
        }

        .text-\\[4\\.5rem\\] {
          font-size: 4.5rem !important;
        }

        .text-\\[4\\.2rem\\] {
          font-size: 4.2rem !important;
        }

        .text-\\[4rem\\] {
          font-size: 4rem !important;
        }

        .text-\\[3\\.8rem\\] {
          font-size: 3.8rem !important;
        }

        .text-\\[3\\.5rem\\] {
          font-size: 3.5rem !important;
        }

        .text-\\[3\\.2rem\\] {
          font-size: 3.2rem !important;
        }

        .text-\\[3rem\\] {
          font-size: 3rem !important;
        }

        .text-\\[2\\.8rem\\] {
          font-size: 2.8rem !important;
        }

        .text-\\[2\\.6rem\\] {
          font-size: 2.6rem !important;
        }

        .text-\\[2\\.5rem\\] {
          font-size: 2.5rem !important;
        }

        .text-\\[2\\.2rem\\] {
          font-size: 2.2rem !important;
        }

        .text-\\[2\\.1rem\\] {
          font-size: 2.1rem !important;
        }

        .text-\\[2rem\\] {
          font-size: 2rem !important;
        }

        .text-\\[1\\.8rem\\] {
          font-size: 1.8rem !important;
        }

        .text-\\[1\\.6rem\\] {
          font-size: 1.6rem !important;
        }

        .text-\\[1\\.5rem\\] {
          font-size: 1.5rem !important;
        }

        .text-\\[1\\.4rem\\] {
          font-size: 1.4rem !important;
        }

        /* [modificación] Optimizaciones para TV 65" */
        @media (min-width: 2160px) {
          .text-shadow-ultra-strong {
            text-shadow: 0 8px 16px rgba(0, 0, 0, 1),
              0 16px 32px rgba(0, 0, 0, 0.9), 0 32px 64px rgba(0, 0, 0, 0.8),
              0 64px 128px rgba(0, 0, 0, 0.6), 0 0 80px rgba(255, 255, 255, 0.2),
              3px 3px 0 rgba(0, 0, 0, 0.9), -3px -3px 0 rgba(0, 0, 0, 0.9);
          }
        }
      `}</style>
    </motion.div>
  );
}
