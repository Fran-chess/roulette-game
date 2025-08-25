'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import RegistrationForm from '@/components/game/RegistrationForm'; 
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useNavigationStore } from '@/store/navigationStore';
import Logo from '@/components/ui/Logo';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

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
  const [playerRegisteredSuccess, setPlayerRegisteredSuccess] = useState(false);
  const [registeredPlayerName, setRegisteredPlayerName] = useState<string>('');

  const router = useRouter();

  const verificationInProgress = useRef(false);

  const setGameSession = useGameStore((state) => state.setGameSession);
  const startNavigation = useNavigationStore(state => state.startNavigation);

  const handleRedirect = useCallback((path: string, message?: string) => {
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
          const response = await fetch(`/api/session/verify?sessionId=${sessionId}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Error al verificar la sesión');
          }

          if (!data.data) {
            throw new Error('Datos de sesión no disponibles');
          }

          setGameSession(data.data);

          // Para single session, permitir registro en todos los estados activos
          if (data.data.status === 'closed' || data.data.status === 'completed' || data.data.status === 'archived') {
            setError(`Esta sesión no está disponible para registro (estado: ${data.data.status})`);
          }
          // Para cualquier otro estado, permitir registro
        } catch (error: Error | unknown) {
          // Error al verificar sesión - removido log ya que se maneja en UI
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

  const handlePlayerRegistered = (playerName: string = 'Participante') => {
    setRegisteredPlayerName(playerName);
    setPlayerRegisteredSuccess(true);
    
    // Auto-hide después de 10 segundos y volver al formulario
    setTimeout(() => {
      setPlayerRegisteredSuccess(false);
      setRegisteredPlayerName('');
    }, 10000);
  };

  const handlePrepareNextRegistration = () => {
    setPlayerRegisteredSuccess(false);
    setRegisteredPlayerName('');
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
    <div className="flex flex-col min-h-screen bg-azul-intenso relative">
      {/* Botón de regreso fijo en esquina superior izquierda */}
      <button
        onClick={() => router.push('/admin')}
        className="fixed top-4 left-4 z-50 p-3 rounded-lg bg-black/30 
                   border border-white/20 transition-all duration-200
                   flex items-center justify-center group backdrop-blur-sm shadow-lg"
        title="Volver al panel de administración"
        type="button"
      >
        <ArrowLeftIcon className="w-6 h-6 text-gray-300 transition-colors duration-200" />
      </button>

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
      
      {/* Main Content - Formulario o mensaje de éxito */}
      <main className="flex-1 flex items-center justify-center w-full px-4 py-6 overflow-y-auto">
        <motion.div 
          className="w-full max-w-md sm:max-w-lg lg:max-w-4xl z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {playerRegisteredSuccess ? (
            <motion.div
              key="success-message"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl bg-green-900/20 border border-green-400/30 shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
                className="text-6xl mb-4"
              >
                ✅
              </motion.div>
              
              <h2 className="text-2xl sm:text-3xl font-marineBold text-green-300 text-center mb-4">
                ¡Participante Registrado!
              </h2>
              
              <p className="text-xl text-white text-center mb-2">
                <strong>{registeredPlayerName}</strong>
              </p>
              
              <p className="text-base text-green-100 text-center mb-6">
                ha sido registrado exitosamente. El participante podrá ver la ruleta en la TV.
              </p>
              
              <div className="flex flex-col items-center gap-3 w-full">
                <button
                  onClick={handlePrepareNextRegistration}
                  className="w-full max-w-none py-3 px-6 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-marineBold rounded-xl shadow-lg border border-blue-400/50 transition-all duration-300"
                >
                  Registrar Otro Participante
                </button>
                
                <p className="text-sm text-center text-white/70">
                  Este mensaje se ocultará automáticamente en 10 segundos
                </p>
              </div>
            </motion.div>
          ) : (
            <RegistrationForm 
              sessionId={sessionId} 
              onPlayerRegistered={handlePlayerRegistered}
            />
          )}
        </motion.div>
      </main>
    </div>
  );
}
