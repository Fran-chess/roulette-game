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

  // [NUEVO] Estados para detección de dispositivo
  const [isTablet800, setIsTablet800] = useState(false);

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

  // [NUEVO] useEffect para detección de tablet 800x1340
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Detectar tablet 800x1340
      const isTablet800Resolution = (width >= 790 && width <= 810) && (height >= 1330 && height <= 1350);
      setIsTablet800(isTablet800Resolution);
      
      if (isTablet800Resolution) {
        console.log('📱 TVPage: Tablet 800x1340 detectada, aplicando optimizaciones específicas');
      }
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

  // [MODIFICACIÓN] Pantalla de ruleta optimizada para tablet 800x1340
  if (screen === 'roulette') {
    return (
      <div className="flex flex-col min-h-screen w-full bg-main-gradient">
        {/* Header con logo optimizado para tablet 800x1340 */}
        <header className={`w-full flex justify-center items-center ${
          isTablet800 ? 'pt-6 pb-2' : 'pt-24 pb-6'
        }`}>
          <div className={`w-full flex justify-center items-center ${
            isTablet800 ? 'max-w-3xl' : 'max-w-5xl'
          }`}>
            <Logo 
              size="lg" 
              animated={true} 
              withShadow={true} 
              className={`w-full h-auto ${isTablet800 ? 'logo-tablet-800' : ''}`}
            />
          </div>
        </header>

        {/* Contenido principal: ruleta y botón optimizado para tablet 800x1340 */}
        <main className={`flex-1 flex flex-col items-center justify-center w-full ${
          isTablet800 ? 'px-4' : 'px-8'
        }`}>
          <div className={`w-full flex flex-col items-center justify-center ${
            isTablet800 ? 'max-w-[700px] space-y-4' : 'max-w-[1800px] space-y-16'
          }`}>
            <MotionDiv
              key="tv-roulette"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`w-full flex flex-col items-center justify-center ${
                isTablet800 ? 'space-y-3' : 'space-y-12'
              }`}
            >
              {/* Contenedor de la ruleta optimizado para tablet 800x1340 - TAMAÑO AUMENTADO */}
              <MotionDiv
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full max-w-none flex justify-center"
                style={isTablet800 ? {
                  width: '100%',
                  height: 'auto',
                  maxWidth: '680px',  // Aumentado de 520px a 680px
                  maxHeight: '680px', // Aumentado de 520px a 680px
                  minWidth: '640px',  // Aumentado de 480px a 640px
                  minHeight: '640px', // Aumentado de 480px a 640px
                } : {
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
                  <div className={`text-white text-center font-bold ${
                    isTablet800 ? 'text-4xl' : 'text-8xl'
                  }`}>
                    Cargando categorías...
                  </div>
                )}
              </MotionDiv>

              {/* Botón "¡Girar la Ruleta!" optimizado para tablet 800x1340 */}
              <MotionDiv
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="relative flex justify-center"
              >
                <button
                  className={`
                    ${isTablet800 
                      ? 'px-10 py-5 text-2xl' 
                      : 'px-16 py-8 text-6xl'
                    } 
                    font-black text-white
                    bg-gradient-to-r from-blue-600 to-purple-600
                    ${isTablet800 ? 'rounded-2xl' : 'rounded-3xl'} 
                    shadow-2xl transform transition-all duration-200
                    hover:scale-105 hover:shadow-3xl
                    focus:outline-none focus:ring-8 focus:ring-blue-300
                    ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-700 hover:to-purple-700'}
                    ${isTablet800 ? 'min-h-[90px] min-w-[400px]' : ''}
                  `}
                  onClick={handleSpin}
                  disabled={isSpinning}
                  style={isTablet800 ? {
                    fontSize: '2rem',      // Aumentado de 1.8rem a 2rem
                    padding: '24px 40px', // Aumentado de 20px 32px a 24px 40px
                    minHeight: '90px',    // Aumentado de 80px a 90px
                    minWidth: '400px'     // Aumentado de 350px a 400px
                  } : {}}
                >
                  <span className={`inline-block align-middle ${
                    isTablet800 ? 'mr-4 -mt-1' : 'mr-8 -mt-3'
                  }`}>
                    <RouletteWheelIcon 
                      className={isTablet800 ? 'w-13 h-13' : 'w-28 h-28'} 
                      size={isTablet800 ? 52 : 112} 
                    />
                  </span>
                  {isSpinning ? '¡Girando...' : '¡Girar la Ruleta!'}
                </button>
              </MotionDiv>
            </MotionDiv>
          </div>
        </main>

        {/* Footer optimizado para tablet 800x1340 */}
        <footer className={`w-full ${
          isTablet800 ? 'h-[2vh] min-h-[30px]' : 'h-[5vh] min-h-[100px]'
        }`}></footer>
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