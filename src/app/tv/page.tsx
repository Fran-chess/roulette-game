'use client';

import { useState, useEffect, useRef } from 'react';
// Eliminado: import de lógica de premios - no la necesitamos
import WaitingScreen from '@/components/tv/screens/WaitingScreen';
import RouletteWheel from '@/components/game/RouletteWheel';
import QuestionDisplay from '@/components/game/QuestionDisplay';
import PrizeModal from '@/components/game/PrizeModal';
import Logo from '@/components/ui/Logo';
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

  // Pantalla de espera con toque para comenzar
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
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="text-center">
            <div className="text-6xl font-bold mb-8 text-white drop-shadow-2xl">
              ¡Toca la pantalla para comenzar!
            </div>
            <div className="text-3xl opacity-80 text-white drop-shadow-lg">
              Presiona en cualquier lugar
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de ruleta
  if (screen === 'roulette') {
    return (
      <div className="flex flex-col min-h-screen w-full bg-main-gradient">
        {/* Header con logo */}
        <header className="w-full flex justify-center items-center pt-24 pb-6">
          <div className="w-full max-w-5xl flex justify-center items-center">
            <Logo size="lg" animated={true} withShadow={true} className="w-full h-auto" />
          </div>
        </header>

        {/* Contenido principal: ruleta y botón */}
        <main className="flex-1 flex flex-col items-center justify-center w-full px-8">
          <div className="w-full max-w-[1800px] flex flex-col items-center justify-center space-y-16">
            <MotionDiv
              key="tv-roulette"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col items-center justify-center space-y-12"
            >
              {/* Contenedor de la ruleta */}
              <MotionDiv
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full max-w-none flex justify-center"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxWidth: '55vh',
                  maxHeight: '55vh',
                  minWidth: '2000px',
                  minHeight: '2000px',
                }}
              >
                {questions.length > 0 ? (
                  <RouletteWheel 
                    questions={questions}
                    ref={rouletteRef}
                    onSpinStateChange={setIsSpinning}
                  />
                ) : (
                  <div className="text-white text-8xl text-center font-bold">
                    Cargando categorías...
                  </div>
                )}
              </MotionDiv>

              {/* Botón "¡Girar la Ruleta!" */}
              <MotionDiv
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="relative flex justify-center"
              >
                <button
                  className={`
                    px-16 py-8 text-6xl font-black text-white
                    bg-gradient-to-r from-blue-600 to-purple-600
                    rounded-3xl shadow-2xl transform transition-all duration-200
                    hover:scale-105 hover:shadow-3xl
                    focus:outline-none focus:ring-8 focus:ring-blue-300
                    ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-700 hover:to-purple-700'}
                  `}
                  onClick={handleSpin}
                  disabled={isSpinning}
                >
                  <span className="inline-block mr-8 -mt-3 align-middle">
                    <RouletteWheelIcon className="w-28 h-28" size={112} />
                  </span>
                  {isSpinning ? '¡Girando...' : '¡Girar la Ruleta!'}
                </button>
              </MotionDiv>
            </MotionDiv>
          </div>
        </main>

        {/* Footer invisible */}
        <footer className="h-[5vh] min-h-[100px] w-full"></footer>
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