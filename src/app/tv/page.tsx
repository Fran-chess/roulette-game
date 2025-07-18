'use client';

import { useState, useEffect, useRef } from 'react';
// Eliminado: import de lógica de premios - no la necesitamos
import WaitingScreen from '@/components/tv/screens/WaitingScreen';
import RouletteWheel from '@/components/game/RouletteWheel';
import QuestionDisplay from '@/components/game/QuestionDisplay';
import PrizeModal from '@/components/game/PrizeModal';
import RouletteWheelIcon from '@/components/ui/RouletteWheelIcon';
import Logo from '@/components/ui/Logo'; // [AGREGADO] Importar el logo
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
  
  // Acciones del store
  const setCurrentQuestion = useGameStore((state) => state.setCurrentQuestion);
  const resetPrizeFeedback = useGameStore((state) => state.resetPrizeFeedback);
  const setLastSpinResultIndex = useGameStore((state) => state.setLastSpinResultIndex);
  const setStoreQuestions = useGameStore((state) => state.setQuestions);
  const setGameState = useGameStore((state) => state.setGameState);

  // --- FUNCIÓN CENTRALIZADA PARA CAMBIO DE PANTALLA ---
  function goToScreen(next: TVScreen) {
    setScreen(next);
    // Actualizar gameState apropiadamente para cada pantalla
    if (next === 'roulette') {
      setGameState('roulette');
    } else if (next === 'waiting') {
      setGameState('screensaver');
    } else if (next === 'prize') {
      setGameState('prize');
    } else if (next === 'question') {
      setGameState('question');
    }
  }


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
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar preguntas desde JSON local
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch('/api/questions');
        if (!response.ok) throw new Error('Error al cargar preguntas');
        const data = await response.json();
        
        
        if (data.questions && Array.isArray(data.questions)) {
          setLocalQuestions(data.questions);
          setStoreQuestions(data.questions);
        } else {
          console.error('[TVPage] Formato de preguntas inválido:', data);
        }
      } catch (error) {
        console.error('[TVPage] Error cargando preguntas:', error);
      }
    };

    loadQuestions();
  }, [setStoreQuestions]);

  // Limpiar al montar el componente
  useEffect(() => {
    resetPrizeFeedback();
    setCurrentQuestion(null);
    setLastSpinResultIndex(null);
  }, [resetPrizeFeedback, setCurrentQuestion, setLastSpinResultIndex]);

  // Gestionar transiciones entre pantallas basadas en el lastSpinResultIndex
  useEffect(() => {
    if (lastSpinResultIndex !== null && questions.length > 0 && screen === 'roulette') {
      console.log('[TVPage] Giro completado, mostrando pregunta. Índice:', lastSpinResultIndex);
      
      if (lastSpinResultIndex >= 0 && lastSpinResultIndex < questions.length) {
        const selectedQuestion = questions[lastSpinResultIndex];
        console.log('[TVPage] Pregunta seleccionada:', selectedQuestion);
        setCurrentQuestion(selectedQuestion);
        setScreen('question');
      } else {
        console.warn('[TVPage] Índice de pregunta fuera de rango:', lastSpinResultIndex);
      }
    }
  }, [lastSpinResultIndex, questions, screen, setCurrentQuestion]);

  // NUEVO: Hook para navegación por touch/teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (screen === 'waiting' && (event.key === 'Enter' || event.key === ' ')) {
        setScreen('roulette');
      }
    };

    const handleGlobalTouch = () => {
      if (screen === 'waiting') {
        setScreen('roulette');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleGlobalTouch);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleGlobalTouch);
    };
  }, [screen]);

  // Manejar giro de la ruleta
  const handleSpin = () => {
    if (rouletteRef.current && !isSpinning) {
      console.log('[TVPage] Iniciando giro de ruleta');
      rouletteRef.current.spin();
    }
  };



  const onPointerDown = () => {
    try {
      // [EXPERIMENTAL] Intentar entrar en modo pantalla completa si está disponible
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          // Fallo silencioso - no es crítico
        });
      }
    } catch (e) {
      console.log('[TVPage] Error en fullscreen:', e);
    }
    
    if (screen === 'waiting') {
      setScreen('roulette');
    }
  };


  // Pantalla de espera
  if (screen === 'waiting') {
    return (
      <div
        onPointerDown={onPointerDown}
        className="h-screen flex items-center justify-center bg-[#192A6E] text-white cursor-pointer relative"
      >
        <WaitingScreen />
        {/* [REMOVIDO] Overlay del mensaje - solo mantenemos la funcionalidad de touch */}
      </div>
    );
  }

  // [MODIFICACIÓN] Pantalla de ruleta CON LOGO - estructura completamente refactorizada
  if (screen === 'roulette') {
    return (
      <div className="min-h-screen w-full bg-main-gradient flex flex-col">

        {/* Header centrado con logo visible y espaciado optimizado */}
        <header className="w-full flex justify-center items-center pt-2 pb-1 px-4 flex-shrink-0">
          <Logo 
            size={isTabletPortrait ? "lg" : "lg"} 
            variant="subtle"
            animated={true}
            withShadow={true}
            className="transition-all duration-300 ease-out"
          />
        </header>

        {/* Contenedor principal centrado con espaciado reducido */}
        <main className="flex-1 flex flex-col items-center justify-start w-full px-4 py-1 gap-6">
          
          {/* Contenedor de la ruleta con animación */}
          <MotionDiv
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full flex justify-center items-center"
          >
            <div 
              className="aspect-square max-w-full"
              style={{
                width: isTabletPortrait 
                  ? 'min(480px, 75vw)' 
                  : 'min(65vmin, 85vw)',
                maxWidth: isTabletPortrait ? '480px' : '65vmin'
              }}
            >
              {questions.length > 0 ? (
                <RouletteWheel 
                  questions={questions}
                  ref={rouletteRef}
                  onSpinStateChange={setIsSpinning}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white text-center font-bold text-lg md:text-xl lg:text-2xl">
                    Cargando categorías...
                  </div>
                </div>
              )}
            </div>
          </MotionDiv>

          {/* Botón "¡Girar la Ruleta!" con animación */}
          <MotionDiv
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="w-full flex justify-center"
          >
            <button
              className={`
                neomorphic-button
                ${isTabletPortrait ? 'neomorphic-button-tablet' : 'neomorphic-button-mobile'}
                font-bold text-white
                bg-gradient-to-r from-blue-600 to-purple-600
                hover:from-blue-700 hover:to-purple-700
                transition-all duration-300
                ${isSpinning ? 'opacity-50 cursor-not-allowed spinning-state' : 'ready-to-spin'}
                ${isTabletPortrait 
                  ? 'text-xl px-8 py-4 min-h-[70px] min-w-[320px] rounded-2xl' 
                  : 'text-lg px-6 py-3 min-h-[60px] min-w-[240px] rounded-xl'
                }
                shadow-2xl hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300
              `}
              onClick={handleSpin}
              disabled={isSpinning}
            >
              <span className="inline-flex items-center gap-3">
                <RouletteWheelIcon 
                  className={`
                    roulette-icon-container
                    ${isSpinning ? 'roulette-icon-spinning' : 'roulette-icon-idle'}
                    ${isTabletPortrait ? 'w-7 h-7' : 'w-6 h-6'}
                  `}
                  size={isTabletPortrait ? 28 : 24}
                />
                <span className="font-bold">
                  {isSpinning ? '¡Girando...' : '¡Girar la Ruleta!'}
                </span>
              </span>
            </button>
          </MotionDiv>

        </main>

        {/* Footer minimalista centrado */}
        <footer className="w-full flex-shrink-0 py-3 text-center">
          <div className={`
            text-white/50 font-light tracking-wide
            ${isTabletPortrait ? 'text-sm' : 'text-xs'}
          `}>
            Modo de prueba local
          </div>
        </footer>

      </div>
    );
  }

  // Pantalla de pregunta
  if (screen === 'question' && currentQuestion) {
    return (
      <QuestionDisplay 
        question={currentQuestion}
        onAnswered={() => {
          setTimeout(() => {
            goToScreen('prize');
          }, 2500);
        }}
      />
    );
  }

  // Pantalla de premio
  if (screen === 'prize') {
    return (
      <div className="min-h-screen relative">
        <PrizeModal onGoToScreen={goToScreen} />
      </div>
    );
  }

  return null;
} 