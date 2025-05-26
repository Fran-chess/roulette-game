'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import RegistrationForm from '@/components/game/RegistrationForm'; 
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { isPlayerRegistered, isSessionInProgress, isSessionPendingRegistration } from '@/utils/session';
import { useNavigationStore } from '@/store/navigationStore';
import Logo from '@/components/ui/Logo';

// Interface para props
interface ClientWrapperProps {
  sessionId: string;
}

// Componente wrapper para la página de registro con sessionId
export default function ClientWrapper({ sessionId }: ClientWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<string>('');

  const router = useRouter();

  const verificationInProgress = useRef(false);

  const setGameSession = useGameStore((state) => state.setGameSession);
  const startNavigation = useNavigationStore(state => state.startNavigation);

  const handleRedirect = useCallback((path: string, message?: string) => {
    console.log(`Iniciando navegación global a: ${path}`);
    setRedirectTarget(path);
    startNavigation(path, message);
  }, [startNavigation]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!sessionId || sessionId.length < 10) {
        setError('ID de sesión inválido o incompleto');
        setIsLoading(false);
        return;
      }

      if (verificationInProgress.current) {
        return;
      }

      const verifySession = async () => {
        try {
          verificationInProgress.current = true;
          console.log("Verificando sesión para registro:", sessionId);
          const response = await fetch(`/api/session/verify?sessionId=${sessionId}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Error al verificar la sesión');
          }

          if (!data.data) {
            throw new Error('Datos de sesión no disponibles');
          }

          setGameSession(data.data);

          if (isPlayerRegistered(data.data)) {
            console.log("Sesión ya tiene un jugador registrado, redirigiendo al juego:", data.data);
            handleRedirect(`/game/${sessionId}`, 'Preparando la ruleta...');
            return;
          } else if (isSessionInProgress(data.data)) {
            console.log("Juego en progreso, redirigiendo:", data.data);
            handleRedirect(`/game/${sessionId}`, 'Cargando juego en progreso...');
            return;
          } else if (!isSessionPendingRegistration(data.data)) {
            setError(`Esta sesión no está disponible para registro (estado: ${data.data.status})`);
          }
        } catch (error: Error | unknown) {
          console.error('Error al verificar sesión:', error);
          setError(error instanceof Error ? error.message : 'Error al conectar con el servidor');
        } finally {
          setIsLoading(false);
          setTimeout(() => {
            verificationInProgress.current = false;
          }, 500);
        }
      };

      verifySession();
    }
  }, [sessionId, router, setGameSession, startNavigation, handleRedirect]);

  const handlePlayerRegistered = () => {
    handleRedirect(`/game/${sessionId}`, 'Preparando la ruleta...');
  };

  if (isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-azul-intenso">
        <div className="z-10 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <Logo
              size="md"
              animated={false}
              withShadow={true}
            />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-white text-lg"
          >
            {redirectTarget?.includes('game') 
              ? 'Preparando la ruleta...' 
              : 'Redirigiendo...'}
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-6 w-16 h-1  rounded-full overflow-hidden"
          >
            <motion.div 
              className="h-full "
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.8, ease: "linear" }}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-azul-intenso">
        <div className="text-white text-xl z-10">Verificando sesión...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-azul-intenso">
        <div className=" backdrop-blur-md p-8 rounded-xl shadow-lg border border-white/20 max-w-md z-10">
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-white/90 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4   text-white py-2 px-4 rounded transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-azul-intenso">
      {/* Header - Logo */}
      <header className="w-full flex justify-center items-center min-h-[65px] border-b border-white/10 bg-azul-intenso/90 backdrop-blur-sm">
        {/* [modificación] Contenedor con tamaño máximo consistente con GameLayout */}
        <div className="max-w-[150px] sm:max-w-[165px] md:max-w-[200px] w-full flex justify-center items-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="z-30 w-full"
          >
            <Logo 
              size="auto" 
              animated={false}
              withShadow={true}
              className="w-full h-auto"
            />
          </motion.div>
        </div>
      </header>
      
      {/* Main Content - Formulario */}
      <main className="flex-1 flex items-center justify-center w-full px-4 py-6 overflow-y-auto">
        <motion.div 
          className="w-full max-w-md sm:max-w-lg z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <RegistrationForm 
            sessionId={sessionId} 
            onPlayerRegistered={handlePlayerRegistered}
          />
        </motion.div>
      </main>
    </div>
  );
}
