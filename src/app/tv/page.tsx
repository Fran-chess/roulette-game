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
  const transitionConfirmed = useGameStore((state) => state.transitionConfirmed);
  
  // Acciones del store
  const setCurrentQuestion = useGameStore((state) => state.setCurrentQuestion);
  const resetPrizeFeedback = useGameStore((state) => state.resetPrizeFeedback);
  const setLastSpinResultIndex = useGameStore((state) => state.setLastSpinResultIndex);
  const setStoreQuestions = useGameStore((state) => state.setQuestions);
  const setGameState = useGameStore((state) => state.setGameState);
  const setCurrentParticipant = useGameStore((state) => state.setCurrentParticipant);
  const addToQueue = useGameStore((state) => state.addToQueue);
  const loadQueueFromDB = useGameStore((state) => state.loadQueueFromDB);
  const fetchActiveSessionPublic = useGameStore((state) => state.fetchActiveSessionPublic);
  const setGameSession = useGameStore((state) => state.setGameSession);
  const confirmTransitionVisible = useGameStore((state) => state.confirmTransitionVisible);

  // --- FUNCIÓN CENTRALIZADA PARA CAMBIO DE PANTALLA ---
  const goToScreen = useCallback((next: TVScreen) => {
    tvLogger.session(`TV-SCREEN: Cambiando de pantalla a: ${next}`);
    setScreen(next);
    // Solo actualizar gameState para pantallas específicas, no para roulette
    // que debe ser manejado por la lógica del juego
    if (next === 'waiting') {
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
    } else if (next === 'roulette') {
      tvLogger.session('TV-SCREEN: Pantalla roulette - gameState será manejado por lógica del juego');
      // No cambiar gameState aquí, que lo maneje la lógica del juego
    }
  }, [setGameState]);

  // --- CONEXIÓN CON PANEL ADMIN (SOLO ESTO ES NUEVO) ---
  useEffect(() => {
    if (!supabaseClient) return;


    // Polling para detectar participantes (usando Map para trackear estado completo)
    const processedParticipants: Map<string, { updatedAt: string, status: string }> = new Map();
    let lastSessionId: string | null = null;

    const checkForParticipants = async () => {
      try {
        // [FIX] También detectar participantes cuando currentParticipant es null (no solo en waiting)
        const { currentParticipant, gameState, waitingQueue: currentQueue, gameSession } = useGameStore.getState();
        
        // [FIX] Limpiar procesados si cambió la sesión
        if (gameSession?.session_id !== lastSessionId) {
          if (lastSessionId !== null) {
            tvLogger.participant('TV-POLLING: Nueva sesión detectada, limpiando participantes procesados');
            processedParticipants.clear();
          }
          lastSessionId = gameSession?.session_id || null;
        }
        
        // Buscar participantes solo cuando sea necesario - no durante transiciones, juego activo o premios
        // IMPORTANTE: Incluir 'waiting' y 'screensaver' para detectar reactivaciones
        if (gameState === 'waiting' || gameState === 'screensaver' || (!currentParticipant && gameState !== 'transition' && gameState !== 'question' && gameState !== 'prize')) {
          const { data: allParticipants, error: allError } = await supabaseClient
            .from('participants')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(10);
            
          if (allError) {
            tvProdLogger.error('ADMIN-CONNECTION: Error al consultar participantes:', allError);
            return;
          }
          
          // Buscar participantes que estén listos para jugar (registered o playing sin completed_at)
          const readyParticipants = allParticipants?.filter(p => 
            (p.status === 'registered' || p.status === 'playing') && 
            !p.completed_at // No incluir participantes que ya terminaron
          ) || [];
          
          // Solo mostrar logs cuando hay cambios significativos
          if (readyParticipants.length > 0) {
            tvLogger.participant(`TV-POLLING: ${readyParticipants.length} participantes listos encontrados`);
            tvLogger.participant(`TV-POLLING: GameState actual: ${gameState}, CurrentParticipant: ${currentParticipant?.nombre || 'null'}`);
          }
          if (readyParticipants.length > 0) {
            // Verificar cada participante para agregarlo a la cola si no está ya
            for (const participant of readyParticipants) {
              const typedParticipant = participant as unknown as Participant;
              
              // Verificar si ya es el participante activo
              if (currentParticipant && typedParticipant.id === currentParticipant.id) {
                continue; // Skip, ya es el participante activo
              }
              
              // [FIX] Verificar si ya está en la cola con exactamente el mismo estado
              const existingInQueue = currentQueue.find(p => p.id === typedParticipant.id);
              if (existingInQueue) {
                const existingUpdatedAt = existingInQueue.updated_at || existingInQueue.created_at || '';
                const newUpdatedAt = typedParticipant.updated_at || typedParticipant.created_at || '';
                const existingStatus = existingInQueue.status || '';
                const newStatus = typedParticipant.status || '';
                
                // Si no cambió ni el timestamp ni el status, skip completamente
                if (existingUpdatedAt === newUpdatedAt && existingStatus === newStatus) {
                  continue; // Skip, ya está en la cola con el mismo estado exacto
                }
                
                // Solo si realmente cambió algo, permitir actualización
                if (existingUpdatedAt !== newUpdatedAt || existingStatus !== newStatus) {
                  tvLogger.participant(`TV-POLLING: Participante actualizado: ${typedParticipant.nombre} (status: ${existingStatus} → ${newStatus})`);
                  // Continuar para actualizar en la cola
                }
              }
              
              // [FIX] Verificar contra el registro procesado completo
              const lastProcessed = processedParticipants.get(typedParticipant.id);
              const currentUpdatedAt = typedParticipant.updated_at || typedParticipant.created_at || new Date().toISOString();
              const currentStatus = typedParticipant.status || '';
              
              // Si ya fue procesado con el mismo timestamp Y status, skip
              if (lastProcessed && 
                  lastProcessed.updatedAt === currentUpdatedAt && 
                  lastProcessed.status === currentStatus) {
                continue; // Skip, ya fue procesado exactamente igual
              }
              
              // Solo procesar si realmente hay un cambio
              const isNew = !lastProcessed;
              const isReactivated = lastProcessed && (lastProcessed.updatedAt !== currentUpdatedAt || lastProcessed.status !== currentStatus);
              
              if (isNew || isReactivated) {
                // Marcar como procesado con el estado completo
                processedParticipants.set(typedParticipant.id, {
                  updatedAt: currentUpdatedAt,
                  status: currentStatus
                });
                
                tvLogger.participant(`TV-PARTICIPANT-DETECTED: ${isNew ? 'Nuevo' : 'Actualizado'} participante: ${typedParticipant.nombre}`);
                tvLogger.participant(`TV-PARTICIPANT-DETECTED: Status: ${currentStatus}, Updated: ${currentUpdatedAt}`);
                
                await addToQueue(typedParticipant);
              }
            }
          } else {
            // [FIX] Si no hay participantes y no hay currentParticipant, limpiar procesados
            if (!currentParticipant && processedParticipants.size > 0) {
              tvLogger.participant('TV-POLLING: Limpiando participantes procesados (sin participantes activos)');
              processedParticipants.clear();
            }
          }
        }
      } catch (error) {
        tvProdLogger.error('ADMIN-CONNECTION: Error en polling:', error);
      }
    };

    // Ejecutar inmediatamente y luego cada 5 segundos (más eficiente)
    checkForParticipants();
    const pollingIntervalRef = setInterval(checkForParticipants, 5000);

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

  // Obtener sesión activa al montar el componente con reintentos
  useEffect(() => {
    const initSession = async () => {
      if (!gameSession) {
        tvLogger.session('TV-INIT: Buscando sesión activa...');
        
        // Intentar hasta 3 veces con espera entre intentos
        let attempt = 1;
        const maxAttempts = 3;
        
        while (attempt <= maxAttempts && !useGameStore.getState().gameSession) {
          tvLogger.session(`TV-INIT: Intento ${attempt}/${maxAttempts}`);
          
          try {
            const activeSession = await fetchActiveSessionPublic();
            if (activeSession) {
              tvLogger.session(`TV-INIT: ✅ Sesión activa encontrada: ${activeSession.session_id}`);
              setGameSession(activeSession);
              break; // Sesión encontrada, salir del loop
            } else {
              tvLogger.session(`TV-INIT: Intento ${attempt} - No hay sesión activa`);
            }
          } catch (error) {
            tvProdLogger.error(`TV-INIT: Error en intento ${attempt}:`, error);
          }
          
          // Esperar antes del siguiente intento (excepto en el último)
          if (attempt < maxAttempts) {
            tvLogger.session(`TV-INIT: Esperando 2 segundos antes del siguiente intento...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          attempt++;
        }
        
        // Si después de todos los intentos no hay sesión
        const finalSession = useGameStore.getState().gameSession;
        if (!finalSession) {
          tvLogger.session('TV-INIT: ⚠️ No se pudo obtener sesión activa después de todos los intentos');
        }
      } else {
        tvLogger.session(`TV-INIT: gameSession ya disponible: ${gameSession.session_id}`);
      }
    };

    initSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar cola desde BD cuando hay sesión activa
  useEffect(() => {
    const loadQueue = async () => {
      if (gameSession?.session_id) {
        tvLogger.session(`TV-INIT: Cargando cola para sesión: ${gameSession.session_id}`);
        await loadQueueFromDB(gameSession.session_id);
        tvLogger.session(`TV-INIT: Cola cargada - ${waitingQueue.length} en cola`);
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

  // [FIX] Usar useRef para prevenir reseteos múltiples
  const lastResetTime = useRef<number>(0);
  
  // Sync screen state with gameState for better consistency
  useEffect(() => {
    // Sync TV screen with gameState when necessary
    if (gameState === 'screensaver' && screen !== 'waiting') {
      tvLogger.session('TV-TRANSITION: Showing waiting screen (screensaver mode)');
      goToScreen('waiting');
    } else if (gameState === 'transition' && screen !== 'transition') {
      tvLogger.session('TV-TRANSITION: Showing transition screen');
      setScreen('transition');
    } else if ((gameState === 'inGame' || gameState === 'roulette') && currentParticipant && screen !== 'roulette' && screen !== 'question' && screen !== 'prize') {
      tvLogger.session(`TV-TRANSITION: Showing roulette for participant: ${currentParticipant.nombre} (from screen: ${screen})`);
      goToScreen('roulette');
    } else if ((gameState === 'inGame' || gameState === 'roulette') && !currentParticipant) {
      // [FIX] Prevenir reseteos múltiples con throttling
      const now = Date.now();
      if (now - lastResetTime.current > 1000) { // Solo resetear máximo una vez por segundo
        tvProdLogger.error('TV-SYNC: GameState indicates active game but no currentParticipant found - resetting to waiting');
        lastResetTime.current = now;
        setGameState('waiting');
        goToScreen('waiting');
      }
    }
  }, [currentParticipant, gameState, screen, waitingQueue.length, goToScreen, setGameState]);
  
  // Handshake: Confirmar cuando la transición es visible
  useEffect(() => {
    if (gameState === 'transition' && screen === 'transition' && !transitionConfirmed) {
      tvLogger.session('TV-HANDSHAKE: Pantalla de transición visible - confirmando al store');
      confirmTransitionVisible();
    }
  }, [gameState, screen, transitionConfirmed, confirmTransitionVisible]);

  // REMOVIDO: Auto-activación directa que causaba pantallasos
  // Ahora se usa prepareAndActivateNext() para transiciones controladas

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
                transition-all duration-300
                ${isSpinning ? 'opacity-50 cursor-not-allowed spinning-state' : 'ready-to-spin'}
                ${isTabletPortrait 
                  ? 'text-xl px-8 py-4 min-h-[70px] min-w-[320px] rounded-2xl' 
                  : 'text-lg px-6 py-3 min-h-[60px] min-w-[240px] rounded-xl'
                }
                shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-300
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