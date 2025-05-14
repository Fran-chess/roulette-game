'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import RegistrationForm from '@/components/game/RegistrationForm';
import { supabaseClient } from '@/lib/supabase';
import { motion } from 'framer-motion';

// [modificación] Este componente recibe sessionId como prop
interface RegisterPageClientProps {
  sessionId: string;
}

export default function RegisterPageClient({ sessionId }: RegisterPageClientProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [retryCount, setRetryCount] = useState(0); // [modificación] Contador de reintentos
  const router = useRouter();
  const setGameState = useGameStore((state) => state.setGameState);
  const setCurrentParticipant = useGameStore((state) => state.setCurrentParticipant);
  const setGameSession = useGameStore((state) => state.setGameSession);

  useEffect(() => {
    if (shouldRedirect) {
      router.push('/game');
    }
  }, [shouldRedirect, router]);

  // [modificación] Función para verificar la sesión directamente en el servidor
  const verifySessionOnServer = async () => {
    try {
      console.log('Verificando sesión en servidor:', sessionId);
      
      // [modificación] Llamar a un endpoint API personalizado para verificar la sesión
      const response = await fetch(`/api/session/verify?sessionId=${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // [modificación] Asegurar que no obtenemos una respuesta en caché
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error de servidor en verificación:', errorData);
        
        // [modificación] Si se necesita ejecutar una migración, intentamos hacerlo
        if (errorData.needsMigration) {
          console.log('Necesita migración, intentando crear función RPC...');
          const migrationResponse = await fetch('/api/migration/create-check-session-exists', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (migrationResponse.ok) {
            console.log('Migración ejecutada, reintentando verificación...');
            // Reintentamos verificar después de ejecutar la migración
            return verifySessionOnServer();
          }
        }
        
        throw new Error(`Falló la verificación de sesión en el servidor: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Resultado de verificación en servidor:', result);
      
      if (result.valid) {
        return result.data;
      }
      return null;
    } catch (err) {
      console.error('Error al verificar sesión en servidor:', err);
      return null;
    }
  };

  // [modificación] Mejorar la verificación de sesión para identificar problemas
  useEffect(() => {
    async function checkSessionValidity() {
      if (!sessionId) {
        setError('No se proporcionó un ID de sesión válido');
        setIsLoading(false);
        return;
      }
      
      // [modificación] Asegurarse de que el navegador esté completamente cargado
      if (typeof window === 'undefined') return;
      
      setIsLoading(true);
      try {
        console.log('Verificando sesión con ID:', sessionId);
        
        // [modificación] Primera verificación directa con Supabase
        console.log('AdminPanel: fetchActiveSessions - Usando adminData.id:', adminData?.id);
        const { data, error: fetchError } = await supabaseClient
          .from('plays')
          .select('*')  // [modificación] Seleccionar todos los campos directamente
          .eq('session_id', sessionId)
          .maybeSingle();

        if (fetchError) {
          console.error('Error al buscar sesión:', fetchError);
          throw new Error(`Error al verificar la sesión: ${fetchError.message}`);
        }

        if (!data) {
          console.log('Sesión no encontrada en Supabase, intentando verificar en servidor...');
          
          // [modificación] Si no se encuentra la sesión, intentar verificar en el servidor
          const serverSessionData = await verifySessionOnServer();
          
          if (serverSessionData) {
            console.log('Sesión verificada en servidor:', serverSessionData);
            
            // [modificación] Comprobar que la sesión del servidor coincide con la solicitada
            if (serverSessionData.session_id !== sessionId) {
              console.warn('⚠️ La sesión devuelta por el servidor tiene un ID diferente:',
                           serverSessionData.session_id, 'vs solicitada:', sessionId);
            }
            
            setSessionData(serverSessionData);
            setGameState('register');
            setIsLoading(false);
            return;
          }
          
          // [modificación] Si no se encontró la sesión, pero estamos en los primeros reintentos, programar otro intento
          if (retryCount < 3) {
            console.log(`Reintento ${retryCount + 1}/3 para verificar sesión...`);
            setRetryCount(prev => prev + 1);
            setTimeout(() => {
              checkSessionValidity();
            }, 2000); // Esperar 2 segundos antes de reintentar
            return;
          }
          
          setError('Esta sesión no existe o ha sido eliminada. Si acabas de crear la sesión, por favor espera unos segundos y recarga la página.');
          setIsLoading(false);
          return;
        }

        console.log('Sesión encontrada en Supabase:', data);

        // [modificación] Verificar si la sesión está en un estado válido para registro
        if (data.status && data.status !== 'pending_player_registration') {
          setError(`Esta sesión ya tiene un jugador registrado o no está disponible para registro (estado actual: ${data.status}).`);
          setIsLoading(false);
          return;
        }
        
        // [modificación] Si la sesión existe pero no tiene todos los datos necesarios, actualizar desde el servidor
        if (!data.participant_id && retryCount === 0) {
          console.log('Sesión existe pero sin datos completos, verificando desde servidor...');
          const completeData = await verifySessionOnServer();
          
          if (completeData && Object.keys(completeData).length > Object.keys(data).length) {
            console.log('Usando datos más completos del servidor:', completeData);
            setSessionData(completeData);
          } else {
            console.log('Usando datos de Supabase:', data);
            setSessionData(data);
          }
        } else {
          setSessionData(data);
        }
        
        setGameState('register');
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error al verificar sesión:', err);
        
        // [modificación] Si hay un error pero estamos en los primeros reintentos, programar otro intento
        if (retryCount < 3) {
          console.log(`Error en intento ${retryCount + 1}/3, reintentando...`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            checkSessionValidity();
          }, 2000); // Esperar 2 segundos antes de reintentar
          return;
        }
        
        setError(`No se pudo verificar el estado de la sesión: ${err.message}`);
        setIsLoading(false);
      }
    }

    // [modificación] Añadimos un pequeño retraso antes de verificar para dar tiempo a que la sesión se cree
    const timer = setTimeout(() => {
      checkSessionValidity();
    }, retryCount === 0 ? 1000 : 0); // Solo en la primera carga esperamos 1 segundo
    
    return () => {
      clearTimeout(timer);
    };
  }, [sessionId, setGameState, retryCount]);

  // [modificación] Función para manejar el registro exitoso del jugador
  const handlePlayerRegistered = () => {
    console.log('Jugador registrado exitosamente, redirigiendo a la página de juego...');
    
    // Marcar la sesión como válida y cargar datos de usuario
    setIsLoading(false);
    setError(null);
    
    // Actualizar el estado global del juego con la información de la sesión
    if (sessionData) {
      // Establecer sesión en el store
      setGameSession({
        sessionId: sessionId,
        playerName: sessionData.nombre || 'Jugador',
        playerEmail: sessionData.email || undefined,
        participantId: sessionData.participant_id || '',
        isActive: true,
        status: 'player_registered',
        createdAt: sessionData.created_at
      });
      
      // Cambiar el estado del juego a "ruleta"
      setGameState('roulette');
      
      // Redirigir al usuario
      setTimeout(() => {
        router.push('/game');
      }, 500);
    } else {
      // Si no tenemos datos de sesión, simplemente redirigir a la página de juego
      // y dejar que la lógica de juego maneje la situación
      setTimeout(() => {
        router.push('/game');
      }, 500);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-600 to-teal-400">
        <div className="text-white text-xl font-marineBold">
          {retryCount > 0 
            ? `Verificando sesión... (Intento ${retryCount} de 3)`
            : "Verificando sesión..."}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-600 to-teal-400">
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-lg border border-white/20 max-w-md">
          <h2 className="text-2xl font-marineBold text-white mb-4">Error</h2>
          <p className="text-white/90">{error}</p>
          <div className="flex gap-3 mt-6">
            <button 
              onClick={() => router.push('/')}
              className="bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded transition-colors"
            >
              Volver al inicio
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-600 to-teal-400 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <RegistrationForm sessionId={sessionId} onPlayerRegistered={handlePlayerRegistered} />
      </motion.div>
    </div>
  );
} 