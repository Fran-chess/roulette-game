import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Participant } from '@/types';

// Query Keys para mantener consistencia y facilitar invalidaciones
export const participantsKeys = {
  all: ['participants'] as const,
  lists: () => [...participantsKeys.all, 'list'] as const,
  list: (filters: string) => [...participantsKeys.lists(), filters] as const,
  details: () => [...participantsKeys.all, 'detail'] as const,
  detail: (id: string) => [...participantsKeys.details(), id] as const,
  stats: (id: string) => [...participantsKeys.all, 'stats', id] as const,
};

// Hook para obtener todos los participantes
export function useParticipants(detail: boolean = false) {
  return useQuery({
    queryKey: participantsKeys.list(detail ? 'detailed' : 'basic'),
    queryFn: async (): Promise<{ participants: Participant[] }> => {
      const response = await fetch(`/api/participants${detail ? '?detail=true' : ''}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutos - los participantes cambian frecuentemente
    gcTime: 5 * 60 * 1000, // 5 minutos en cache
  });
}

// Hook para obtener estadísticas de un participante
export function useParticipantStats(participantId: string | null) {
  return useQuery({
    queryKey: participantsKeys.stats(participantId || ''),
    queryFn: async () => {
      if (!participantId) throw new Error('Participant ID is required');
      
      const response = await fetch(`/api/participants/stats?participantId=${participantId}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!participantId, // Solo ejecutar si hay participantId
    staleTime: 1 * 60 * 1000, // 1 minuto - stats cambian frecuentemente
  });
}

// Hook para verificar si un participante ya ganó premio
export function useCheckParticipantPrize(participantId: string | null) {
  return useQuery({
    queryKey: [...participantsKeys.stats(participantId || ''), 'prize-check'],
    queryFn: async (): Promise<{ hasWonPrize: boolean }> => {
      if (!participantId) throw new Error('Participant ID is required');
      
      const response = await fetch('/api/participants/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId,
          action: 'check-prize'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!participantId,
    staleTime: 30 * 1000, // 30 segundos - verificación de premio es crítica
  });
}

// Mutation para registrar un nuevo participante
export function useRegisterParticipant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (participantData: {
      nombre: string;
      apellido: string;
      email: string;
      sessionId: string;
    }) => {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: participantData.nombre,
          apellido: participantData.apellido,
          email: participantData.email,
          session_id: participantData.sessionId, // Map sessionId to session_id
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidar y refrescar las listas de participantes
      queryClient.invalidateQueries({ queryKey: participantsKeys.lists() });
      
      // Opcionalmente, agregar el nuevo participante al cache optimísticamente
      queryClient.setQueryData(
        participantsKeys.detail(data.participant?.id),
        data.participant
      );
      
      // [PROD] Log de registro exitoso removido
    },
    onError: (error) => {
      console.error('❌ Error al registrar participante:', error);
    },
  });
}