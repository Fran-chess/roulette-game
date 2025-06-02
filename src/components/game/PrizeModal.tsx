"use client";
import { useGameStore } from "@/store/gameStore";
import { useSessionStore } from "@/store/sessionStore";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { useRef, useEffect, useState, useMemo } from "react";

export default function PrizeModal() {
  const router = useRouter();
  
  // [modificación] Estados para detección de tipo de pantalla
  const [isTablet, setIsTablet] = useState(false);
  const [isTVTouch, setIsTVTouch] = useState(false);
  const [isTV65, setIsTV65] = useState(false);
  
  // [modificación] ID único para tracking de logs
  const componentId = useRef(`PrizeModal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  const setGameState = useGameStore((state) => state.setGameState);
  const currentParticipant = useGameStore((state) => state.currentParticipant);
  const setCurrentParticipant = useGameStore((state) => state.setCurrentParticipant);
  const prizeFeedback = useGameStore((state) => state.prizeFeedback);
  const resetPrizeFeedback = useGameStore((state) => state.resetPrizeFeedback);
  const setGameSession = useGameStore((state) => state.setGameSession);
  const setCurrentQuestion = useGameStore((state) => state.setCurrentQuestion);
  const setLastSpinResultIndex = useGameStore((state) => state.setLastSpinResultIndex);
  const setShowConfetti = useGameStore((state) => state.setShowConfetti);
  const gameSession = useGameStore((state) => state.gameSession);
  const gameState = useGameStore((state) => state.gameState);

  const { setCurrentSession } = useSessionStore();

  const { answeredCorrectly, explanation, correctOption, prizeName } =
    prizeFeedback;

  // [modificación] useEffect para detección de tipo de pantalla
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Detectar 2160×3840 (TV 65") tanto en vertical como horizontal
      const isTV65Resolution =
        (width >= 2160 && height >= 3840) || (width >= 3840 && height >= 2160);

      setIsTV65(isTV65Resolution);
      setIsTablet(width >= 601 && width <= 1024 && !isTV65Resolution);
      setIsTVTouch(width >= 1025 && !isTV65Resolution);

// //       console.log(`📱 PrizeModal: Resolución detectada: ${width}x${height}, TV65: ${isTV65Resolution}`);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // [modificación] Estilos responsivos basados en tipo de pantalla
  const modalContainerClasses = useMemo(() => {
    if (isTV65) {
      return "w-full max-w-7xl mx-auto p-20 rounded-4xl shadow-3xl text-center bg-black/15 backdrop-blur-xl border-4 border-white/60";
    } else if (isTVTouch) {
      return "w-full max-w-3xl mx-auto p-12 rounded-2xl shadow-2xl text-center bg-black/10 backdrop-blur-sm border border-white/30";
    } else if (isTablet) {
      return "w-full max-w-2xl mx-auto p-8 rounded-2xl shadow-2xl text-center bg-black/10 backdrop-blur-sm border border-white/30";
    }
    return "w-full max-w-md mx-auto p-6 md:p-10 rounded-2xl shadow-2xl text-center bg-black/10 backdrop-blur-sm border border-white/30";
  }, [isTV65, isTVTouch, isTablet]);

  const iconClasses = useMemo(() => {
    if (isTV65) {
      return "w-32 h-32 mx-auto mb-8";
    } else if (isTVTouch) {
      return "w-24 h-24 mx-auto mb-6";
    } else if (isTablet) {
      return "w-20 h-20 mx-auto mb-5";
    }
    return "w-16 h-16 mx-auto mb-4";
  }, [isTV65, isTVTouch, isTablet]);

  const titleClasses = useMemo(() => {
    const baseClasses = "font-marineBlack text-white mb-6 leading-tight drop-shadow-2xl";
    
    if (isTV65) {
      return `${baseClasses} text-[10rem] font-extrabold mb-12 text-shadow-ultra-strong`;
    } else if (isTVTouch) {
      return `${baseClasses} text-[5rem] lg:text-[6rem] mb-8`;
    } else if (isTablet) {
      return `${baseClasses} text-[3.5rem] lg:text-[4.5rem] mb-6`;
    }
    return `${baseClasses} text-3xl md:text-4xl`;
  }, [isTV65, isTVTouch, isTablet]);

  const subtitleClasses = useMemo(() => {
    const baseClasses = "text-white font-marineRegular leading-relaxed";
    
    if (isTV65) {
      return `${baseClasses} text-[6rem] mb-12 text-shadow-strong`;
    } else if (isTVTouch) {
      return `${baseClasses} text-[3rem] lg:text-[3.5rem] mb-8`;
    } else if (isTablet) {
      return `${baseClasses} text-[2.5rem] lg:text-[3rem] mb-6`;
    }
    return `${baseClasses} text-xl mb-4`;
  }, [isTV65, isTVTouch, isTablet]);

  const explanationContainerClasses = useMemo(() => {
    const baseClasses = "bg-black/10 p-4 rounded-lg border text-white";
    
    if (isTV65) {
      return `${baseClasses} p-16 rounded-2xl border-4 border-red-400/40 my-12`;
    } else if (isTVTouch) {
      return `${baseClasses} p-10 rounded-xl border-2 border-red-400/35 my-8`;
    } else if (isTablet) {
      return `${baseClasses} p-6 rounded-lg border-2 border-red-400/30 my-6`;
    }
    return `${baseClasses} border-red-400/30 my-4`;
  }, [isTV65, isTVTouch, isTablet]);

  const explanationTextClasses = useMemo(() => {
    const baseClasses = "font-marineBold";
    
    if (isTV65) {
      return `${baseClasses} text-[5rem] mb-4 text-shadow-strong`;
    } else if (isTVTouch) {
      return `${baseClasses} text-[2.5rem] lg:text-[3rem] mb-3`;
    } else if (isTablet) {
      return `${baseClasses} text-[1.8rem] lg:text-[2.2rem] mb-2`;
    }
    return `${baseClasses} text-lg mb-1`;
  }, [isTV65, isTVTouch, isTablet]);

  const correctAnswerClasses = useMemo(() => {
    const baseClasses = "font-marineBold text-verde-salud";
    
    if (isTV65) {
      return `${baseClasses} text-[5.5rem] mb-8 text-shadow-strong`;
    } else if (isTVTouch) {
      return `${baseClasses} text-[2.6rem] lg:text-[3.2rem] mb-4`;
    } else if (isTablet) {
      return `${baseClasses} text-[2.1rem] lg:text-[2.5rem] mb-3`;
    }
    return `${baseClasses} text-xl mb-2`;
  }, [isTV65, isTVTouch, isTablet]);

  const explanationDetailClasses = useMemo(() => {
    const baseClasses = "text-white/90";
    
    if (isTV65) {
      return `${baseClasses} text-[4.2rem] leading-relaxed text-shadow-soft`;
    } else if (isTVTouch) {
      return `${baseClasses} text-[2.1rem] lg:text-[2.5rem] leading-relaxed`;
    } else if (isTablet) {
      return `${baseClasses} text-[1.6rem] lg:text-[2rem] leading-relaxed`;
    }
    return `${baseClasses} text-lg`;
  }, [isTV65, isTVTouch, isTablet]);

  const prizeNameClasses = useMemo(() => {
    const baseClasses = "font-marineBold text-white";
    
    if (isTV65) {
      return `${baseClasses} text-[7rem] mb-12 text-shadow-strong`;
    } else if (isTVTouch) {
      return `${baseClasses} text-[3.5rem] lg:text-[4rem] mb-8`;
    } else if (isTablet) {
      return `${baseClasses} text-[3rem] lg:text-[3.5rem] mb-6`;
    }
    return `${baseClasses} text-2xl md:text-3xl mb-5`;
  }, [isTV65, isTVTouch, isTablet]);

  const prizeInstructionsClasses = useMemo(() => {
    const baseClasses = "bg-black/5 border border-white/30 text-white p-4 rounded-xl mt-4 mb-8 font-marineRegular shadow-md";
    
    if (isTV65) {
      return `${baseClasses} p-16 rounded-2xl mt-12 mb-16 text-[4.2rem] leading-relaxed text-shadow-soft`;
    } else if (isTVTouch) {
      return `${baseClasses} p-10 rounded-xl mt-8 mb-12 text-[2.1rem] lg:text-[2.5rem] leading-relaxed`;
    } else if (isTablet) {
      return `${baseClasses} p-6 rounded-lg mt-6 mb-10 text-[1.6rem] lg:text-[2rem] leading-relaxed`;
    }
    return `${baseClasses} text-base md:text-lg`;
  }, [isTV65, isTVTouch, isTablet]);

  const buttonContainerClasses = useMemo(() => {
    if (isTV65) {
      return "flex flex-col gap-8 w-full max-w-4xl mx-auto";
    } else if (isTVTouch) {
      return "flex flex-col gap-6 w-full max-w-2xl mx-auto";
    } else if (isTablet) {
      return "flex flex-col gap-4 w-full max-w-xl mx-auto";
    }
    return "flex flex-col gap-3 w-full max-w-xs mx-auto";
  }, [isTV65, isTVTouch, isTablet]);

  const buttonClasses = useMemo(() => {
    const baseClasses = "w-full font-marineBold rounded-xl shadow-2xl border-2 border-celeste-medio bg-gradient-to-r from-azul-intenso via-celeste-medio to-verde-salud transition-all duration-200 hover:scale-105 hover:shadow-[0_0_25px_8px_rgba(20,220,180,0.35)] active:scale-95 focus:outline-none focus:ring-4 focus:ring-celeste-medio/40";
    
    if (isTV65) {
      return `${baseClasses} text-[4.8rem] py-12 px-16 rounded-2xl border-4 text-shadow-strong`;
    } else if (isTVTouch) {
      return `${baseClasses} text-[2.6rem] lg:text-[3.2rem] py-8 px-12`;
    } else if (isTablet) {
      return `${baseClasses} text-[2.1rem] lg:text-[2.5rem] py-6 px-10`;
    }
    return `${baseClasses} text-xl py-3`;
  }, [isTV65, isTVTouch, isTablet]);

  const secondaryButtonClasses = useMemo(() => {
    const baseClasses = "w-full bg-black/10 border border-white/30 hover:bg-black/20 hover:border-white/50 text-white font-marineBold rounded-xl shadow-lg transform active:scale-95 transition-all duration-300";
    
    if (isTV65) {
      return `${baseClasses} text-[4.8rem] py-12 px-16 rounded-2xl border-4 text-shadow-soft`;
    } else if (isTVTouch) {
      return `${baseClasses} text-[2.6rem] lg:text-[3.2rem] py-8 px-12`;
    } else if (isTablet) {
      return `${baseClasses} text-[2.1rem] lg:text-[2.5rem] py-6 px-10`;
    }
    return `${baseClasses} text-xl py-3`;
  }, [isTV65, isTVTouch, isTablet]);

  const prizeImageClasses = useMemo(() => {
    if (isTV65) {
      return "w-96 h-96 object-contain rounded-2xl shadow-md bg-black/15 p-8 border-4 border-white/40";
    } else if (isTVTouch) {
      return "w-60 h-60 object-contain rounded-xl shadow-md bg-black/15 p-6 border-2 border-white/35";
    } else if (isTablet) {
      return "w-48 h-48 object-contain rounded-lg shadow-md bg-black/15 p-4 border-2 border-white/30";
    }
    return "w-[120px] h-[120px] object-contain rounded-lg shadow-md bg-black/15 p-2 border border-white/30";
  }, [isTV65, isTVTouch, isTablet]);
    
  // [modificación] useEffect para tracking de montaje/desmontaje - más eficiente
  useEffect(() => {
    // [modificación] Copiar la referencia para evitar warning de cleanup
    const componentIdValue = componentId.current;
    void componentIdValue;
// //     console.log(`🎁 PrizeModal [${componentIdValue}]: Componente montado`);
// //     console.log(`🎁 PrizeModal [${componentIdValue}]: Estado inicial - gameState: ${gameState}, answeredCorrectly: ${answeredCorrectly}`);
    
    return () => {
      // [modificación] Usar variable copiada en cleanup
// //       console.log(`🎁 PrizeModal [${componentIdValue}]: Componente DESMONTADO`);
    };
  }, [answeredCorrectly, gameState]); // [modificación] Agregar dependencias faltantes

  // [modificación] Logging adicional para debug de cambios de estado
  useEffect(() => {
    if (gameState === 'prize') {
// //       console.log(`🎁 PrizeModal [${componentId.current}]: Estado 'prize' detectado, answeredCorrectly: ${answeredCorrectly}`);
    }
  }, [gameState, answeredCorrectly]);

  // Normalización del nombre de la imagen (igual que antes)
  const prizeImage = prizeName
    ? `/images/premios/${prizeName.replace(/\s+/g, "-")}.png`
    : null;

  // [modificación] Función para volver a jugar - mantiene el mismo participante y va a la ruleta
  const handlePlayAgain = async () => {
// //     console.log(`🎁 PrizeModal [${componentId.current}]: handlePlayAgain iniciado`);
// //     console.log("PrizeModal: Preparando para volver a jugar con el mismo participante...");
    
    // [modificación] Orden optimizado para minimizar re-renders
// //     console.log(`🎁 PrizeModal [${componentId.current}]: Limpiando currentQuestion`);
    setCurrentQuestion(null);
    
// //     console.log(`🎁 PrizeModal [${componentId.current}]: Limpiando lastSpinResultIndex`);
    setLastSpinResultIndex(null);
    
    // [modificación] NO limpiar confetti inmediatamente - dejarlo por más tiempo para una celebración completa
// //     console.log(`🎁 PrizeModal [${componentId.current}]: Confetti se mantendrá por 5 segundos más para celebración completa`);
    setTimeout(() => {
// //       console.log(`🎁 PrizeModal [${componentId.current}]: Limpiando showConfetti después de celebración extendida`);
      setShowConfetti(false);
    }, 5000); // [modificación] - Extendido a 5 segundos para una celebración más larga
    
    // [modificación] Cambiar al estado de ruleta en setTimeout para evitar conflictos
    setTimeout(() => {
// //       console.log(`🎁 PrizeModal [${componentId.current}]: Estableciendo gameState a 'roulette'`);
      setGameState("roulette");
      
      // [modificación] Resetear prizeFeedback después del cambio de estado
// //       console.log(`🎁 PrizeModal [${componentId.current}]: Reseteando prizeFeedback`);
      resetPrizeFeedback();
      
// //       console.log(`🎁 PrizeModal [${componentId.current}]: handlePlayAgain completado`);
    }, 50); // [modificación] Pequeño delay para evitar conflictos de estado
    
// //     console.log("PrizeModal: Volviendo a la ruleta con el mismo participante");
  };

  // [modificación] Función corregida para volver al inicio - preservar gameSession hasta reset exitoso
  const handleGoHome = async () => {
// //     console.log(`🎁 PrizeModal [${componentId.current}]: handleGoHome iniciado`);
// //     console.log("PrizeModal: Preparando para volver al inicio...");
    
    // [modificación] Preservar gameSession ANTES de limpiar para usarlo en el reset
    const sessionForReset = gameSession;
    const sessionState = useSessionStore.getState();
    
// //     console.log(`🎁 PrizeModal [${componentId.current}]: gameSession preservado para reset:`, sessionForReset);
// //     console.log(`🎁 PrizeModal [${componentId.current}]: sessionState.currentSession:`, sessionState.currentSession);
    
    // [modificación] Intentar obtener sessionId y adminId de múltiples fuentes
    const sessionId = sessionForReset?.session_id || 
                     sessionForReset?.id || 
                     sessionState.currentSession?.session_id || 
                     sessionState.currentSession?.id;
                     
    const adminId = sessionForReset?.admin_id || 
                   sessionState.currentSession?.admin_id || 
                   sessionState.user?.id;
    
// //     console.log(`🎁 PrizeModal [${componentId.current}]: sessionId encontrado: ${sessionId}`);
// //     console.log(`🎁 PrizeModal [${componentId.current}]: adminId encontrado: ${adminId}`);
    
    // [modificación] Solo proceder con reset si tenemos sessionId
    if (sessionId) {
// //       console.log(`PrizeModal: Reseteando sesión en el backend para: ${sessionId}`);
      
      try {
        // [modificación] Usar adminId más robusto o fallback a 'system_reset'
        const finalAdminId = adminId || 'system_reset';
        
// //         console.log(`🎁 PrizeModal [${componentId.current}]: Usando adminId para reset: ${finalAdminId}`);
// //         console.log(`🎁 PrizeModal [${componentId.current}]: Reseteando sesión para próximo participante...`);
        
        const resetResponse = await fetch('/api/admin/sessions/reset-player', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            sessionId,
            adminId: finalAdminId
          }),
        });

        if (!resetResponse.ok) {
          const errorData = await resetResponse.json();
          console.error('🎁 PrizeModal: Error al resetear sesión:', errorData);
          console.error('🎁 PrizeModal: Status:', resetResponse.status);
          console.error('🎁 PrizeModal: Error message:', errorData.message);
          
          // [modificación] En caso de error, intentar con diferentes estrategias
          if (resetResponse.status === 500) {
// //             console.log('🎁 PrizeModal: Reintentando reset con sessionId directo...');
            
            // [modificación] Estrategia 1: Usar el adminId original de la sesión
            if (sessionForReset?.admin_id && sessionForReset.admin_id !== finalAdminId) {
// //               console.log(`🎁 PrizeModal: Reintentando con adminId original: ${sessionForReset.admin_id}`);
              
              const retryResponse = await fetch('/api/admin/sessions/reset-player', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                  sessionId,
                  adminId: sessionForReset.admin_id
                }),
              });
              
              if (retryResponse.ok) {
// //                 console.log('🎁 PrizeModal: Sesión reseteada exitosamente con adminId original');
              } else {
                const retryErrorData = await retryResponse.json();
                console.error('🎁 PrizeModal: Error en retry con adminId original:', retryErrorData);
                throw new Error(`Error en reset: ${retryErrorData.message}`);
              }
            } else {
              throw new Error(`Error en reset: ${errorData.message}`);
            }
          } else {
            throw new Error(`Error en reset: ${errorData.message}`);
          }
        } else {
// //           console.log('🎁 PrizeModal: Sesión reseteada exitosamente - lista para próximo participante');
        }
        
        // [modificación] Solo limpiar estados DESPUÉS del reset exitoso
// //         console.log(`🎁 PrizeModal [${componentId.current}]: Reset exitoso, limpiando estados locales...`);
        
      } catch (error) {
        console.error('🎁 PrizeModal: Error crítico al resetear sesión:', error);
        
        // [modificación] En caso de error crítico, mostrar mensaje al usuario pero NO limpiar estados
        alert(`Error al resetear la sesión: ${error}. La sesión puede seguir activa. Contacte al administrador.`);
        return; // [modificación] Salir sin limpiar estados si el reset falló
      }
      
    } else {
      console.warn("PrizeModal: No hay sessionId disponible para reset, procediendo con limpieza local únicamente");
    }
    
    // [modificación] Limpiar estados locales solo DESPUÉS de reset exitoso o si no hay sessionId
// //     console.log(`🎁 PrizeModal [${componentId.current}]: Limpiando estados locales...`);
    
    setCurrentParticipant(null);
    setCurrentQuestion(null);
    setLastSpinResultIndex(null);
    // [modificación] NO limpiar confetti inmediatamente también en handleGoHome - permitir celebración completa
// //     console.log(`🎁 PrizeModal [${componentId.current}]: Confetti se mantendrá por 3 segundos más antes de ir al inicio`);
    setTimeout(() => {
// //       console.log(`🎁 PrizeModal [${componentId.current}]: Limpiando showConfetti antes de ir al inicio`);
      setShowConfetti(false);
    }, 3000); // [modificación] - 3 segundos de delay también para handleGoHome
    resetPrizeFeedback();
    
    // [modificación] Verificar si estamos en contexto de TV
    const isTV = window.location.pathname.includes('/tv');
    
    if (isTV) {
// //       console.log('PrizeModal: Estamos en TV, limpiando sesiones para volver a WaitingScreen');
      // [modificación] En TV, limpiar tanto gameStore como sessionStore - TVScreen manejará el estado
      setGameSession(null);
      setCurrentSession(null);
      // [modificación] No establecer gameState a 'screensaver' - dejar que TVScreen maneje el estado
    } else {
// //       console.log(`PrizeModal: Redirigiendo a pantalla de espera de TV`);
      // [modificación] En tablet/admin, limpiar AMBOS stores y navegar
      setGameSession(null); // Limpiar gameStore
      setCurrentSession(null); // Limpiar sessionStore para el TVScreen
// //       console.log("PrizeModal: Estados de sesión limpiados completamente");
      
      // [modificación] Navegar a la pantalla de espera de TV en lugar del formulario de registro
      router.push(`/tv`);
    }
    
// //     console.log(`🎁 PrizeModal [${componentId.current}]: handleGoHome completado exitosamente`);
  };

  // [modificación] Verificación más estricta para evitar renders innecesarios
  if (gameState !== "prize" || answeredCorrectly === null || typeof answeredCorrectly === 'undefined') {
    // [modificación] Si gameState es 'prize' pero answeredCorrectly es null, hay estado inconsistente - resetear
    if (gameState === "prize" && (answeredCorrectly === null || typeof answeredCorrectly === 'undefined')) {
      console.warn(`🎁 PrizeModal: Estado inconsistente detectado (gameState: prize, answeredCorrectly: ${answeredCorrectly}) - reseteando a roulette`);
      // Reset automático para evitar loops
      setTimeout(() => {
        setGameState('roulette');
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
  // [modificación] Remover modalBaseClasses estático - ahora se usa modalContainerClasses dinámico
  
  return (
    <motion.div
      key={`prizeModal-${currentParticipant?.id || 'anonymous'}`}
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
            <h2 className={titleClasses}>
              ¡Respuesta Incorrecta!
            </h2>

            <div className={explanationContainerClasses}>
              <p className={explanationTextClasses}>Respuesta correcta:</p>
              <p className={correctAnswerClasses}>
                {correctOption}
              </p>
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
              ¡Felicitaciones {currentParticipant?.nombre}!
            </h2>
            <p className={subtitleClasses}>
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
                    // [modificación] Corregir contenedor de imagen de premio
                    className="my-5 flex justify-center"
                  >
                    <Image
                      src={prizeImage}
                      alt={prizeName}
                      // [modificación] Usar tamaños dinámicos basados en tipo de pantalla
                      width={isTV65 ? 384 : isTVTouch ? 240 : isTablet ? 192 : 120}
                      height={isTV65 ? 384 : isTVTouch ? 240 : isTablet ? 192 : 120}
                      className={prizeImageClasses}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </motion.div>
                )}
                <p className={explanationTextClasses}>
                  Has ganado:
                </p>
                <p className={prizeNameClasses}>
                  {prizeName}
                </p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: 0.5, duration: 0.4 },
                  }}
                  className={prizeInstructionsClasses}
                >
                  Por favor, acércate al mostrador principal para retirar tu
                  {/* [modificación] Usar clase correcta para el texto destacado del premio */}
                  premio: <span className="font-marineBold">{prizeName}</span>.
                  ¡Gracias por participar!
                </motion.div>
              </>
            )}

            {!prizeName && (
              <p className={subtitleClasses}>
                ¡Bien hecho! Sigue participando.
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
      
      {/* [modificación] Agregar estilos CSS para sombras de texto */}
      <style jsx global>{`
        .text-shadow-ultra-strong {
          text-shadow: 
            0 6px 12px rgba(0, 0, 0, 1),
            0 12px 24px rgba(0, 0, 0, 0.9),
            0 24px 48px rgba(0, 0, 0, 0.8),
            0 48px 96px rgba(0, 0, 0, 0.6),
            0 0 60px rgba(255, 255, 255, 0.15),
            2px 2px 0 rgba(0, 0, 0, 0.8),
            -2px -2px 0 rgba(0, 0, 0, 0.8);
        }

        .text-shadow-strong {
          text-shadow: 
            0 3px 6px rgba(0, 0, 0, 1),
            0 6px 12px rgba(0, 0, 0, 0.8),
            0 12px 24px rgba(0, 0, 0, 0.6),
            1px 1px 0 rgba(0, 0, 0, 0.9),
            -1px -1px 0 rgba(0, 0, 0, 0.9);
        }

        .text-shadow-soft {
          text-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.8),
            0 4px 8px rgba(0, 0, 0, 0.6),
            1px 1px 0 rgba(0, 0, 0, 0.7);
        }

        .rounded-4xl {
          border-radius: 2.5rem;
        }

        .shadow-3xl {
          box-shadow: 
            0 35px 70px -12px rgba(0, 0, 0, 0.9),
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
            text-shadow: 
              0 8px 16px rgba(0, 0, 0, 1),
              0 16px 32px rgba(0, 0, 0, 0.9),
              0 32px 64px rgba(0, 0, 0, 0.8),
              0 64px 128px rgba(0, 0, 0, 0.6),
              0 0 80px rgba(255, 255, 255, 0.2),
              3px 3px 0 rgba(0, 0, 0, 0.9),
              -3px -3px 0 rgba(0, 0, 0, 0.9);
          }
        }
      `}</style>
    </motion.div>
  );
}
