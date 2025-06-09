'use client';

import { useEffect, useState, useRef } from 'react';
import { useIsMounted } from '@/hooks/useIsMounted';
import { MotionDiv } from '../shared/MotionComponents';
import LoadingScreen from './LoadingScreen';
import RouletteWheel from '@/components/game/RouletteWheel';
import Logo from '@/components/ui/Logo';
import RouletteWheelIcon from '@/components/ui/RouletteWheelIcon';
import { Question, GameState } from '@/types';
import { useGameStore } from '@/store/gameStore';
import QuestionDisplay from '@/components/game/QuestionDisplay';
import PrizeModal from '@/components/game/PrizeModal';
import MassiveConfetti from '@/components/ui/MassiveConfetti';
import { useRouletteButton } from '@/hooks/useRouletteButton';
import { tvLogger } from '@/utils/tvLogger';

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
  
  // [NUEVO] Estado para controlar cuando la ruleta está girando
  const [isSpinning, setIsSpinning] = useState(false);
  
  // [NUEVO] Hook neumórfico para el botón
  const rouletteButtonState = useRouletteButton(isSpinning, 'tv');
  const setCurrentQuestion = useGameStore((state) => state.setCurrentQuestion);
  const setQuestionsInStore = useGameStore((state) => state.setQuestions);
  const gameState: GameState = useGameStore((state) => state.gameState);
  const setGameState = useGameStore((state) => state.setGameState);
  const prizeFeedback = useGameStore((state) => state.prizeFeedback);
  const currentParticipant = useGameStore((state) => state.currentParticipant);
  const gameSession = useGameStore((state) => state.gameSession);
  const resetPrizeFeedback = useGameStore((state) => state.resetPrizeFeedback);
  const setLastSpinResultIndex = useGameStore((state) => state.setLastSpinResultIndex);
  // [modificación] - Agregar showConfetti del store
  const showConfetti = useGameStore((state) => state.showConfetti);

  // Log detallado para debugging del estado actual - usando tvLogger para desarrollo
  useEffect(() => {
    tvLogger.game(`Estado del juego: ${gameState}`);
    tvLogger.participant(`Participante: ${currentParticipant ? currentParticipant.nombre : 'undefined'}, Sesión: ${gameSession?.session_id}`);
    tvLogger.debug(`lastSpinResultIndex: ${lastSpinResultIndex}, currentQuestion: ${currentQuestion ? currentQuestion.category : 'undefined'}`);
  }, [gameState, currentParticipant, gameSession, lastSpinResultIndex, currentQuestion]);

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
// //         console.log(`🎉 TVRouletteScreen: Confetti optimizado para TV65 activado - ${width}x${height}`);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // [modificación] Log de montaje del componente para debugging con ID único
  useEffect(() => {
    const componentIdValue = componentId.current;
    void componentIdValue;
    if (isMounted) {
// //       console.log(
// //         `🎰 TVRouletteScreen [${componentIdValue}]: Componente montado exitosamente`
// //       );
    }
    return () => {
// //       console.log(`🎰 TVRouletteScreen [${componentIdValue}]: Componente DESMONTADO`);
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
        tvLogger.game(`Ruleta se detuvo en índice: ${lastSpinResultIndex}`);
        tvLogger.game(`Pregunta seleccionada: ${selectedQuestion.category}`);
        tvLogger.game('Cambiando gameState de "roulette" a "question"');
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

  // [SOLUCIONADO] Combinado en un solo useEffect para evitar ciclo infinito
  // Asegurar que el gameState sea 'roulette' cuando hay un participante registrado
  // PERO NO interferir con el estado 'prize' cuando hay feedback válido
  // [SOLUCIONADO] NO interferir con el estado 'screensaver' para evitar parpadeo al volver al inicio
  useEffect(() => {
    tvLogger.debug('Evaluando useEffect UNIFICADO con condiciones:');
    tvLogger.debug(`- currentParticipant: ${!!currentParticipant} ${currentParticipant ? `(${currentParticipant.nombre})` : ''}`);
    tvLogger.debug(`- gameSession: ${!!gameSession}, status: ${gameSession?.status}`);
    tvLogger.debug(`- gameState: ${gameState}`);
    tvLogger.debug(`- prizeFeedback.answeredCorrectly: ${prizeFeedback.answeredCorrectly}`);
    
    // [SOLUCIONADO] Si gameState es 'screensaver', significa que se está volviendo al inicio - NO interferir
    if (gameState === 'screensaver') {
      tvLogger.debug('Estado es "screensaver" - NO interferir, se está volviendo al inicio');
      return;
    }
    
    // Caso 1: Asegurar gameState 'roulette' cuando hay participante registrado
    if (
      currentParticipant &&
      gameSession &&
      (gameSession.status === 'player_registered' || gameSession.status === 'playing') &&
      gameState !== 'roulette' &&
      gameState !== 'question' &&
      !(gameState === 'prize' && prizeFeedback.answeredCorrectly !== null)
    ) {
      tvLogger.game(`Forzando gameState a 'roulette' para participante: ${currentParticipant.nombre}`);
      
      // Limpiar estado residual si es necesario
      if (gameState === 'prize' && prizeFeedback.answeredCorrectly === null) {
        tvLogger.debug(`Limpiando estado residual de premio SIN feedback válido`);
        resetPrizeFeedback();
        setCurrentQuestion(null);
        setLastSpinResultIndex(null);
      }
      setGameState('roulette');
      return; // Evitar ejecutar el segundo caso en el mismo render
    }

    // Caso 2: Cuando cambia el participante, limpiar estados residuales
    if (currentParticipant && currentParticipant.nombre !== 'Pendiente') {
      tvLogger.participant(`Nuevo participante detectado: ${currentParticipant.nombre}, evaluando limpieza...`);
      
      // Solo limpiar estados si NO estamos en un premio válido Y NO estamos en pregunta activa
      if (!(gameState === 'prize' && prizeFeedback.answeredCorrectly !== null) &&
          gameState !== 'question') {
        tvLogger.debug(`Limpiando estados residuales para participante: ${currentParticipant.nombre}`);
        resetPrizeFeedback();
        setCurrentQuestion(null);
        setLastSpinResultIndex(null);

        if (gameState !== 'roulette') {
          tvLogger.game(`Estableciendo gameState a 'roulette' para nuevo participante`);
          setGameState('roulette');
        }
      } else {
        tvLogger.debug(`Participante ${currentParticipant.nombre} está en estado válido (${gameState}), NO limpiando estados`);
      }
    }
  }, [
    currentParticipant,
    gameSession,
    gameState,
    prizeFeedback.answeredCorrectly,
    resetPrizeFeedback,
    setCurrentQuestion,
    setLastSpinResultIndex,
    setGameState,
  ]);

  // [modificación] Función para manejar el giro de la ruleta
  const handleSpin = () => {
    if (rouletteRef.current && !rouletteButtonState.isDisabled) {
      tvLogger.game('Iniciando giro de ruleta desde TV...');
      setGameState('roulette');
      rouletteRef.current.spin();
    } else {
      tvLogger.warn('No se pudo acceder a la referencia de la ruleta o botón deshabilitado');
    }
  };
  
  // [NUEVO] Función para manejar el cambio de estado del spinning
  const handleSpinStateChange = (spinning: boolean) => {
    setIsSpinning(spinning);
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
        tvLogger.error('Error al cargar preguntas:', error);
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
// //       console.log('🎁 TV: Entrando en estado PRIZE con feedback:', prizeFeedback);
// //       console.log('🎁 TV: showConfetti:', showConfetti);
// //       console.log('🎁 TV: answeredCorrectly:', prizeFeedback.answeredCorrectly);
    }
  }, [gameState, prizeFeedback, showConfetti]);

  // [REMOVIDO] Logging duplicado ya que tenemos el mismo efecto arriba con tvLogger

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
        {/* [modificación] - Sistema de confetti masivo usando componente reutilizable */}
        <MassiveConfetti 
          show={showConfetti} 
          windowSize={windowSize} 
          isTV65={isTV65}
        />
        <PrizeModal />
      </div>
    );
  }

  // [modificación] Si está en pregunta, mostrar pregunta
  if (gameState === 'question' && currentQuestion) {
    return (
      <div className="min-h-screen relative">
        {/* [modificación] - Sistema de confetti masivo usando componente reutilizable */}
        <MassiveConfetti 
          show={showConfetti} 
          windowSize={windowSize} 
          isTV65={isTV65}
        />
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
                <RouletteWheel 
                  questions={questions} 
                  ref={rouletteRef}
                  onSpinStateChange={handleSpinStateChange}
                />
              ) : (
                <div className="text-white text-8xl text-center font-bold">
                  Cargando categorías...
                </div>
              )}
            </MotionDiv>

            {/* Botón "¡Girar la Ruleta!" - [NUEVO] Con efectos neumórficos */}
            <MotionDiv
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="relative flex justify-center"
            >
              <button
                className={`${rouletteButtonState.buttonClasses} text-white font-black focus:outline-none focus:ring-8 focus:ring-blue-300`}
                onClick={handleSpin}
                disabled={rouletteButtonState.isDisabled}
                aria-label={rouletteButtonState.buttonText}
              >
                <span className={`inline-block mr-8 -mt-3 align-middle ${rouletteButtonState.iconClasses}`}>
                  <RouletteWheelIcon className="w-28 h-28" size={112} />
                </span>
                {rouletteButtonState.buttonText}
              </button>
            </MotionDiv>
          </MotionDiv>
        </div>
      </main>

      {/* [modificación] Footer invisible para asegurar 5vh de espacio bajo el botón */}
      <footer className="h-[5vh] min-h-[100px] w-full"></footer> {/* [modificación] Espacio inferior garantizado */}
    </div>
  );
}
