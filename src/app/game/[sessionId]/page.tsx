"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { motion } from "framer-motion";
import RouletteWheel from "@/components/game/RouletteWheel";
import QuestionDisplay from "@/components/game/QuestionDisplay";
import PrizeModal from "@/components/game/PrizeModal";
import GameLayout from "./GameLayout";
import RouletteLayout from "@/components/game/RouletteLayout";
import RouletteWheelIcon from "@/components/ui/RouletteWheelIcon";
import { useRouletteButton } from "@/hooks/useRouletteButton";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

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
  const lastSpinResultIndex = useGameStore(
    (state) => state.lastSpinResultIndex
  );
  const setCurrentQuestion = useGameStore((state) => state.setCurrentQuestion);
  const setGameSession = useGameStore((state) => state.setGameSession);
  const questions = useGameStore((state) => state.questions);
  const setQuestions = useGameStore((state) => state.setQuestions);
  const gameSession = useGameStore((state) => state.gameSession);
  const currentQuestion = useGameStore((state) => state.currentQuestion);
  const moveToNext = useGameStore((state) => state.moveToNext);
  
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

        // Para single session, siempre verificar que hay participantes antes de mostrar el juego
        let hasParticipants = false;
        try {
          const participantResponse = await fetch(`/api/admin/sessions/participants?sessionId=${sessionId}`);
          const participantData = await participantResponse.json();
          
          if (participantResponse.ok && participantData.participants && participantData.participants.length > 0) {
            hasParticipants = true;
          }
        } catch (error) {
          console.warn('Error al verificar participantes:', error);
        }

        // Si no hay participantes, siempre redirigir a registro
        if (!hasParticipants) {
          handleRedirect(`/register/${sessionId}`);
          return;
        }

        // [modificación] Actualizar estado a 'playing' si no está ya en ese estado
        if (session.status !== 'playing') {
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
            } else {
              // [soporte] Error al actualizar estado de sesión
              console.warn(`No se pudo actualizar el estado de la sesión ${sessionId} a 'playing'`);
            }
          } catch (updateError) {
            // [soporte] Error al actualizar estado de sesión
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
    if (lastSpinResultIndex !== null && questionsRef.current && questionsRef.current.length > 0) {
      const indexToUse = lastSpinResultIndex;
      if (indexToUse >= 0 && indexToUse < questionsRef.current.length) {
        const questionToSet = questionsRef.current[indexToUse];
        setCurrentQuestionRef.current(questionToSet);
        setGameStateRef.current("question");
      } else {
        // [soporte] Advertencia si el índice está fuera de los límites
        console.warn("[GamePage] lastSpinResultIndex is out of bounds:", indexToUse, "questionsRef.current.length:", questionsRef.current.length);
      }
    }
  }, [lastSpinResultIndex]); // ⚠️ SOLUCIONADO: Removido questions, setCurrentQuestion y setGameState para evitar ciclos infinitos

  // Referencia al componente de la ruleta
  const rouletteRef = useRef<{ spin: () => void }>(null);
  
  // [NUEVO] Estado para controlar cuando la ruleta está girando
  const [isSpinning, setIsSpinning] = useState(false);
  
  // Device detection centralizado
  const device = useDeviceDetection();
  
  // Hook neumórfico para el botón
  const rouletteButtonState = useRouletteButton(isSpinning, device.type);

  const handleSpin = () => {
    if (rouletteRef.current && !rouletteButtonState.isDisabled) {
      rouletteRef.current.spin();
    }
  };
  
  // [NUEVO] Función para manejar el cambio de estado del spinning
  const handleSpinStateChange = (spinning: boolean) => {
    setIsSpinning(spinning);
  };

  // Loading - USA ROULETTE LAYOUT
  if (isLoading) {
    return (
      <RouletteLayout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-white text-xl"
        >
          Preparando el juego...
        </motion.div>
      </RouletteLayout>
    );
  }

  // Error - USA ROULETTE LAYOUT  
  if (error) {
    return (
      <RouletteLayout>
        <div className="backdrop-blur-md p-8 rounded-xl shadow-lg max-w-lg z-10 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-white/90 mb-4">{error}</p>
        </div>
      </RouletteLayout>
    );
  }

  if (!gameSession) {
    return (
      <RouletteLayout>
        <div className="backdrop-blur-md p-8 rounded-xl shadow-lg border border-white/20 max-w-md z-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            Sesión no disponible
          </h2>
          <p className="text-white/90 mb-4">
            No se pudo cargar la información de la sesión.
          </p>
        </div>
      </RouletteLayout>
    );
  }

  // Vista principal: usar diferentes layouts según el estado
  
  // Vista de la ruleta - usa RouletteLayout
  if (gameState === "roulette" || 
      ((gameState === "screensaver" || gameState === "register") && questions && questions.length > 0)) {
    
    // [GAMING PRO] Botones como componente separado
    const gameButtons = (
      <>
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={`
            relative overflow-hidden font-black text-white focus:outline-none focus:ring-4
            bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 hover:from-blue-400 hover:via-blue-500 hover:to-blue-600
            border-2 border-blue-300/60 focus:ring-blue-300/50 hover:shadow-blue-500/25 shadow-2xl
            transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm transform-gpu
            ${device.type === 'mobile' ? 'px-6 py-4 text-base rounded-xl' : 
              device.type === 'tablet' ? 'px-12 py-5 text-xl rounded-2xl' : 
              device.type === 'tv' ? 'px-16 py-8 text-3xl rounded-3xl' : 'px-10 py-4 text-lg rounded-xl'}
          `}
          onClick={handleSpin}
          onTouchStart={rouletteButtonState.handleRippleEffect}
          onMouseDown={rouletteButtonState.handleRippleEffect}
          disabled={rouletteButtonState.isDisabled}
          aria-label={rouletteButtonState.buttonText}
        >
          <span className={`
            inline-flex items-center justify-center
            ${device.type === 'tv' ? 'gap-6' : 'gap-3'}
          `}>
            <RouletteWheelIcon className={`
              ${device.type === 'mobile' ? 'w-7 h-7' : 
                device.type === 'tablet' ? 'w-9 h-9' : 
                device.type === 'tv' ? 'w-16 h-16' : 'w-11 h-11'}
              filter drop-shadow(0 3px 6px rgba(0,0,0,0.6))
            `} />
            <span className="font-black tracking-wide">
              {rouletteButtonState.buttonText}
            </span>
          </span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={`
            relative overflow-hidden font-black text-white focus:outline-none focus:ring-4
            bg-gradient-to-b from-green-500 via-green-600 to-green-700 hover:from-green-400 hover:via-green-500 hover:to-green-600
            border-2 border-green-300/60 focus:ring-green-300/50 hover:shadow-green-500/25 shadow-2xl
            transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm transform-gpu
            ${device.type === 'mobile' ? 'px-6 py-4 text-base rounded-xl' : 
              device.type === 'tablet' ? 'px-8 py-5 text-lg rounded-2xl' : 
              device.type === 'tv' ? 'px-12 py-8 text-2xl rounded-3xl' : 'px-8 py-4 text-base rounded-xl'}
          `}
          onClick={() => moveToNext()}
          aria-label="Volver al Inicio"
        >
          <span className={`
            inline-flex items-center justify-center
            ${device.type === 'tv' ? 'gap-6' : 'gap-3'}
          `}>
            <span className="font-black tracking-wide">
              Volver al Inicio
            </span>
          </span>
        </motion.button>
      </>
    );

    return (
      <RouletteLayout buttons={gameButtons}>
        <RouletteWheel 
          questions={questions} 
          ref={rouletteRef}
          onSpinStateChange={handleSpinStateChange}
        />
      </RouletteLayout>
    );
  }

  // Vista de pregunta - usa GameLayout
  if (gameState === "question" && currentQuestion) {
    return (
      <GameLayout>
        <QuestionDisplay question={currentQuestion} />
      </GameLayout>
    );
  }

  // Vista de premio - usa GameLayout con modal
  if (gameState === "prize") {
    return (
      <GameLayout>
        <PrizeModal />
      </GameLayout>
    );
  }

  // Estado por defecto - usa GameLayout
  return (
    <GameLayout>
      <div className="text-white text-center">
        <p>Estado del juego no reconocido: {gameState}</p>
      </div>
    </GameLayout>
  );
}
