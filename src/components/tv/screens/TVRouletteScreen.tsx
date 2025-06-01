'use client';

import { useEffect, useState, useRef } from 'react';
import { useIsMounted } from '@/hooks/useIsMounted';
import { MotionDiv } from '../shared/MotionComponents';
import LoadingScreen from './LoadingScreen';
import RouletteWheel from '@/components/game/RouletteWheel';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import RouletteWheelIcon from '@/components/ui/RouletteWheelIcon';
import { Question } from '@/types';
import { useGameStore } from '@/store/gameStore';
import QuestionDisplay from '@/components/game/QuestionDisplay';
import PrizeModal from '@/components/game/PrizeModal';
import dynamic from 'next/dynamic';

// [modificación] - Cargar confetti dinámicamente como en GameLayout
const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

/**
 * Pantalla que muestra la ruleta en la TV cuando se registra un participante
 * Esta pantalla es exclusiva para la TV - el admin permanece en el formulario
 * [modificación] Optimizada específicamente para resolución 2160×3840 (vertical)
 * [modificación] Ahora maneja el flujo completo: ruleta → pregunta → resultado
 */
export default function TVRouletteScreen() {
  const isMounted = useIsMounted();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  
  // [modificación] - Estados para confetti optimizado para TV
  const [isTV65, setIsTV65] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  // [modificación] ID único para tracking de logs
  const componentId = useRef(
    `TVRouletteScreen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );
  
  // [modificación] Ref para controlar la ruleta desde el botón
  const rouletteRef = useRef<{ spin: () => void }>(null);
  
  // [modificación] Estados del gameStore
  const lastSpinResultIndex = useGameStore((state) => state.lastSpinResultIndex);
  const currentQuestion = useGameStore((state) => state.currentQuestion);
  const setCurrentQuestion = useGameStore((state) => state.setCurrentQuestion);
  const setQuestionsInStore = useGameStore((state) => state.setQuestions);
  const gameState = useGameStore((state) => state.gameState);
  const setGameState = useGameStore((state) => state.setGameState);
  const prizeFeedback = useGameStore((state) => state.prizeFeedback);
  const currentParticipant = useGameStore((state) => state.currentParticipant);
  const gameSession = useGameStore((state) => state.gameSession);
  const resetPrizeFeedback = useGameStore((state) => state.resetPrizeFeedback);
  const setLastSpinResultIndex = useGameStore((state) => state.setLastSpinResultIndex);
  // [modificación] - Agregar showConfetti del store
  const showConfetti = useGameStore((state) => state.showConfetti);

  // [modificación] - useEffect para detectar TV65 y configurar ventana para confetti
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Detectar TV65 igual que en QuestionDisplay
      const isTV65Resolution = (width >= 2160 && height >= 3840) || (width >= 3840 && height >= 2160);
      
      setIsTV65(isTV65Resolution);
      setWindowSize({ width, height });
      
      if (isTV65Resolution) {
        console.log(`🎉 TVRouletteScreen: Confetti optimizado para TV65 activado - ${width}x${height}`);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // [modificación] - Configuración dinámica del confetti para TV (igual que GameLayout pero optimizada para TV)
  const confettiConfig = {
    width: windowSize.width,
    height: windowSize.height,
    // [modificación] - Muchísimas más partículas para TV65 para efecto espectacular
    numberOfPieces: isTV65 ? 3000 : 800, // Más partículas que GameLayout para TV
    // [modificación] - Gravedad más lenta para TV65 para que caiga más elegante
    gravity: isTV65 ? 0.08 : 0.15, // Gravedad aún más lenta para TV
    // [modificación] - Velocidad inicial más alta para TV65
    initialVelocityY: isTV65 ? 30 : 20,
    initialVelocityX: isTV65 ? 18 : 12,
    // [modificación] - Confetti NO se recicla para que haya una explosión inicial espectacular
    recycle: false,
    // [modificación] - Tamaño de partículas más grande para TV65
    scalar: isTV65 ? 2.5 : 1.8, // Partículas mucho más grandes para TV
    // [modificación] - Colores vibrantes y festivos
    colors: [
      '#ff0040', '#ff8c00', '#ffd700', '#00ff80', '#00bfff', 
      '#8a2be2', '#ff1493', '#32cd32', '#ff6347', '#1e90ff',
      '#ffa500', '#9370db', '#00ced1', '#ff69b4', '#00ff00'
    ],
    // [modificación] - Más tiempo de vida para partículas en TV65
    ...(isTV65 && {
      opacity: 0.95,
      wind: 0.03,
    })
  };

  // [modificación] Log de montaje del componente para debugging con ID único
  useEffect(() => {
    const componentIdValue = componentId.current;
    if (isMounted) {
      console.log(
        `🎰 TVRouletteScreen [${componentIdValue}]: Componente montado exitosamente`
      );
    }
    return () => {
      console.log(`🎰 TVRouletteScreen [${componentIdValue}]: Componente DESMONTADO`);
    };
  }, [isMounted]);

  // [modificación] Detectar cuando la ruleta termina de girar y establecer la pregunta
  useEffect(() => {
    if (
      lastSpinResultIndex !== null &&
      questions.length > 0 &&
      gameState === 'roulette' &&
      !currentQuestion
    ) {
      const selectedQuestion = questions[lastSpinResultIndex % questions.length];
      if (selectedQuestion) {
        console.log('🎯 TV: Ruleta se detuvo en índice:', lastSpinResultIndex);
        console.log('🎯 TV: Pregunta seleccionada:', selectedQuestion.category);
        setCurrentQuestion(selectedQuestion);
        setGameState('question');
      }
    }
  }, [
    lastSpinResultIndex,
    questions,
    gameState,
    currentQuestion,
    setCurrentQuestion,
    setGameState,
  ]);

  // [modificación] Asegurar que el gameState sea 'roulette' cuando hay un participante registrado
  useEffect(() => {
    if (
      currentParticipant &&
      gameSession &&
      (gameSession.status === 'player_registered' || gameSession.status === 'playing') &&
      gameState !== 'roulette' &&
      gameState !== 'question'
    ) {
      console.log(
        `🎮 TV: Forzando gameState a 'roulette' para participante: ${currentParticipant.nombre}`
      );
      if (gameState === 'prize') {
        console.log(`🎮 TV: Limpiando estado residual de premio`);
        resetPrizeFeedback();
        setCurrentQuestion(null);
        setLastSpinResultIndex(null);
      }
      setGameState('roulette');
    }
  }, [
    currentParticipant,
    gameSession,
    gameState,
    resetPrizeFeedback,
    setCurrentQuestion,
    setLastSpinResultIndex,
    setGameState,
  ]);

  // [modificación] Cuando cambia el participante, limpiar estados residuales
  useEffect(() => {
    if (currentParticipant && currentParticipant.nombre !== 'Pendiente') {
      console.log(
        `🎮 TV: Nuevo participante detectado: ${currentParticipant.nombre}, limpiando estados residuales...`
      );
      resetPrizeFeedback();
      setCurrentQuestion(null);
      setLastSpinResultIndex(null);
      if (gameState !== 'roulette') {
        console.log(
          `🎮 TV: Estableciendo gameState a 'roulette' para nuevo participante`
        );
        setGameState('roulette');
      }
    }
  }, [
    currentParticipant,
    resetPrizeFeedback,
    setCurrentQuestion,
    setLastSpinResultIndex,
    setGameState,
    gameState,
  ]);

  // [modificación] Función para manejar el giro de la ruleta
  const handleSpin = () => {
    if (rouletteRef.current) {
      console.log('📺 TV: Iniciando giro de ruleta desde TV...');
      setGameState('roulette');
      rouletteRef.current.spin();
    } else {
      console.warn('📺 TV: No se pudo acceder a la referencia de la ruleta');
    }
  };

  // [modificación] Cargar preguntas y guardarlas en el store
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoadingQuestions(true);
        const response = await fetch('/api/questions');
        if (!response.ok) throw new Error('Error al cargar preguntas');
        const data = await response.json();
        const loadedQuestions = data.questions || [];
        setQuestions(loadedQuestions);
        setQuestionsInStore(loadedQuestions);
      } catch (error) {
        console.error('TVRouletteScreen: Error al cargar preguntas:', error);
        const fallbackQuestions: Question[] = [
          // ... (se mantienen los fallback questions if es necesario)
        ];
        setQuestions(fallbackQuestions);
        setQuestionsInStore(fallbackQuestions);
      } finally {
        setLoadingQuestions(false);
      }
    };

    if (isMounted) {
      loadQuestions();
    }
  }, [isMounted, setQuestionsInStore]);

  // [modificación] Logging cuando el estado sea 'prize'
  useEffect(() => {
    if (gameState === 'prize') {
      console.log('🎁 TV: Entrando en estado PRIZE con feedback:', prizeFeedback);
    }
  }, [gameState, prizeFeedback]);

  if (!isMounted || loadingQuestions) {
    return <LoadingScreen />;
  }

  // [modificación] Si está en premio, mostrar modal
  if (
    gameState === 'prize' &&
    prizeFeedback.answeredCorrectly !== null &&
    typeof prizeFeedback.answeredCorrectly !== 'undefined'
  ) {
    return (
      <div className="min-h-screen relative">
        {/* [modificación] - Confetti para TV cuando se gana un premio */}
        {showConfetti && (
          <Confetti
            {...confettiConfig}
            className="pointer-events-none fixed inset-0 z-50"
            style={{ zIndex: 9999 }} // [modificación] - Z-index máximo para que esté encima de todo
          />
        )}
        <PrizeModal />
      </div>
    );
  }

  // [modificación] Si está en pregunta, mostrar pregunta
  if (gameState === 'question' && currentQuestion) {
    return (
      <div className="min-h-screen relative">
        {/* [modificación] - Confetti también disponible durante preguntas si es necesario */}
        {showConfetti && (
          <Confetti
            {...confettiConfig}
            className="pointer-events-none fixed inset-0 z-50"
            style={{ zIndex: 9999 }}
          />
        )}
        <QuestionDisplay question={currentQuestion} />
      </div>
    );
  }

  // [modificación] Layout principal: logo, ruleta y botón, todos grandes y centrados
  return (
    <div className="flex flex-col min-h-screen w-full bg-main-gradient">
      {/* Header con logo muy grande - [modificación] Más espacio superior (10% de altura total) */}
      <header className="w-full flex justify-center items-center pt-24 pb-6"> {/* [modificación] pt-24 (antes pt-16) para dar ~10% más de espacio arriba */}
        <div className="w-full max-w-5xl flex justify-center items-center">
          {/* [modificación] Forzamos tamaño 'lg' para que coincida con la ruleta */}
          <Logo
            size="lg"
            animated={true}
            withShadow={true}
            className="w-full h-auto"
          />
        </div>
      </header>

      {/* Contenido principal: ruleta y botón - [modificación] Container centrado con ancho máximo */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-8"> {/* [modificación] px-8 (antes px-16) para mejor centrado */}
        <div className="w-full max-w-[1800px] flex flex-col items-center justify-center space-y-16"> {/* [modificación] Container centrado de 1800px máximo y space-y-16 (antes space-y-24) */}
          <MotionDiv
            key="tv-roulette"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full flex flex-col items-center justify-center space-y-12" // [modificación] space-y-12 (antes space-y-16) para acercar ruleta y botón
            role="main"
            aria-label="Pantalla de ruleta para TV"
          >
            {/* Contenedor de la ruleta - [modificación] Más grande usando vh en lugar de px fijos */}
            <MotionDiv
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full max-w-none flex justify-center"
              style={{
                width: '100%',
                height: 'auto',
                maxWidth: '55vh', // [modificación] Usar 55vh para que ocupe 55% de altura como sugiere el usuario
                maxHeight: '55vh', // [modificación] Mantener aspecto cuadrado pero más grande
                minWidth: '2000px', // [modificación] Tamaño mínimo más grande (antes 1800px)
                minHeight: '2000px', // [modificación] Tamaño mínimo más grande
              }}
            >
              {questions.length > 0 ? (
                <RouletteWheel questions={questions} ref={rouletteRef} />
              ) : (
                <div className="text-white text-8xl text-center font-bold">
                  Cargando categorías...
                </div>
              )}
            </MotionDiv>

            {/* Botón "¡Girar la Ruleta!" - [modificación] Mejorado para mayor legibilidad y contraste */}
            <MotionDiv
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="relative flex justify-center"
            >
              {/* Efecto de brillo detrás del botón */}
              <div className="absolute -inset-16 bg-gradient-to-r from-green-400 via-teal-300 to-blue-500 rounded-full opacity-80 blur-3xl animate-pulse"></div>

              <Button
                variant="custom"
                className="relative px-40 py-24 text-8xl font-black shadow-2xl rounded-2xl
                 border-8 border-white/40 hover:border-white/70
                 animate-pulse-subtle spin-button-glow
                 hover:shadow-[0_0_60px_25px_rgba(90,204,193,0.8)]
                 transform hover:scale-110 transition-all duration-300
                 min-h-[240px] min-w-[1400px]
                 text-white focus:outline-none focus:ring-8 focus:ring-blue-300
                 backdrop-blur-md leading-tight
                 active:scale-105 active:shadow-[0_0_40px_15px_rgba(90,204,193,0.6)]
                 active:border-white/80"
                style={{
                  backgroundColor: 'oklch(38% 0.199 265.638)',
                  boxShadow: '0 0 40px rgba(90, 204, 193, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.1)',
                }}
                onClick={handleSpin}
                touchOptimized
              >
                <span className="inline-block mr-8 -mt-3 align-middle">
                  <RouletteWheelIcon className="w-28 h-28" size={112} /> {/* [modificación] Icono más grande */}
                </span>
                ¡GIRAR LA RULETA!
              </Button>
            </MotionDiv>
          </MotionDiv>
        </div>
      </main>

      {/* [modificación] Footer invisible para asegurar 5vh de espacio bajo el botón */}
      <footer className="h-[5vh] min-h-[100px] w-full"></footer> {/* [modificación] Espacio inferior garantizado */}
    </div>
  );
}
