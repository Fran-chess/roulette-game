"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { motion } from "framer-motion";
import RouletteWheel from "@/components/game/RouletteWheel";
import QuestionDisplay from "@/components/game/QuestionDisplay";
import PrizeModal from "@/components/game/PrizeModal";
import GameLayout from "./GameLayout";
import RouletteWheelIcon from "@/components/ui/RouletteWheelIcon";
import { useRouletteButton } from "@/hooks/useRouletteButton";

export default function GamePage() {
  // Params y router
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const router = useRouter();

  // Estado local
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs para evitar requests múltiples
  const loadingSessionRef = useRef(false);
  const loadingQuestionsRef = useRef(false);

  // Zustand (GameStore)
  const gameState = useGameStore((state) => state.gameState);
  const setGameState = useGameStore((state) => state.setGameState);
  const currentParticipant = useGameStore((state) => state.currentParticipant);
  const lastSpinResultIndex = useGameStore(
    (state) => state.lastSpinResultIndex
  );
  const setCurrentQuestion = useGameStore((state) => state.setCurrentQuestion);
  const setGameSession = useGameStore((state) => state.setGameSession);
  const questions = useGameStore((state) => state.questions);
  const setQuestions = useGameStore((state) => state.setQuestions);
  const gameSession = useGameStore((state) => state.gameSession);
  const currentQuestion = useGameStore((state) => state.currentQuestion);
  
  // Refs para funciones para evitar dependencias en useEffect (después de declarar las funciones)
  const setGameSessionRef = useRef(setGameSession);
  const setQuestionsRef = useRef(setQuestions);
  const setGameStateRef = useRef(setGameState);
  const setCurrentQuestionRef = useRef(setCurrentQuestion);
  const questionsRef = useRef(questions);

  // [modificación] Redirección global envuelta en useCallback para estabilizar referencia
  const handleRedirect = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  // Actualizar refs cuando cambien las funciones
  useEffect(() => {
    setGameSessionRef.current = setGameSession;
    setQuestionsRef.current = setQuestions;
    setGameStateRef.current = setGameState;
    setCurrentQuestionRef.current = setCurrentQuestion;
    questionsRef.current = questions;
  }, [setGameSession, setQuestions, setGameState, setCurrentQuestion, questions]);

  // Efecto de carga de sesión y preguntas
  useEffect(() => {
    if (!sessionId) {
      setError("ID de sesión no proporcionado");
      setIsLoading(false);
      return;
    }
    if (loadingSessionRef.current) return;

    const loadSessionData = async () => {
      try {
        loadingSessionRef.current = true;
        const sessionResponse = await fetch(
          `/api/session/verify?sessionId=${sessionId}`
        );
        const sessionData = await sessionResponse.json();

        if (!sessionResponse.ok)
          throw new Error(sessionData.message || "Error al verificar sesión");
        if (!sessionData.data)
          throw new Error("Datos de sesión no disponibles");

        const session = sessionData.data;
        setGameSessionRef.current(session);

        if (!session.nombre || !session.email) {
          handleRedirect(`/register/${sessionId}`);
          return;
        }

        // [modificación] Actualizar estado a 'playing' si no está ya en ese estado
        if (session.status !== 'playing') {
// //           console.log(`Actualizando estado de sesión ${sessionId} a 'playing' desde el juego`);
          try {
            const updateResponse = await fetch('/api/admin/sessions/update-status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sessionId: sessionId,
                status: 'playing'
              }),
            });

            if (updateResponse.ok) {
// //               console.log(`Estado de sesión ${sessionId} actualizado exitosamente a 'playing'`);
            } else {
              console.warn(`No se pudo actualizar el estado de la sesión ${sessionId} a 'playing'`);
            }
          } catch (updateError) {
            console.warn('Error al actualizar estado de sesión:', updateError);
          }
        }

        if (
          !loadingQuestionsRef.current &&
          (!questionsRef.current || questionsRef.current.length === 0)
        ) {
          await loadQuestions();
        }
        
        // ⚠️ SOLUCIONADO: Solo cambiar gameState en la carga inicial, no en cada render
        const currentGameState = useGameStore.getState().gameState;
        if (currentGameState === "screensaver" || currentGameState === "register") {
          console.log(`[GamePage] Carga inicial: Cambiando gameState de '${currentGameState}' a 'roulette'`);
          setGameStateRef.current("roulette");
        }
      } catch (error: Error | unknown) {
        setError(error instanceof Error ? error.message : "Error al cargar el juego");
      } finally {
        setIsLoading(false);
        setTimeout(() => {
          loadingSessionRef.current = false;
        }, 500);
      }
    };

    const loadQuestions = async () => {
      try {
        loadingQuestionsRef.current = true;
        const questionsResponse = await fetch("/api/questions");
        if (!questionsResponse.ok) throw new Error("Error al cargar preguntas");
        const questionsData = await questionsResponse.json();
        setQuestionsRef.current(questionsData.questions || []);
      } finally {
        setTimeout(() => {
          loadingQuestionsRef.current = false;
        }, 500);
      }
    };

    loadSessionData();
  }, [
    sessionId,
    // ⚠️ REMOVIDO: setGameSession, setQuestions, setGameState y gameState para evitar ciclo infinito
    // Este efecto solo debe ejecutarse cuando cambie sessionId (carga inicial)
    handleRedirect,
  ]);

  // Al girar la ruleta, mostrar la pregunta correspondiente
  useEffect(() => {
    // [modificación] Log para rastrear el estado del juego y el índice del resultado del giro
// //     console.log("[GamePage] useEffect for lastSpinResultIndex triggered. lastSpinResultIndex:", lastSpinResultIndex, "questions.length:", questions.length);
    if (lastSpinResultIndex !== null && questionsRef.current && questionsRef.current.length > 0) {
      const indexToUse = lastSpinResultIndex;
      // [modificación] Log para rastrear el índice a usar
// //       console.log("[GamePage] Valid conditions met. indexToUse:", indexToUse);
      if (indexToUse >= 0 && indexToUse < questionsRef.current.length) {
        const questionToSet = questionsRef.current[indexToUse];
        // [modificación] Log para rastrear la pregunta a establecer
// //         console.log("[GamePage] Setting current question:", questionToSet);
        setCurrentQuestionRef.current(questionToSet);
        // [modificación] Log para rastrear el cambio de estado del juego
// //         console.log("[GamePage] Setting gameState to 'question'");
        setGameStateRef.current("question");
      } else {
        // [modificación] Advertencia si el índice está fuera de los límites
        console.warn("[GamePage] lastSpinResultIndex is out of bounds:", indexToUse, "questionsRef.current.length:", questionsRef.current.length);
      }
    }
  }, [lastSpinResultIndex]); // ⚠️ SOLUCIONADO: Removido questions, setCurrentQuestion y setGameState para evitar ciclos infinitos

  // Referencia al componente de la ruleta
  const rouletteRef = useRef<{ spin: () => void }>(null);
  
  // [NUEVO] Estado para controlar cuando la ruleta está girando
  const [isSpinning, setIsSpinning] = useState(false);
  
  // [NUEVO] Hook neumórfico para el botón (detectar si es móvil/tablet/desktop)
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'tv' | 'desktop'>('desktop');
  
  // [NUEVO] Hook neumórfico para el botón
  const rouletteButtonState = useRouletteButton(isSpinning, deviceType);

  // [NUEVO] Detectar tipo de dispositivo
  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width >= 768 && width <= 1280) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };
    
    detectDevice();
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  const handleSpin = () => {
    if (rouletteRef.current && !rouletteButtonState.isDisabled) {
      rouletteRef.current.spin();
    }
  };
  
  // [NUEVO] Función para manejar el cambio de estado del spinning
  const handleSpinStateChange = (spinning: boolean) => {
    setIsSpinning(spinning);
  };

  // Loading
  if (isLoading) {
    return (
      <GameLayout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-white text-xl"
        >
          Preparando el juego...
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-6 w-24 h-1 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full"
            initial={{ width: 0 }}
            animate={{
              width: "100%",
              transition: { repeat: Infinity, duration: 1.5, ease: "linear" },
            }}
          />
        </motion.div>
      </GameLayout>
    );
  }

  // Error
  if (error) {
    return (
      <GameLayout>
        <div className="backdrop-blur-md p-8 rounded-xl shadow-lg max-w-lg z-10 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-white/90 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-white py-2 px-4 rounded transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </GameLayout>
    );
  }

  if (!currentParticipant || !gameSession) {
    return (
      <GameLayout>
        <div className="backdrop-blur-md p-8 rounded-xl shadow-lg border border-white/20 max-w-md z-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            Datos de juego no disponibles
          </h2>
          <p className="text-white/90 mb-4">
            No se pudo cargar la información del jugador o la sesión.
          </p>
          <button
            onClick={() => router.push(`/register/${sessionId}`)}
            className="mt-4 text-white py-2 px-4 rounded transition-colors"
          >
            Ir al registro
          </button>
        </div>
      </GameLayout>
    );
  }

  // Vista principal: ruleta/pregunta según el estado
  // [modificación] Log para rastrear el estado del juego y la pregunta actual antes de renderizar
// //   console.log("[GamePage] Rendering. gameState:", gameState, "currentQuestion:", currentQuestion, "lastSpinResultIndex:", lastSpinResultIndex);
  return (
    <GameLayout>
      <div className="w-full flex flex-col items-center max-w-[520px] mx-auto">
        {/* [modificación] Muestra la ruleta cuando es estado roulette O cuando está en transición inicial pero ya tenemos preguntas */}
        {(gameState === "roulette" || 
          ((gameState === "screensaver" || gameState === "register") && questions && questions.length > 0)) && (
          <>
            <div className="w-full flex justify-center mb-2.5">
              <RouletteWheel 
                questions={questions} 
                ref={rouletteRef}
                onSpinStateChange={handleSpinStateChange}
              />
            </div>
            <div className="relative">
              {/* [NUEVO] Botón neumórfico con efectos dinámicos */}
              <button
                className={`${rouletteButtonState.buttonClasses} text-white font-extrabold focus:outline-none focus:ring-4 focus:ring-blue-300`}
                onClick={handleSpin}
                disabled={rouletteButtonState.isDisabled}
                aria-label={rouletteButtonState.buttonText}
              >
                <span className={`inline-block mr-3 -mt-1 align-middle ${rouletteButtonState.iconClasses}`}>
                  <RouletteWheelIcon className="w-7 h-7" />
                </span>
                {rouletteButtonState.buttonText}
              </button>
            </div>
          </>
        )}

        {/* [modificación] Muestra la pregunta si el estado es "question" */}
        {gameState === "question" && currentQuestion && (
          <div className="w-full mt-6">
            <QuestionDisplay question={currentQuestion} />
          </div>
        )}

        {/* [modificación] Muestra el modal de premio cuando el estado es "prize" */}
        {gameState === "prize" && (
          <PrizeModal />
        )}
      </div>
    </GameLayout>
  );
}
