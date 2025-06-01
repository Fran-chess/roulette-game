"use client";
import { useGameStore } from "@/store/gameStore";
import { useSessionStore } from "@/store/sessionStore";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { useRef, useEffect } from "react";

export default function PrizeModal() {
  const router = useRouter();
  
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
    
  // [modificación] useEffect para tracking de montaje/desmontaje - más eficiente
  useEffect(() => {
    // [modificación] Copiar la referencia para evitar warning de cleanup
    const componentIdValue = componentId.current;
    console.log(`🎁 PrizeModal [${componentIdValue}]: Componente montado`);
    console.log(`🎁 PrizeModal [${componentIdValue}]: Estado inicial - gameState: ${gameState}, answeredCorrectly: ${answeredCorrectly}`);
    
    return () => {
      // [modificación] Usar variable copiada en cleanup
      console.log(`🎁 PrizeModal [${componentIdValue}]: Componente DESMONTADO`);
    };
  }, [answeredCorrectly, gameState]); // [modificación] Agregar dependencias faltantes

  // [modificación] Logging adicional para debug de cambios de estado
  useEffect(() => {
    if (gameState === 'prize') {
      console.log(`🎁 PrizeModal [${componentId.current}]: Estado 'prize' detectado, answeredCorrectly: ${answeredCorrectly}`);
    }
  }, [gameState, answeredCorrectly]);

  // Normalización del nombre de la imagen (igual que antes)
  const prizeImage = prizeName
    ? `/images/premios/${prizeName.replace(/\s+/g, "-")}.png`
    : null;

  // [modificación] Función para volver a jugar - mantiene el mismo participante y va a la ruleta
  const handlePlayAgain = async () => {
    console.log(`🎁 PrizeModal [${componentId.current}]: handlePlayAgain iniciado`);
    console.log("PrizeModal: Preparando para volver a jugar con el mismo participante...");
    
    // [modificación] Orden optimizado para minimizar re-renders
    console.log(`🎁 PrizeModal [${componentId.current}]: Limpiando currentQuestion`);
    setCurrentQuestion(null);
    
    console.log(`🎁 PrizeModal [${componentId.current}]: Limpiando lastSpinResultIndex`);
    setLastSpinResultIndex(null);
    
    console.log(`🎁 PrizeModal [${componentId.current}]: Limpiando showConfetti`);
    setShowConfetti(false);
    
    // [modificación] Cambiar al estado de ruleta en setTimeout para evitar conflictos
    setTimeout(() => {
      console.log(`🎁 PrizeModal [${componentId.current}]: Estableciendo gameState a 'roulette'`);
      setGameState("roulette");
      
      // [modificación] Resetear prizeFeedback después del cambio de estado
      console.log(`🎁 PrizeModal [${componentId.current}]: Reseteando prizeFeedback`);
      resetPrizeFeedback();
      
      console.log(`🎁 PrizeModal [${componentId.current}]: handlePlayAgain completado`);
    }, 50); // [modificación] Pequeño delay para evitar conflictos de estado
    
    console.log("PrizeModal: Volviendo a la ruleta con el mismo participante");
  };

  // [modificación] Función corregida para volver al inicio - preservar gameSession hasta reset exitoso
  const handleGoHome = async () => {
    console.log(`🎁 PrizeModal [${componentId.current}]: handleGoHome iniciado`);
    console.log("PrizeModal: Preparando para volver al inicio...");
    
    // [modificación] Preservar gameSession ANTES de limpiar para usarlo en el reset
    const sessionForReset = gameSession;
    const sessionState = useSessionStore.getState();
    
    console.log(`🎁 PrizeModal [${componentId.current}]: gameSession preservado para reset:`, sessionForReset);
    console.log(`🎁 PrizeModal [${componentId.current}]: sessionState.currentSession:`, sessionState.currentSession);
    
    // [modificación] Intentar obtener sessionId y adminId de múltiples fuentes
    const sessionId = sessionForReset?.session_id || 
                     sessionForReset?.id || 
                     sessionState.currentSession?.session_id || 
                     sessionState.currentSession?.id;
                     
    const adminId = sessionForReset?.admin_id || 
                   sessionState.currentSession?.admin_id || 
                   sessionState.user?.id;
    
    console.log(`🎁 PrizeModal [${componentId.current}]: sessionId encontrado: ${sessionId}`);
    console.log(`🎁 PrizeModal [${componentId.current}]: adminId encontrado: ${adminId}`);
    
    // [modificación] Solo proceder con reset si tenemos sessionId
    if (sessionId) {
      console.log(`PrizeModal: Reseteando sesión en el backend para: ${sessionId}`);
      
      try {
        // [modificación] Usar adminId más robusto o fallback a 'system_reset'
        const finalAdminId = adminId || 'system_reset';
        
        console.log(`🎁 PrizeModal [${componentId.current}]: Usando adminId para reset: ${finalAdminId}`);
        console.log(`🎁 PrizeModal [${componentId.current}]: Reseteando sesión para próximo participante...`);
        
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
            console.log('🎁 PrizeModal: Reintentando reset con sessionId directo...');
            
            // [modificación] Estrategia 1: Usar el adminId original de la sesión
            if (sessionForReset?.admin_id && sessionForReset.admin_id !== finalAdminId) {
              console.log(`🎁 PrizeModal: Reintentando con adminId original: ${sessionForReset.admin_id}`);
              
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
                console.log('🎁 PrizeModal: Sesión reseteada exitosamente con adminId original');
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
          console.log('🎁 PrizeModal: Sesión reseteada exitosamente - lista para próximo participante');
        }
        
        // [modificación] Solo limpiar estados DESPUÉS del reset exitoso
        console.log(`🎁 PrizeModal [${componentId.current}]: Reset exitoso, limpiando estados locales...`);
        
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
    console.log(`🎁 PrizeModal [${componentId.current}]: Limpiando estados locales...`);
    
    setCurrentParticipant(null);
    setCurrentQuestion(null);
    setLastSpinResultIndex(null);
    setShowConfetti(false);
    resetPrizeFeedback();
    
    // [modificación] Verificar si estamos en contexto de TV
    const isTV = window.location.pathname.includes('/tv');
    
    if (isTV) {
      console.log('PrizeModal: Estamos en TV, limpiando sesiones para volver a WaitingScreen');
      // [modificación] En TV, limpiar tanto gameStore como sessionStore - TVScreen manejará el estado
      setGameSession(null);
      setCurrentSession(null);
      // [modificación] No establecer gameState a 'screensaver' - dejar que TVScreen maneje el estado
    } else {
      console.log(`PrizeModal: Redirigiendo a pantalla de espera de TV`);
      // [modificación] En tablet/admin, limpiar AMBOS stores y navegar
      setGameSession(null); // Limpiar gameStore
      setCurrentSession(null); // Limpiar sessionStore para el TVScreen
      console.log("PrizeModal: Estados de sesión limpiados completamente");
      
      // [modificación] Navegar a la pantalla de espera de TV en lugar del formulario de registro
      router.push(`/tv`);
    }
    
    console.log(`🎁 PrizeModal [${componentId.current}]: handleGoHome completado exitosamente`);
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
  const modalBaseClasses =
    "w-full max-w-md mx-auto p-6 md:p-10 rounded-2xl shadow-2xl text-center";

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

            <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
              <Button
                onClick={handlePlayAgain}
                variant="primary"
                className="
                  w-full text-white font-marineBold text-lg py-3 rounded-xl
                  shadow-2xl border-2 border-celeste-medio
                  bg-gradient-to-r from-azul-intenso via-celeste-medio to-verde-salud
                  transition-all duration-200
                  hover:scale-105 hover:shadow-[0_0_25px_8px_rgba(20,220,180,0.35)]
                  active:scale-95
                  focus:outline-none focus:ring-4 focus:ring-celeste-medio/40
                "
              >
                Volver a jugar
              </Button>
              
              <Button
                onClick={handleGoHome}
                variant="secondary"
                className="
                  w-full bg-black/10 border border-white/30 hover:bg-black/20 hover:border-white/50 
                  text-white font-marineBold text-lg py-3 rounded-xl shadow-lg 
                  transform active:scale-95 transition-all duration-300
                "
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

            <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
              <Button
                onClick={handlePlayAgain}
                variant="primary"
                className="
                  w-full text-white font-marineBold text-lg py-3 rounded-xl
                  shadow-2xl border-2 border-celeste-medio
                  bg-gradient-to-r from-azul-intenso via-celeste-medio to-verde-salud
                  transition-all duration-200
                  hover:scale-105 hover:shadow-[0_0_25px_8px_rgba(20,220,180,0.35)]
                  active:scale-95
                  focus:outline-none focus:ring-4 focus:ring-celeste-medio/40
                "
              >
                Volver a jugar
              </Button>
              
              <Button
                onClick={handleGoHome}
                variant="secondary"
                className="
                  w-full bg-black/10 border border-white/30 hover:bg-black/20 hover:border-white/50 
                  text-white font-marineBold text-lg py-3 rounded-xl shadow-lg 
                  transform active:scale-95 transition-all duration-300
                "
              >
                Volver al inicio
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
