"use client";
import { useGameStore } from "@/store/gameStore";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
// [modificación] Eliminación del import de Image ya que no mostraremos imágenes de premios
// import Image from "next/image";
import {
  CheckCircleIcon,
  XCircleIcon,
  // [modificación] Solo dos iconos: trofeo para premios físicos y corazón para agradecimiento
  TrophyIcon,        // Para todos los premios físicos
  HeartIcon,         // Para agradecimiento cuando no hay premio
} from "@heroicons/react/24/solid";
import { useRef, useEffect, useState, useMemo } from "react";
import MassiveConfetti from "@/components/ui/MassiveConfetti";
import { tvLogger } from "@/utils/tvLogger";

// [modificación] Función simplificada para obtener el icono: trofeo para premios, corazón para agradecimiento
const getPrizeIcon = (prizeName: string | undefined) => {
  // Si hay un premio específico, mostrar trofeo
  if (prizeName) {
    return TrophyIcon; // [modificación] Trofeo dorado para todos los premios físicos
  }
  
  // Si no hay premio, mostrar corazón de agradecimiento
  return HeartIcon; // [modificación] HeartIcon para mostrar agradecimiento por jugar
};

interface PrizeModalProps {
  onGoToScreen?: (screen: 'waiting' | 'roulette' | 'question' | 'prize') => void;
}

export default function PrizeModal({ onGoToScreen }: PrizeModalProps) {

  // [modificación] Estados para detección de tipo de pantalla
  const [isTablet, setIsTablet] = useState(false);
  const [isTVTouch, setIsTVTouch] = useState(false);
  const [isTV65, setIsTV65] = useState(false);
  const [isTabletPortrait, setIsTabletPortrait] = useState(false); // [NUEVO] Universal para tablets verticales
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // [modificación] ID único para tracking de logs
  const componentId = useRef(
    `PrizeModal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  const setGameState = useGameStore((state) => state.setGameState);
  const currentParticipant = useGameStore((state) => state.currentParticipant);
  const setCurrentParticipant = useGameStore(
    (state) => state.setCurrentParticipant
  );
  const prizeFeedback = useGameStore((state) => state.prizeFeedback);
  const resetPrizeFeedback = useGameStore((state) => state.resetPrizeFeedback);
  const setCurrentQuestion = useGameStore((state) => state.setCurrentQuestion);
  const setLastSpinResultIndex = useGameStore(
    (state) => state.setLastSpinResultIndex
  );
  const setShowConfetti = useGameStore((state) => state.setShowConfetti);
  const gameSession = useGameStore((state) => state.gameSession);
  const gameState = useGameStore((state) => state.gameState);
  const showConfetti = useGameStore((state) => state.showConfetti);

  const { answeredCorrectly, explanation, correctOption, prizeName } =
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
      return "w-full max-w-7xl mx-auto p-20 rounded-4xl shadow-3xl text-center bg-black/15 backdrop-blur-xl border-4 border-white/60";
    } else if (isTabletPortrait) {
      // [OPTIMIZADO] Estilos responsive para tablets verticales (600px-1279px)
      return `w-full max-w-2xl mx-auto rounded-2xl shadow-2xl text-center bg-black/15 backdrop-blur-xl border-2 border-white/40 prize-modal-tablet-modern`;
    } else if (isTVTouch) {
      return "w-full max-w-3xl mx-auto p-12 rounded-2xl shadow-2xl text-center bg-black/10 backdrop-blur-sm border border-white/30";
    } else if (isTablet) {
      // [OPTIMIZADO] Estilos para tablets horizontales (600px-1279px)
      return "w-full max-w-3xl mx-auto p-10 rounded-2xl shadow-2xl text-center bg-black/12 backdrop-blur-lg border-2 border-white/35 prize-modal-tablet-landscape";
    }
    return "w-full max-w-md mx-auto p-6 md:p-10 rounded-2xl shadow-2xl text-center bg-black/10 backdrop-blur-sm border border-white/30";
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

  // [modificación] Icono específico para el premio
  const prizeIconClasses = useMemo(() => {
    if (isTV65) {
      return "w-40 h-40 mx-auto mb-8";
    } else if (isTabletPortrait) {
      // [NUEVO] Tamaño específico para tablet 800x1340
      return "w-24 h-24 mx-auto mb-6 prize-icon";
    } else if (isTVTouch) {
      return "w-32 h-32 mx-auto mb-6";
    } else if (isTablet) {
      return "w-28 h-28 mx-auto mb-5";
    }
    return "w-20 h-20 mx-auto mb-4";
  }, [isTV65, isTabletPortrait, isTVTouch, isTablet]);

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
    const baseClasses = "bg-black/10 p-4 rounded-lg border text-white";

    if (isTV65) {
      return `${baseClasses} p-16 rounded-2xl border-4 border-red-400/40 my-12`;
    } else if (isTabletPortrait) {
      // [NUEVO] Estilos específicos para tablet 800x1340
      return `${baseClasses} p-6 rounded-xl border-2 border-red-400/35 my-6`;
    } else if (isTVTouch) {
      return `${baseClasses} p-10 rounded-xl border-2 border-red-400/35 my-8`;
    } else if (isTablet) {
      return `${baseClasses} p-6 rounded-lg border-2 border-red-400/30 my-6`;
    }
    return `${baseClasses} border-red-400/30 my-4`;
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

  // [modificación] Mejorar el tamaño de "Has ganado:"
  const hasGanadoClasses = useMemo(() => {
    const baseClasses = "font-marineBold text-white mb-3";

    if (isTV65) {
      return `${baseClasses} text-[6.5rem] mb-8 text-shadow-strong`;
    } else if (isTabletPortrait) {
      // [NUEVO] Tamaño específico para tablet 800x1340
      return `${baseClasses} text-tablet-800-lg mb-4`;
    } else if (isTVTouch) {
      return `${baseClasses} text-[3.2rem] lg:text-[3.8rem] mb-5`;
    } else if (isTablet) {
      return `${baseClasses} text-[2.6rem] lg:text-[3rem] mb-4`;
    }
    return `${baseClasses} text-xl md:text-2xl`;
  }, [isTV65, isTabletPortrait, isTVTouch, isTablet]);

  const prizeNameClasses = useMemo(() => {
    const baseClasses = "font-marineBold text-white";

    if (isTV65) {
      return `${baseClasses} text-[7rem] mb-12 text-shadow-strong`;
    } else if (isTabletPortrait) {
      // [NUEVO] Tamaño específico para tablet 800x1340
      return `${baseClasses} text-tablet-800-xl mb-6`;
    } else if (isTVTouch) {
      return `${baseClasses} text-[3.5rem] lg:text-[4rem] mb-8`;
    } else if (isTablet) {
      return `${baseClasses} text-[3rem] lg:text-[3.5rem] mb-6`;
    }
    return `${baseClasses} text-2xl md:text-3xl mb-5`;
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
      return "flex flex-col gap-8 w-full max-w-4xl mx-auto";
    } else if (isTabletPortrait) {
      // [NUEVO] Contenedor específico para tablet 800x1340
      return "flex flex-col gap-4 w-full max-w-lg mx-auto";
    } else if (isTVTouch) {
      return "flex flex-col gap-6 w-full max-w-2xl mx-auto";
    } else if (isTablet) {
      return "flex flex-col gap-4 w-full max-w-xl mx-auto";
    }
    return "flex flex-col gap-3 w-full max-w-xs mx-auto";
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

  // useEffect para tracking de montaje/desmontaje - usando tvLogger
  useEffect(() => {
    const componentIdValue = componentId.current;
    void componentIdValue;
    tvLogger.debug(`PrizeModal [${componentIdValue}]: Componente montado`);
    tvLogger.debug(`Estado inicial - gameState: ${gameState}, answeredCorrectly: ${answeredCorrectly}`);
    tvLogger.debug(`gameSession disponible: ${!!gameSession}, ID: ${gameSession?.session_id}`);

    return () => {
      tvLogger.debug(`PrizeModal [${componentIdValue}]: Componente DESMONTADO`);
    };
  }, [answeredCorrectly, gameState, gameSession]);

  // Logging adicional para debug de cambios de estado
  useEffect(() => {
    if (gameState === "prize") {
      tvLogger.debug(`Estado 'prize' detectado, answeredCorrectly: ${answeredCorrectly}`);
      tvLogger.debug(`gameSession en estado prize: ${gameSession?.session_id}`);
    }
  }, [gameState, answeredCorrectly, gameSession]);

  const handlePlayAgain = async () => {
    tvLogger.debug(`handlePlayAgain iniciado`);
    tvLogger.info("Preparando para volver a jugar con el mismo participante...");
    tvLogger.debug(`Limpiando currentQuestion`);
    setCurrentQuestion(null);
    tvLogger.debug(`Limpiando lastSpinResultIndex`);
    setLastSpinResultIndex(null);
    tvLogger.debug(`Confetti se mantendrá por 5 segundos más para celebración completa`);
    setTimeout(() => {
      tvLogger.debug(`Limpiando showConfetti después de celebración extendida`);
      setShowConfetti(false);
    }, 5000);
    setTimeout(() => {
      tvLogger.debug(`Estableciendo gameState a 'roulette'`);
      if (onGoToScreen) {
        onGoToScreen('roulette');
      } else {
        setGameState("roulette");
      }
      tvLogger.debug(`Reseteando prizeFeedback`);
      resetPrizeFeedback();
      tvLogger.debug(`handlePlayAgain completado`);
    }, 50);
    tvLogger.info("Volviendo a la ruleta con el mismo participante");
  };

  const handleGoHome = async () => {
    tvLogger.debug(`handleGoHome iniciado - preparando para siguiente participante`);
    tvLogger.info("Preparando para siguiente participante en la misma sesión...");
    // Limpiar solo el estado del participante actual, NO la sesión
    tvLogger.debug("Limpiando estado del participante actual...");
    setCurrentParticipant(null);
    setCurrentQuestion(null);
    setLastSpinResultIndex(null);
    resetPrizeFeedback();
    tvLogger.debug(`Confetti se mantendrá por 3 segundos más antes de ir al inicio`);
    setTimeout(() => {
      tvLogger.debug(`Limpiando showConfetti antes de ir al inicio`);
      setShowConfetti(false);
    }, 3000);
    if (onGoToScreen) {
      onGoToScreen('waiting');
    } else {
      setGameState('screensaver');
    }
    tvLogger.debug(`handleGoHome completado - sesión mantenida activa para siguiente participante`);
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
      tvLogger.warn(`Estado inconsistente detectado (gameState: prize, answeredCorrectly: ${answeredCorrectly}) - reseteando a roulette`);
      // Reset automático para evitar loops
      setTimeout(() => {
        setGameState("roulette");
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
          // --- Vista: Respuesta Correcta (con o sin premio) ---
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

            {prizeName && (
              <>
                {/* [modificación] Mostrar icono específico del premio */}
                {(() => {
                  const PrizeIcon = getPrizeIcon(prizeName);
                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        transition: { delay: 0.3, duration: 0.4 },
                      }}
                      className="mb-6"
                    >
                      <PrizeIcon
                        className={`${prizeIconClasses} ${PrizeIcon === HeartIcon ? 'text-red-400' : 'text-yellow-500'}`}
                      />
                    </motion.div>
                  );
                })()}

                <p className={hasGanadoClasses}>Has ganado:</p>
                <p className={prizeNameClasses}>{prizeName}</p>

                {/* [modificación] Eliminar completamente el texto del mostrador */}
              </>
            )}

            {!prizeName && (
              <p className={subtitleClasses}>
                ¡Excelente! Respuesta correcta. ¡Sigue jugando y divirtiéndote!
              </p>
            )}

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

      {/* [modificación] - Sistema de confetti masivo desde todos los bordes usando componente reutilizable */}
      <MassiveConfetti
        show={showConfetti}
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
