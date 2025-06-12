'use client';

import { useState, useEffect, useRef } from 'react';
// Eliminado: import de lógica de premios - no la necesitamos
import WaitingScreen from '@/components/tv/screens/WaitingScreen';
import RouletteWheel from '@/components/game/RouletteWheel';
import QuestionDisplay from '@/components/game/QuestionDisplay';
import PrizeModal from '@/components/game/PrizeModal';
import RouletteWheelIcon from '@/components/ui/RouletteWheelIcon';
import { Question } from '@/types';
import { MotionDiv } from '@/components/tv/shared/MotionComponents';
import { useGameStore } from '@/store/gameStore';

type TVScreen = 'waiting' | 'roulette' | 'question' | 'prize';

/**
 * Página TV 100% local - sin Supabase
 * Flujo: waiting → roulette → question → prize único por sesión
 */
export default function TVPage() {
  const [screen, setScreen] = useState<TVScreen>('waiting');
  const [questions, setLocalQuestions] = useState<Question[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isTabletPortrait, setIsTabletPortrait] = useState(false);
  const rouletteRef = useRef<{ spin: () => void }>(null);

  // Estados del store global que necesitamos observar
  const currentQuestion = useGameStore((state) => state.currentQuestion);
  const lastSpinResultIndex = useGameStore((state) => state.lastSpinResultIndex);
  const prizeFeedback = useGameStore((state) => state.prizeFeedback);
  const gameState = useGameStore((state) => state.gameState);
  
  // Acciones del store
  const setCurrentQuestion = useGameStore((state) => state.setCurrentQuestion);
  const resetPrizeFeedback = useGameStore((state) => state.resetPrizeFeedback);
  const setLastSpinResultIndex = useGameStore((state) => state.setLastSpinResultIndex);
  const setStoreQuestions = useGameStore((state) => state.setQuestions);

  // Detectar tablets en orientación vertical
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      const isTabletPortraitResolution = 
        width >= 768 && width <= 1200 && 
        height > width && 
        height >= 1000 && 
        !((width >= 2160 && height >= 3840) || (width >= 3840 && height >= 2160));
      
      setIsTabletPortrait(isTabletPortraitResolution);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cargar preguntas al montar
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch('/api/questions');
        if (!response.ok) throw new Error('Error al cargar preguntas');
        const data = await response.json();
        const loadedQuestions = data.questions || [];
        setLocalQuestions(loadedQuestions);
        setStoreQuestions(loadedQuestions); // También guardar en el store
      } catch (error) {
        console.error('Error al cargar preguntas:', error);
        // Preguntas de respaldo con estructura correcta
        const fallbackQuestions: Question[] = [
          {
            id: '1',
            category: 'Salud General',
            text: '¿Cuál es la mejor forma de mantener una buena salud?',
            options: [
              { text: 'Ejercicio regular', correct: true },
              { text: 'Comer solo dulces', correct: false },
              { text: 'Dormir 2 horas', correct: false },
              { text: 'No beber agua', correct: false }
            ],
            explanation: 'El ejercicio regular es fundamental para mantener una buena salud.',
            prize: 'Premio Especial'
          }
        ];
        setLocalQuestions(fallbackQuestions);
        setStoreQuestions(fallbackQuestions); // También guardar en el store
      }
    };

    loadQuestions();
  }, [setStoreQuestions]);

  // Observar cambios en lastSpinResultIndex para detectar cuando la ruleta termina
  useEffect(() => {
    if (lastSpinResultIndex !== null && questions.length > 0 && screen === 'roulette') {
      const selectedQuestion = questions[lastSpinResultIndex % questions.length];
      if (selectedQuestion) {
        console.log(`Ruleta se detuvo en índice: ${lastSpinResultIndex}`);
        console.log(`Pregunta seleccionada: ${selectedQuestion.category}`);
        setCurrentQuestion(selectedQuestion);
        setScreen('question');
      }
    }
  }, [lastSpinResultIndex, questions, screen, setCurrentQuestion]);

  // SIMPLIFICADO: Solo manejar respuestas correctas/incorrectas - SIN premios
  useEffect(() => {
    if (prizeFeedback.answeredCorrectly !== null && screen === 'question') {
      const isCorrect = prizeFeedback.answeredCorrectly;
      
      // IMPORTANTE: Dar tiempo para ver el efecto verde/rojo antes del modal
      console.log(isCorrect ? '✅ Respuesta correcta!' : '❌ Respuesta incorrecta!');
      console.log('⏱️ Esperando 2 segundos para mostrar el efecto visual...');
      
      setTimeout(() => {
        console.log('🎭 Mostrando modal de resultado');
        // Sincronizar gameState global con screen local
        const setGameState = useGameStore.getState().setGameState;
        setGameState('prize');
        setScreen('prize');
      }, 2000); // 2 segundos para ver el efecto visual
    }
  }, [prizeFeedback.answeredCorrectly, screen]);

  // SIMPLIFICADO: Manejar acciones del modal - SIN auto-cierre
  useEffect(() => {
    if (screen === 'prize') {
      if (gameState === 'screensaver') {
        // "Volver al inicio" presionado - NUEVA partida limpia
        console.log('🏠 Volver al inicio - iniciando nueva partida');
        setScreen('waiting');
        setCurrentQuestion(null);
        setLastSpinResultIndex(null);
        resetPrizeFeedback();
        // Resetear gameState global
        const setGameState = useGameStore.getState().setGameState;
        setGameState('screensaver');
      } else if (gameState === 'roulette') {
        // "Volver a jugar" presionado - continuar con la misma partida
        console.log('🎮 Volver a jugar - misma partida');
        resetPrizeFeedback();
        setCurrentQuestion(null);
        setLastSpinResultIndex(null);
        setScreen('roulette');
      }
    }
  }, [gameState, screen, setCurrentQuestion, setLastSpinResultIndex, resetPrizeFeedback]);

  // Función para girar la ruleta
  const handleSpin = () => {
    if (rouletteRef.current && !isSpinning) {
      console.log('Iniciando giro de ruleta...');
      rouletteRef.current.spin();
    }
  };

  // [MODIFICACIÓN] Pantalla de espera SIN mensaje overlay - solo funcionalidad de touch
  if (screen === 'waiting') {
    return (
      <div 
        onPointerDown={() => {
          // Activar fullscreen y cambiar a ruleta
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(console.error);
          }
          setScreen('roulette');
        }} 
        className="h-screen flex items-center justify-center bg-[#192A6E] text-white cursor-pointer relative"
      >
        <WaitingScreen />
        {/* [REMOVIDO] Overlay del mensaje - solo mantenemos la funcionalidad de touch */}
      </div>
    );
  }

  // [MODIFICACIÓN] Pantalla de ruleta SIN LOGO - optimizada para pantalla completa
  if (screen === 'roulette') {
    return (
      <div className="flex flex-col min-h-screen w-full bg-main-gradient">
        {/* ELIMINADO: Header con logo - ahora todo el espacio es para la ruleta */}

        {/* Contenido principal: ruleta y botón - PANTALLA COMPLETA */}
        <main className="flex-1 flex flex-col items-center justify-center w-full min-h-0 px-2 py-4">
          <div className="w-full flex flex-col items-center justify-center flex-1 space-y-6 md:space-y-8 lg:space-y-12">
            <MotionDiv
              key="tv-roulette"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col items-center justify-center space-y-6 md:space-y-8 lg:space-y-12"
            >
              {/* Contenedor de la ruleta - TAMAÑO MAXIMIZADO PARA TODA LA PANTALLA */}
              <MotionDiv
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full aspect-square flex justify-center"
                style={{
                  maxWidth: isTabletPortrait ? '600px' : '70vmin',
                  width: isTabletPortrait ? 'min(600px, 90vw)' : 'min(70vmin, 90vw)',
                  height: isTabletPortrait ? 'min(600px, 90vw)' : 'min(70vmin, 90vw)'
                }}
              >
                {questions.length > 0 ? (
                  <RouletteWheel 
                    questions={questions}
                    ref={rouletteRef}
                    onSpinStateChange={setIsSpinning}
                  />
                ) : (
                  <div className="text-white text-center font-bold text-lg md:text-xl lg:text-2xl">
                    Cargando categorías...
                  </div>
                )}
              </MotionDiv>

              {/* Botón "¡Girar la Ruleta!" - TAMAÑO AUMENTADO */}
              <MotionDiv
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="relative flex justify-center w-full"
              >
                <button
                  className={`
                    font-bold lg:font-black text-white
                    bg-gradient-to-r from-blue-600 to-purple-600
                    hover:from-blue-700 hover:to-purple-700
                    text-lg md:text-xl lg:text-2xl xl:text-3xl
                    px-6 py-3 md:px-8 md:py-4 lg:px-12 lg:py-6
                    min-h-[60px] md:min-h-[80px] lg:min-h-[100px]
                    min-w-[200px] md:min-w-[300px] lg:min-w-[400px]
                    rounded-xl md:rounded-2xl lg:rounded-3xl
                    shadow-2xl transform transition-all duration-200
                    hover:scale-105 hover:shadow-xl
                    focus:outline-none focus:ring-4 focus:ring-blue-300
                    ${isSpinning ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onClick={handleSpin}
                  disabled={isSpinning}
                >
                  <span className="inline-block mr-2 md:mr-3 lg:mr-4 -mt-1 align-middle">
                    <RouletteWheelIcon 
                      className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10"
                      size={isTabletPortrait ? 24 : 32}
                    />
                  </span>
                  {isSpinning ? '¡Girando...' : '¡Girar la Ruleta!'}
                </button>
              </MotionDiv>
            </MotionDiv>
          </div>
        </main>

        {/* Footer mínimo */}
        <footer className="w-full flex-shrink-0 py-2 text-center">
          <div className="text-white/60 text-sm md:text-base lg:text-lg">
            Modo de prueba local
          </div>
        </footer>
      </div>
    );
  }

  // Pantalla de pregunta
  if (screen === 'question' && currentQuestion) {
    return <QuestionDisplay question={currentQuestion} />;
  }

  // Pantalla de premio
  if (screen === 'prize') {
    return (
      <div className="min-h-screen relative">
        <PrizeModal />
      </div>
    );
  }

  return null;
} 