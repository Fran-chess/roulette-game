'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import RouletteWheel from '@/components/game/RouletteWheel';
import QuestionDisplay from '@/components/game/QuestionDisplay';
import PrizeModal from '@/components/game/PrizeModal';
import VideoBackground from '@/components/layout/VideoBackground';
import Image from 'next/image';
import type { Question, PlaySession } from '@/types';

export default function GamePage() {
  // Acceso a los parámetros de la URL y navegación
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const router = useRouter();
  
  // Estado del componente
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Acceso al estado global del juego
  const gameState = useGameStore((state) => state.gameState);
  const setGameState = useGameStore((state) => state.setGameState);
  const currentParticipant = useGameStore((state) => state.currentParticipant);
  const currentQuestion = useGameStore((state) => state.currentQuestion);
  const lastSpinResultIndex = useGameStore((state) => state.lastSpinResultIndex);
  const setCurrentQuestion = useGameStore((state) => state.setCurrentQuestion);
  const setGameSession = useGameStore((state) => state.setGameSession);
  const questions = useGameStore((state) => state.questions);
  const setQuestions = useGameStore((state) => state.setQuestions);
  const gameSession = useGameStore((state) => state.gameSession);

  // Efecto para cargar los datos de la sesión al iniciar
  useEffect(() => {
    // No continuar si no hay sessionId válido
    if (!sessionId) {
      setError('ID de sesión no proporcionado');
      setIsLoading(false);
      return;
    }
    
    // Función para cargar los datos de la sesión
    const loadSessionData = async () => {
      try {
        // Verificar la sesión
        const sessionResponse = await fetch(`/api/session/verify?sessionId=${sessionId}`);
        const sessionData = await sessionResponse.json();
        
        if (!sessionResponse.ok) {
          throw new Error(sessionData.message || 'Error al verificar sesión');
        }
        
        if (!sessionData.data) {
          throw new Error('Datos de sesión no disponibles');
        }
        
        const session = sessionData.data as PlaySession;
        
        // Verificar el estado de la sesión
        if (session.status === 'pending_player_registration') {
          // Redirigir a la página de registro si el jugador aún no está registrado
          router.push(`/register/${sessionId}`);
          return;
        } else if (session.status !== 'player_registered' && session.status !== 'in_progress') {
          throw new Error(`Esta sesión no está disponible para jugar (estado: ${session.status})`);
        }
        
        // Guardar la sesión en el store
        setGameSession(session);
        
        // Si no hay participante, redirigir a la página de registro
        if (!session.nombre || !session.email) {
          router.push(`/register/${sessionId}`);
          return;
        }
        
        // Cargar preguntas
        const questionsResponse = await fetch('/api/questions');
        if (!questionsResponse.ok) {
          throw new Error('Error al cargar preguntas');
        }
        
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData.questions || []);
        
        // Establecer el estado del juego a ruleta si aún no hay una pregunta seleccionada
        if (gameState === 'screensaver' || gameState === 'register') {
          setGameState('roulette');
        }
      } catch (error: any) {
        console.error('Error al cargar datos:', error);
        setError(error.message || 'Error al cargar el juego');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSessionData();
  }, [sessionId, router, setGameSession, setQuestions, setGameState, gameState]);
  
  // Efecto para manejar el resultado del giro de la ruleta
  useEffect(() => {
    if (lastSpinResultIndex !== null && questions.length > 0) {
      const indexToUse = lastSpinResultIndex;
      
      if (indexToUse >= 0 && indexToUse < questions.length) {
        setCurrentQuestion(questions[indexToUse]);
        setGameState('question');
      } else {
        console.error(`Índice inválido: ${indexToUse}`);
      }
    }
  }, [lastSpinResultIndex, questions, setCurrentQuestion, setGameState]);

  // Pantalla de carga
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-azul-intenso">
        <VideoBackground videoSrc="/videos/intro-loop.mp4" isActive={true} />
        <div className="text-white text-xl z-10">Cargando juego...</div>
      </div>
    );
  }

  // Pantalla de error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-azul-intenso">
        <VideoBackground videoSrc="/videos/intro-loop.mp4" isActive={true} />
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-lg border border-white/20 max-w-md z-10">
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-white/90 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Si no hay participante o sesión después de cargar, mostrar error
  if (!currentParticipant || !gameSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-azul-intenso">
        <VideoBackground videoSrc="/videos/intro-loop.mp4" isActive={true} />
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-lg border border-white/20 max-w-md z-10">
          <h2 className="text-2xl font-bold text-white mb-4">Datos de juego no disponibles</h2>
          <p className="text-white/90 mb-4">
            No se pudo cargar la información del jugador o la sesión.
          </p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-azul-intenso overflow-hidden">
      <VideoBackground videoSrc="/videos/intro-loop.mp4" isActive={false} />
      
      {/* Logo */}
      <motion.div
        className="absolute top-6 left-0 right-0 mx-auto w-fit z-30"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Image
          src="/images/8.svg"
          alt="Logo Empresa"
          width={220}
          height={67}
          priority
        />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto pt-24 px-4 z-10 relative"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-xl shadow-lg border border-white/20 mb-6"
        >
          <h2 className="text-xl md:text-2xl font-marineBold text-white mb-2">
            ¡Bienvenido a la Ruleta!
          </h2>
          <p className="text-white/90">
            Hola <span className="font-marineBold">{currentParticipant.nombre}</span>, 
            estás listo para comenzar a jugar.
          </p>
        </motion.div>

        {/* Contenido condicional según el estado del juego */}
        <motion.div
          key={gameState}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="w-full flex justify-center"
        >
          {gameState === 'roulette' && questions.length > 0 && (
            <div className="w-full max-w-3xl">
              <RouletteWheel questions={questions} />
            </div>
          )}

          {gameState === 'question' && currentQuestion && (
            <div className="w-full max-w-3xl">
              <QuestionDisplay question={currentQuestion} />
            </div>
          )}

          {gameState === 'prize' && (
            <div className="w-full max-w-3xl">
              <PrizeModal />
            </div>
          )}
          
          {questions.length === 0 && gameState === 'roulette' && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center">
              <p className="text-red-200">
                Error: No hay preguntas disponibles para el juego.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
} 