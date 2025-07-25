'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
// Eliminado: import de lógica de premios - no la necesitamos
import WaitingScreen from '@/components/tv/screens/WaitingScreen';
import TransitionScreen from '@/components/tv/screens/TransitionScreen';
import RouletteWheel from '@/components/game/RouletteWheel';
import QuestionDisplay from '@/components/game/QuestionDisplay';
import PrizeModal from '@/components/game/PrizeModal';
import RouletteWheelIcon from '@/components/ui/RouletteWheelIcon';
import Logo from '@/components/ui/Logo'; // [AGREGADO] Importar el logo
import { Question, Participant } from '@/types';
import { MotionDiv } from '@/components/tv/shared/MotionComponents';
import { useGameStore } from '@/store/gameStore';
import { supabaseClient } from '@/lib/supabase';
// [OPTIMIZADO] Importar loggers optimizados para producción
import { tvLogger, tvProdLogger } from '@/utils/tvLogger';

type TVScreen = 'waiting' | 'roulette' | 'question' | 'prize' | 'transition';

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
  const currentParticipant = useGameStore((state) => state.currentParticipant);
  const gameState = useGameStore((state) => state.gameState);
  const waitingQueue = useGameStore((state) => state.waitingQueue);
  const gameSession = useGameStore((state) => state.gameSession);
  
  // Acciones del store
  const setCurrentQuestion = useGameStore((state) => state.setCurrentQuestion);
  const resetPrizeFeedback = useGameStore((state) => state.resetPrizeFeedback);
  const setLastSpinResultIndex = useGameStore((state) => state.setLastSpinResultIndex);
  const setStoreQuestions = useGameStore((state) => state.setQuestions);
  const setGameState = useGameStore((state) => state.setGameState);
  const setCurrentParticipant = useGameStore((state) => state.setCurrentParticipant);
  const addToQueue = useGameStore((state) => state.addToQueue);
  const loadQueueFromDB = useGameStore((state) => state.loadQueueFromDB);
  const fetchActiveSession = useGameStore((state) => state.fetchActiveSession);
  const setGameSession = useGameStore((state) => state.setGameSession);

  // --- FUNCIÓN CENTRALIZADA PARA CAMBIO DE PANTALLA ---
  const goToScreen = useCallback((next: TVScreen) => {
    tvLogger.session(`TV-SCREEN: Cambiando de pantalla a: ${next}`);
    setScreen(next);
    // Actualizar gameState apropiadamente para cada pantalla
    if (next === 'roulette') {
      tvLogger.session('TV-SCREEN: Estableciendo gameState a "roulette"');
      setGameState('roulette');
    } else if (next === 'waiting') {
      tvLogger.session('TV-SCREEN: Estableciendo gameState a "waiting"');
      setGameState('waiting');
    } else if (next === 'prize') {
      tvLogger.session('TV-SCREEN: Estableciendo gameState a "prize"');
      setGameState('prize');
    } else if (next === 'question') {
      tvLogger.session('TV-SCREEN: Estableciendo gameState a "question"');
      setGameState('question');
    } else if (next === 'transition') {
      tvLogger.session('TV-SCREEN: Estableciendo gameState a "transition"');
      setGameState('transition');
    }
  }, [setGameState]);

  // --- CONEXIÓN CON PANEL ADMIN (SOLO ESTO ES NUEVO) ---
  useEffect(() => {
    if (!supabaseClient) return;


    // Polling para detectar participantes
    const processedParticipants: Set<string> = new Set();

    const checkForParticipants = async () => {
      try {
        // [FIX] También detectar participantes cuando currentParticipant es null (no solo en waiting)
        const { currentParticipant, gameState } = useGameStore.getState();
        
        // Buscar participantes siempre, excepto durante transiciones
        if (gameState !== 'transition') {
          console.log('🔍 TV-POLLING: Verificando participantes...', { screen, gameState, currentParticipant: currentParticipant?.nombre || 'null' });
          tvLogger.participant(`TV-POLLING: Verificando participantes... screen: ${screen}, gameState: ${gameState}, currentParticipant: ${currentParticipant?.nombre || 'null'}`);
          const { data: allParticipants, error: allError } = await supabaseClient
            .from('participants')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
            
          if (allError) {
            tvProdLogger.error('ADMIN-CONNECTION: Error al consultar participantes:', allError);
            return;
          }
          
          // Buscar participantes que estén listos para jugar (registered o playing sin completed_at)
          const readyParticipants = allParticipants?.filter(p => 
            (p.status === 'registered' || p.status === 'playing') && 
            !p.completed_at // No incluir participantes que ya terminaron
          ) || [];
          if (readyParticipants.length > 0) {
            // Verificar cada participante para agregarlo a la cola si no está ya
            for (const participant of readyParticipants) {
              const typedParticipant = participant as unknown as Participant;
              
              // Verificar si ya es el participante activo
              if (currentParticipant && typedParticipant.id === currentParticipant.id) {
                continue; // Skip, ya es el participante activo
              }
              
              // Verificar si ya está en la cola
              if (waitingQueue.some(p => p.id === typedParticipant.id)) {
                continue; // Skip, ya está en la cola
              }
              
              // Verificar si ya fue procesado
              if (processedParticipants.has(typedParticipant.id)) {
                continue; // Skip, ya fue procesado
              }
              
              // Nuevo participante - agregarlo a la cola
              processedParticipants.add(typedParticipant.id);
              console.log('🔍 TV-POLLING: Nuevo participante detectado, añadiendo a cola:', typedParticipant.nombre);
              tvLogger.participant(`TV-PARTICIPANT-DETECTED: Nuevo participante detectado: ${typedParticipant.nombre}`);
              
              await addToQueue(typedParticipant);
            }
          } else {
            // [FIX] Si no hay participantes y no hay currentParticipant, limpiar procesados
            if (!currentParticipant && processedParticipants.size > 0) {
              console.log('🔍 TV-POLLING: No hay participantes, limpiando procesados');
              tvLogger.participant('TV-POLLING: No hay participantes, limpiando procesados');
              processedParticipants.clear();
            }
          }
        } else {
          console.log('🔍 TV-POLLING: Skipping - en estado de transición', {
            screen,
            gameState
          });
        }
      } catch (error) {
        tvProdLogger.error('ADMIN-CONNECTION: Error en polling:', error);
      }
    };

    // Ejecutar inmediatamente y luego cada 2 segundos (más rápido)
    checkForParticipants();
    const pollingIntervalRef = setInterval(checkForParticipants, 2000);

    return () => {
      if (pollingIntervalRef) {
        clearInterval(pollingIntervalRef);
      }
    };
  }, [screen, goToScreen, setCurrentParticipant, addToQueue, waitingQueue]);

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
          tvProdLogger.error('TVPage: Formato de preguntas inválido:', data);
        }
      } catch (error) {
        tvProdLogger.error('TVPage: Error cargando preguntas:', error);
      }
    };

    loadQuestions();
  }, [setStoreQuestions]);

  // Obtener sesión activa al montar el componente
  useEffect(() => {
    const initSession = async () => {
      if (!gameSession) {
        console.log('📥 TV-INIT: Buscando sesión activa...');
        const activeSession = await fetchActiveSession();
        if (activeSession) {
          console.log('📥 TV-INIT: Sesión activa encontrada:', activeSession.session_id);
          setGameSession(activeSession);
        } else {
          console.log('📥 TV-INIT: No hay sesión activa');
        }
      }
    };

    initSession();
  }, [fetchActiveSession, gameSession, setGameSession]); // Solo ejecutar una vez al montar

  // Cargar cola desde BD cuando hay sesión activa
  useEffect(() => {
    const loadQueue = async () => {
      if (gameSession?.session_id) {
        console.log('📥 TV-INIT: Cargando cola desde BD para sesión:', gameSession.session_id);
        await loadQueueFromDB(gameSession.session_id);
        console.log('📥 TV-INIT: Cola cargada, estado actual:', {
          waitingQueue: waitingQueue.length,
          currentParticipant: currentParticipant?.nombre || 'null'
        });
      }
    };

    loadQueue();
  }, [gameSession?.session_id, loadQueueFromDB, waitingQueue.length, currentParticipant?.nombre]); // Solo depender del session_id

  // Limpiar al montar el componente
  useEffect(() => {
    resetPrizeFeedback();
    setCurrentQuestion(null);
    setLastSpinResultIndex(null);
  }, [resetPrizeFeedback, setCurrentQuestion, setLastSpinResultIndex]);

  // NUEVO: Sync screen state with gameState for better consistency
  useEffect(() => {
    console.log('📺 TV-SYNC: Sincronizando estados', {
      gameState,
      screen,
      currentParticipant: currentParticipant?.nombre || 'null'
    });
    
    // Sync TV screen with gameState when necessary
    if (gameState === 'screensaver' && screen !== 'waiting') {
      console.log('📺 TV-SYNC: GameState is screensaver, cambiando a waiting screen');
      tvLogger.session('TV-TRANSITION: GameState is screensaver, showing waiting screen');
      goToScreen('waiting');
    } else if (gameState === 'transition' && screen !== 'transition') {
      console.log('📺 TV-SYNC: GameState is transition, cambiando a transition screen');
      tvLogger.session('TV-TRANSITION: GameState is transition, showing transition screen');
      setScreen('transition');
    } else if (gameState === 'inGame' && currentParticipant && screen !== 'roulette') {
      console.log('📺 TV-SYNC: GameState is inGame with participant, cambiando a roulette');
      tvLogger.session('TV-TRANSITION: GameState is inGame with participant, showing roulette');
      goToScreen('roulette');
    }
  }, [currentParticipant, gameState, screen, goToScreen]);

  // Gestionar transiciones entre pantallas basadas en el lastSpinResultIndex
  useEffect(() => {
    if (lastSpinResultIndex !== null && questions.length > 0 && screen === 'roulette') {
      tvLogger.game(`TVPage: Giro completado, mostrando pregunta. Índice: ${lastSpinResultIndex}`);
      
      if (lastSpinResultIndex >= 0 && lastSpinResultIndex < questions.length) {
        const selectedQuestion = questions[lastSpinResultIndex];
        tvLogger.game('TVPage: Pregunta seleccionada:', selectedQuestion);
        setCurrentQuestion(selectedQuestion);
        setScreen('question');
      } else {
        tvProdLogger.error(`TVPage: Índice de pregunta fuera de rango: ${lastSpinResultIndex}`);
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
      tvLogger.game('TVPage: Iniciando giro de ruleta');
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
      tvProdLogger.error('TVPage: Error en fullscreen:', e);
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

        {/* Contenedor principal con máximo espacio para la ruleta */}
        <main className="flex-1 flex flex-col items-center justify-between w-full px-2 py-2">
          
          {/* Contenedor de la ruleta MUY grande */}
          <MotionDiv
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 w-full flex justify-center items-center min-h-[500px]"
          >
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ minWidth: '500px', minHeight: '500px' }}
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

          {/* Botón "¡Girar la Ruleta!" con animación y separación del borde */}
          <MotionDiv
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="w-full flex justify-center pb-6"
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
      </div>
    );
  }

  // Pantalla de transición
  if (screen === 'transition') {
    return <TransitionScreen />;
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