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

/**
 * Pantalla que muestra la ruleta en la TV cuando se registra un participante
 * Esta pantalla es exclusiva para la TV - el admin permanece en el formulario
 * [modificación] Optimizada para TV 65" con resolución 3840x2160
 * [modificación] Ahora maneja el flujo completo: ruleta → pregunta → resultado
 */
export default function TVRouletteScreen() {
  const isMounted = useIsMounted();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  
  // [modificación] ID único para tracking de logs
  const componentId = useRef(`TVRouletteScreen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
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

  // [modificación] Log de montaje del componente para debugging con ID único
  useEffect(() => {
    // [modificación] Copiar la referencia al inicio para evitar warning de cleanup
    const componentIdValue = componentId.current;
    
    if (isMounted) {
      console.log(`🎰 TVRouletteScreen [${componentIdValue}]: Componente montado exitosamente - mostrando ruleta en TV`);
    }
    
    // [modificación] Cleanup para detectar desmontaje
    return () => {
      // [modificación] Usar variable copiada en cleanup
      console.log(`🎰 TVRouletteScreen [${componentIdValue}]: Componente DESMONTADO`);
    };
  }, [isMounted]); // [modificación] Solo isMounted como dependencia para evitar loops infinitos

  // [modificación] Detectar cuando la ruleta termina de girar y establecer la pregunta
  useEffect(() => {
    // [modificación] Solo procesar si estamos en estado de ruleta y no hay pregunta actual
    if (lastSpinResultIndex !== null && questions.length > 0 && gameState === 'roulette' && !currentQuestion) {
      const selectedQuestion = questions[lastSpinResultIndex % questions.length];
      if (selectedQuestion) {
        console.log('🎯 TV: Ruleta se detuvo en índice:', lastSpinResultIndex);
        console.log('🎯 TV: Pregunta seleccionada:', selectedQuestion.category);
        console.log('🎯 TV: Cambiando estado a pregunta...');
        
        setCurrentQuestion(selectedQuestion);
        setGameState('question');
      }
    }
  }, [lastSpinResultIndex, questions, gameState, currentQuestion, setCurrentQuestion, setGameState]); // [modificación] Agregar dependencias faltantes

  // [modificación] NUEVO: Asegurar que el gameState sea 'roulette' cuando hay un participante registrado
  useEffect(() => {
    if (currentParticipant && gameSession && 
        (gameSession.status === 'player_registered' || gameSession.status === 'playing') &&
        gameState !== 'roulette' && gameState !== 'question') {
      console.log(`🎮 TV: Forzando gameState a 'roulette' para participante: ${currentParticipant.nombre}`);
      console.log(`🎮 TV: Estado anterior era: ${gameState}, estado de sesión: ${gameSession.status}`);
      
      // [modificación] CRUCIAL: Limpiar estado del premio residual cuando nuevo participante se registra
      if (gameState === 'prize') {
        console.log(`🎮 TV: Limpiando estado residual de premio para nuevo participante...`);
        resetPrizeFeedback();
        setCurrentQuestion(null);
        setLastSpinResultIndex(null);
      }
      
      setGameState('roulette');
    }
  }, [currentParticipant, gameSession, gameState, resetPrizeFeedback, setCurrentQuestion, setLastSpinResultIndex, setGameState]); // [modificación] Agregar dependencias faltantes

  // [modificación] NUEVO: Detectar cuando cambia el participante y limpiar estados residuales
  useEffect(() => {
    // Solo ejecutar cuando hay un participante válido y es diferente al anterior
    if (currentParticipant && currentParticipant.nombre !== 'Pendiente') {
      console.log(`🎮 TV: Nuevo participante detectado: ${currentParticipant.nombre}, limpiando estados residuales...`);
      console.log(`🎮 TV: Estado actual del juego antes de limpiar: ${gameState}`);
      console.log(`🎮 TV: prizeFeedback antes de limpiar:`, prizeFeedback);
      
      // Limpiar cualquier estado residual de juegos anteriores
      resetPrizeFeedback();
      setCurrentQuestion(null);
      setLastSpinResultIndex(null);
      
      console.log(`🎮 TV: Estados limpiados para ${currentParticipant.nombre}`);
      
      // Asegurar que el estado sea 'roulette' para nuevo participante
      if (gameState !== 'roulette') {
        console.log(`🎮 TV: Estableciendo gameState a 'roulette' para nuevo participante: ${currentParticipant.nombre}`);
        setGameState('roulette');
      }
    }
  }, [currentParticipant, resetPrizeFeedback, setCurrentQuestion, setLastSpinResultIndex, setGameState, gameState, prizeFeedback]); // [modificación] Usar currentParticipant completo en lugar de propiedades individuales

  // [modificación] Función para manejar el giro de la ruleta
  const handleSpin = () => {
    if (rouletteRef.current) {
      console.log('📺 TV: Iniciando giro de ruleta desde TV...');
      // [modificación] Asegurar que estamos en estado de ruleta antes de girar
      setGameState('roulette');
      rouletteRef.current.spin();
    } else {
      console.warn('📺 TV: No se pudo acceder a la referencia de la ruleta');
    }
  };

  // [modificación] Cargar preguntas para la ruleta y establecerlas en el store
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoadingQuestions(true);
        const response = await fetch('/api/questions');
        if (!response.ok) {
          throw new Error('Error al cargar preguntas');
        }
        const data = await response.json();
        const loadedQuestions = data.questions || [];
        setQuestions(loadedQuestions);
        // [modificación] También establecer en gameStore
        setQuestionsInStore(loadedQuestions);
      } catch (error) {
        console.error('TVRouletteScreen: Error al cargar preguntas:', error);
        // [modificación] Preguntas por defecto con estructura correcta según los tipos
        const fallbackQuestions = [
          { 
            id: '1', 
            category: 'Medicina General', 
            text: 'Pregunta ejemplo de medicina general', 
            options: [
              { text: 'Opción A', correct: true },
              { text: 'Opción B', correct: false },
              { text: 'Opción C', correct: false },
              { text: 'Opción D', correct: false }
            ], 
            prize: 'Premio ejemplo' 
          },
          { 
            id: '2', 
            category: 'Cardiología', 
            text: 'Pregunta ejemplo de cardiología', 
            options: [
              { text: 'Opción A', correct: true },
              { text: 'Opción B', correct: false },
              { text: 'Opción C', correct: false },
              { text: 'Opción D', correct: false }
            ], 
            prize: 'Premio cardiología' 
          },
          { 
            id: '3', 
            category: 'Neurología', 
            text: 'Pregunta ejemplo de neurología', 
            options: [
              { text: 'Opción A', correct: true },
              { text: 'Opción B', correct: false },
              { text: 'Opción C', correct: false },
              { text: 'Opción D', correct: false }
            ], 
            prize: 'Premio neurología' 
          },
        ];
        setQuestions(fallbackQuestions);
        // [modificación] También establecer en gameStore
        setQuestionsInStore(fallbackQuestions);
      } finally {
        setLoadingQuestions(false);
      }
    };

    if (isMounted) {
      loadQuestions();
    }
  }, [isMounted, setQuestionsInStore]); // [modificación] Agregar setQuestionsInStore a dependencias

  // [modificación] useEffect para logging cuando el estado es 'prize' (evitar logs en cada render)
  useEffect(() => {
    if (gameState === 'prize') {
      const componentIdValue = componentId.current;
      console.log(`🎁 TV [${componentIdValue}]: Estado cambió a 'prize' - mostrando modal de premio...`);
      console.log(`🎁 TV [${componentIdValue}]: prizeFeedback:`, prizeFeedback);
      console.log(`🎁 TV [${componentIdValue}]: answeredCorrectly:`, prizeFeedback.answeredCorrectly);
    }
  }, [gameState, prizeFeedback]); // [modificación] Agregar prizeFeedback completo a dependencias

  // [modificación] NUEVO: Detectar y corregir estado inconsistente (gameState: prize pero answeredCorrectly: null)
  // [modificación] SIMPLIFICADO: Ahora TVScreen limpia estados, esto es solo fallback
  useEffect(() => {
    if (gameState === 'prize' && (prizeFeedback.answeredCorrectly === null || typeof prizeFeedback.answeredCorrectly === 'undefined')) {
      console.warn(`🎮 TV: Estado inconsistente detectado (fallback) - gameState: ${gameState}, answeredCorrectly: ${prizeFeedback.answeredCorrectly}`);
      console.log(`🎮 TV: Aplicando corrección de emergencia - cambiando a 'roulette'`);
      
      // Reset emergencia más agresivo
      setTimeout(() => {
        resetPrizeFeedback();
        setGameState('roulette');
      }, 0);
    }
  }, [gameState, prizeFeedback.answeredCorrectly, resetPrizeFeedback, setGameState]);

  // [modificación] useEffect para logging de transiciones de estado más detallado (controlado)
  useEffect(() => {
    if (isMounted) {
      const componentIdValue = componentId.current;
      console.log(`🎮 TV [${componentIdValue}]: Estado del juego cambió a: ${gameState}`);
      if (gameState === 'question' && currentQuestion) {
        console.log(`📝 TV [${componentIdValue}]: Mostrando pregunta: ${currentQuestion.category}`);
      }
    }
  }, [gameState, currentQuestion, isMounted]); // [modificación] Agregar dependencias necesarias

  if (!isMounted || loadingQuestions) {
    return <LoadingScreen />;
  }

  // [modificación] Mostrar PrizeModal cuando el estado es 'prize' (sin logs aquí)
  // CRUCIAL: Solo mostrar si realmente hay un resultado de pregunta válido
  if (gameState === 'prize' && prizeFeedback.answeredCorrectly !== null && typeof prizeFeedback.answeredCorrectly !== 'undefined') {
    return (
      <div className="min-h-screen">
        <PrizeModal />
      </div>
    );
  }

  // [modificación] Mostrar pregunta si el estado del juego es 'question' y hay una pregunta actual
  if (gameState === 'question' && currentQuestion) {
    return (
      <div className="min-h-screen">
        <QuestionDisplay question={currentQuestion} />
      </div>
    );
  }

  // [modificación] Mostrar ruleta por defecto
  return (
    <div className="flex flex-col min-h-screen">
      {/* [modificación] Header con logo optimizado para TV 65" */}
      <header className="w-full flex justify-center items-center min-h-[120px] border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-[300px] w-full flex justify-center items-center">
          <Logo
            size="auto"
            animated={true}
            withShadow={true}
            className="w-full h-auto"
          />
        </div>
      </header>

      {/* [modificación] Contenido principal optimizado para TV 65" */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-8 py-12">
        <MotionDiv
          key="tv-roulette"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full flex flex-col items-center justify-center max-w-7xl mx-auto"
          role="main"
          aria-label="Pantalla de ruleta para TV"
        >
          {/* [modificación] Contenedor de la ruleta con tamaño optimizado para TV 65" */}
          <MotionDiv
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-4xl mx-auto mb-16"
          >
            {questions.length > 0 ? (
              <RouletteWheel 
                questions={questions} 
                ref={rouletteRef}
              />
            ) : (
              <div className="text-white text-3xl text-center">
                Cargando categorías...
              </div>
            )}
          </MotionDiv>

          {/* [modificación] Botón "¡Girar la Ruleta!" con animaciones mejoradas para TV */}
          <MotionDiv
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative"
          >
            {/* [modificación] Efecto de brillo animado para TV */}
            <div className="absolute -inset-4 bg-gradient-to-r from-green-400 via-teal-300 to-blue-500 rounded-3xl opacity-70 blur-xl animate-pulse"></div>
            
            <Button
              variant="gradient"
              className="relative px-16 py-8 text-3xl font-extrabold shadow-2xl rounded-2xl
               bg-gradient-to-r from-teal-400 via-green-400 to-emerald-500
               border-4 border-white/30 hover:border-white/60
               animate-pulse-subtle spin-button-glow
               hover:shadow-[0_0_25px_10px_rgba(16,185,129,0.6)]
               transform hover:scale-105 transition-all duration-300"
              onClick={handleSpin}
              touchOptimized
            >
              <span className="inline-block mr-4 -mt-1 align-middle">
                <RouletteWheelIcon className="w-10 h-10" />
              </span>
              ¡Girar la Ruleta!
            </Button>
          </MotionDiv>

          {/* [modificación] Texto de instrucciones optimizado para TV 65" */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-12 text-center text-white/80"
          >
            <p className="text-2xl font-medium">
              ¡Pulsa el botón para hacer girar la ruleta!
            </p>
            <p className="text-xl mt-4 text-white/60">
              Selecciona una categoría médica al azar
            </p>
          </MotionDiv>
        </MotionDiv>
      </main>
    </div>
  );
} 