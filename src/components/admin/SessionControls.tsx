import { useState, useEffect, useCallback } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { PlaySession, Participant } from '@/types';
import { isPlayerRegistered } from '@/utils/session';

interface SessionControlsProps {
  session: PlaySession;
  onSessionUpdate?: (updatedSession: PlaySession) => void;
}

/**
 * Componente de controles administrativos para gestionar una sesión de juego
 */
export default function SessionControls({ session, onSessionUpdate }: SessionControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [participantLoading, setParticipantLoading] = useState(false);
  
  const adminUser = useSessionStore(state => state.user);
  
  /**
   * Obtiene el participante activo de la sesión actual
   * Busca en la tabla participants filtrando por session_id
   */
  const fetchParticipant = useCallback(async () => {
    if (!session?.session_id) {
      setParticipant(null);
      return;
    }

    try {
      setParticipantLoading(true);
      const response = await fetch(`/api/admin/sessions/participants?sessionId=${session.session_id}`);
      const data = await response.json();
      
      if (response.ok && data.participants && data.participants.length > 0) {
        // Buscar el participante más reciente o activo
        const activeParticipant = data.participants
          .sort((a: Participant, b: Participant) => 
            new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
          )[0];
        
        setParticipant(activeParticipant);
      } else {
        setParticipant(null);
      }
    } catch (error) {
      console.error('Error al obtener información del participante:', error);
      setParticipant(null);
    } finally {
      setParticipantLoading(false);
    }
  }, [session?.session_id]);

  useEffect(() => {
    fetchParticipant();
  }, [fetchParticipant]);
  
  /**
   * Resetea los datos del jugador para permitir un nuevo registro
   */
  const handleResetPlayer = async () => {
    if (!session || !session.session_id) {
      setError('Sesión no válida');
      return;
    }
    
    if (!adminUser?.id) {
      setError('Usuario administrador no disponible');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/admin/sessions/reset-player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.session_id,
          adminId: adminUser.id
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Error al resetear el jugador');
      }
      
      setSuccess('Jugador reseteado correctamente. Listo para nuevo registro.');
      
      setParticipant(null);
      
      // Notificar al componente padre sobre la actualización
      if (onSessionUpdate && data.session) {
        onSessionUpdate(data.session);
      }
    } catch (error: Error | unknown) {
      console.error('Error al resetear jugador:', error);
      setError(error instanceof Error ? error.message : 'Error al resetear los datos del jugador');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Actualiza el estado de la sesión
   */
  const updateSessionStatus = async (status: string) => {
    if (!session || !session.session_id) {
      setError('Sesión no válida');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/admin/sessions/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.session_id,
          status,
          adminId: adminUser?.id
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || `Error al actualizar estado a ${status}`);
      }
      
      setSuccess(`Estado actualizado a ${status}`);
      
      // Notificar al componente padre sobre la actualización
      if (onSessionUpdate && data.session) {
        onSessionUpdate(data.session);
      }
    } catch (error: Error | unknown) {
      console.error('Error al actualizar estado:', error);
      setError(error instanceof Error ? error.message : 'Error al actualizar el estado de la sesión');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-black/10 backdrop-blur-md p-4 rounded-lg border border-white/20">
      <h3 className="text-lg font-semibold mb-4">Controles de Sesión</h3>
      
      {/* Información de la sesión */}
      <div className="mb-4 text-sm">
        <p>ID: {session.session_id?.substring(0, 8)}...</p>
        <p>Estado: <span className="font-medium">{session.status}</span></p>
        {isPlayerRegistered(session) && participant && (
          <div className="mt-2 p-2 bg-white/5 rounded">
            <p>Jugador: {participant.nombre} {participant.apellido || ''}</p>
            <p>Email: {participant.email}</p>
            {participant.especialidad && (
              <p>Especialidad: {participant.especialidad}</p>
            )}
          </div>
        )}
        {participantLoading && (
          <p className="text-xs text-gray-400 mt-1">Cargando información del participante...</p>
        )}
      </div>
      
      {/* Controles */}
      <div className="space-y-3">
        {/* Botón "Nuevo Participante" */}
        <button
          onClick={handleResetPlayer}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Procesando..." : "Nuevo Participante"}
        </button>
        
        {/* Otros botones de control de estado */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateSessionStatus('player_registered')}
            disabled={isLoading || isPlayerRegistered(session)}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Marcar Registrado
          </button>
          
          <button
            onClick={() => updateSessionStatus('playing')}
            disabled={isLoading || !isPlayerRegistered(session)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Iniciar Juego
          </button>
        </div>
      </div>
      
      {/* Mostrar mensajes */}
      {error && (
        <div className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded text-red-100 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mt-3 p-2 bg-green-500/20 border border-green-500/30 rounded text-green-100 text-sm">
          {success}
        </div>
      )}
    </div>
  );
} 