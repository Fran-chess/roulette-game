"use client";

import { useEffect, useState, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import { motion } from "framer-motion";
import RouletteWheel from "@/components/game/RouletteWheel";
import QuestionDisplay from "@/components/game/QuestionDisplay";
import PrizeModal from "@/components/game/PrizeModal";
import GameLayout from "@/components/game/GameLayout";
import RouletteLayout from "@/components/game/RouletteLayout";
import RouletteWheelIcon from "@/components/ui/RouletteWheelIcon";
import { useRouletteButton } from "@/hooks/useRouletteButton";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import WaitingScreen from "@/components/tv/screens/WaitingScreen";

export default function GamePage() {
  // Estado local
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  
  // Refs para evitar requests múltiples
  const loadingQuestionsRef = useRef(false);
  
  // Zustand (GameStore)
  const gameState = useGameStore((state) => state.gameState);
  const setGameState = useGameStore((state) => state.setGameState);
  const lastSpinResultIndex = useGameStore((state) => state.lastSpinResultIndex);
  const setCurrentQuestion = useGameStore((state) => state.setCurrentQuestion);
  const questions = useGameStore((state) => state.questions);
  const setQuestions = useGameStore((state) => state.setQuestions);
  const currentQuestion = useGameStore((state) => state.currentQuestion);
  
  // Refs para funciones
  const setQuestionsRef = useRef(setQuestions);
  const setGameStateRef = useRef(setGameState);
  const setCurrentQuestionRef = useRef(setCurrentQuestion);
  const questionsRef = useRef(questions);
  
  // Actualizar refs cuando cambien las funciones
  useEffect(() => {
    setQuestionsRef.current = setQuestions;
    setGameStateRef.current = setGameState;
    setCurrentQuestionRef.current = setCurrentQuestion;
    questionsRef.current = questions;
  }, [setQuestions, setGameState, setCurrentQuestion, questions]);
  
  // Cargar preguntas al inicio
  useEffect(() => {
    if (!loadingQuestionsRef.current && (!questions || questions.length === 0)) {
      const loadQuestions = async () => {
        try {
          loadingQuestionsRef.current = true;
          const questionsResponse = await fetch("/api/questions");
          if (!questionsResponse.ok) throw new Error("Error al cargar preguntas");
          const questionsData = await questionsResponse.json();
          setQuestionsRef.current(questionsData.questions || []);
        } finally {
          setIsLoading(false);
          setTimeout(() => {
            loadingQuestionsRef.current = false;
          }, 500);
        }
      };
      
      loadQuestions();
    } else {
      setIsLoading(false);
    }
  }, [questions]);
  
  // Al girar la ruleta, mostrar la pregunta correspondiente
  useEffect(() => {
    if (lastSpinResultIndex !== null && questionsRef.current && questionsRef.current.length > 0) {
      const indexToUse = lastSpinResultIndex;
      if (indexToUse >= 0 && indexToUse < questionsRef.current.length) {
        const questionToSet = questionsRef.current[indexToUse];
        setCurrentQuestionRef.current(questionToSet);
        setGameStateRef.current("question");
      }
    }
  }, [lastSpinResultIndex]);
  
  // Referencia al componente de la ruleta
  const rouletteRef = useRef<{ spin: () => void }>(null);
  
  // Device detection centralizado
  const device = useDeviceDetection();
  
  // Hook neumórfico para el botón
  const rouletteButtonState = useRouletteButton(isSpinning, device.type);
  
  const handleSpin = () => {
    if (rouletteRef.current && !rouletteButtonState.isDisabled) {
      rouletteRef.current.spin();
    }
  };
  
  // Función para manejar el cambio de estado del spinning
  const handleSpinStateChange = (spinning: boolean) => {
    setIsSpinning(spinning);
  };
  
  // Loading
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
  
  // Pantalla de espera - WaitingScreen
  if (gameState === 'waiting') {
    return <WaitingScreen />;
  }
  
  // Vista de la ruleta - SOLO con botón de girar
  if (gameState === "roulette") {
    const gameButtons = (
      <motion.button
        whileTap={{ scale: 0.95 }}
        className={`
          relative overflow-hidden font-black text-white focus:outline-none focus:ring-4
          bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700
          border-2 border-blue-300/60 focus:ring-blue-300/50 shadow-2xl
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
  
  // Vista de pregunta
  if (gameState === "question" && currentQuestion) {
    return (
      <GameLayout>
        <QuestionDisplay question={currentQuestion} />
      </GameLayout>
    );
  }
  
  // Vista de premio
  if (gameState === "prize") {
    return (
      <GameLayout>
        <PrizeModal />
      </GameLayout>
    );
  }
  
  // Estado por defecto
  return (
    <GameLayout>
      <div className="text-white text-center">
        <p>Estado del juego no reconocido: {gameState}</p>
      </div>
    </GameLayout>
  );
}