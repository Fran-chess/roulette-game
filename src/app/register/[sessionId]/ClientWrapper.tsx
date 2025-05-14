'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RegistrationForm from '@/components/game/RegistrationForm'; 
import VideoBackground from '@/components/layout/VideoBackground';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Interface para props
interface ClientWrapperProps {
  sessionId: string;
}

// Componente wrapper para la página de registro con sessionId
export default function ClientWrapper({ sessionId }: ClientWrapperProps) {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const router = useRouter();

  // Verificar la sesión al montar el componente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true);
      
      // Validar el sessionId y verificar la sesión
      if (!sessionId || sessionId.length < 10) {
        setError('ID de sesión inválido o incompleto');
        setIsLoading(false);
        return;
      }

      // Verificar la sesión en la API
      const verifySession = async () => {
        try {
          const response = await fetch(`/api/session/verify?sessionId=${sessionId}`);
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || 'Error al verificar la sesión');
          }
          
          if (!data.data) {
            throw new Error('Datos de sesión no disponibles');
          }
          
          if (data.data.status !== 'pending_player_registration') {
            if (data.data.status === 'player_registered' || data.data.status === 'in_progress') {
              router.push(`/game/${sessionId}`);
              return;
            }
            
            setError(`Esta sesión no está disponible para registro (estado: ${data.data.status})`);
          } else {
            setSessionData(data.data);
          }
        } catch (error: any) {
          console.error('Error al verificar sesión:', error);
          setError(error.message || 'Error al conectar con el servidor');
        } finally {
          setIsLoading(false);
        }
      };

      verifySession();
    }
  }, [sessionId, router]);

  // Función para manejar el registro exitoso
  const handlePlayerRegistered = () => {
    router.push(`/game/${sessionId}`);
  };

  // Pantalla de carga
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-azul-intenso">
        <VideoBackground videoSrc="/videos/intro-loop.mp4" isActive={true} />
        <div className="text-white text-xl z-10">Verificando sesión...</div>
      </div>
    );
  }

  // Pantalla de error
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-azul-intenso">
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

  // Renderizado del componente de registro
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-azul-intenso p-4">
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
      
      {/* Componente de registro */}
      <motion.div 
        className="z-10 w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <RegistrationForm 
          sessionId={sessionId} 
          onPlayerRegistered={handlePlayerRegistered}
        />
      </motion.div>
    </div>
  );
} 