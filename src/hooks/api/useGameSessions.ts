import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlaySession } from '@/types';

// Query Keys para game sessions
export const gameSessionsKeys = {
  all: ['game-sessions'] as const,
  lists: () => [...gameSessionsKeys.all, 'list'] as const,
  list: (filters: string) => [...gameSessionsKeys.lists(), filters] as const,
  details: () => [...gameSessionsKeys.all, 'detail'] as const,
  detail: (id: string) => [...gameSessionsKeys.details(), id] as const,
  active: () => [...gameSessionsKeys.all, 'active'] as const,
  queue: (sessionId: string) => [...gameSessionsKeys.all, 'queue', sessionId] as const,
  participants: (sessionId: string) => [...gameSessionsKeys.all, 'participants', sessionId] as const,
};

// Hook para obtener todas las sesiones con participantes
export function useGameSessions() {
  return useQuery({
    queryKey: gameSessionsKeys.lists(),
    queryFn: async (): Promise<{ sessions: PlaySession[] }> => {
      const response = await fetch('/api/admin/sessions/with-participants');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    staleTime: 10 * 1000, // 10 segundos - datos cambian frecuentemente
    refetchInterval: 15 * 1000, // Refrescar cada 15 segundos
  });
}

// Hook para obtener la sesión activa
export function useActiveGameSession() {
  return useQuery({
    queryKey: gameSessionsKeys.active(),
    queryFn: async (): Promise<{ session: PlaySession | null }> => {
      const response = await fetch('/api/admin/sessions/active');
      
      if (!response.ok) {
        if (response.status === 404) {
          return { session: null }; // No hay sesión activa
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    staleTime: 30 * 1000, // 30 segundos - sesión activa cambia frecuentemente
    refetchInterval: 5 * 1000, // Refrescar cada 5 segundos
  });
}

// Hook para obtener la cola de participantes de una sesión
export function useSessionQueue(sessionId: string | null) {
  return useQuery({
    queryKey: gameSessionsKeys.queue(sessionId || ''),
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      
      const response = await fetch(`/api/admin/sessions/queue?sessionId=${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!sessionId,
    staleTime: 10 * 1000, // 10 segundos - cola cambia muy frecuentemente
    refetchInterval: 3 * 1000, // Refrescar cada 3 segundos
  });
}

// Hook para obtener participantes de una sesión
export function useSessionParticipants(sessionId: string | null) {
  return useQuery({
    queryKey: gameSessionsKeys.participants(sessionId || ''),
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      
      const response = await fetch(`/api/admin/sessions/participants?sessionId=${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!sessionId,
    staleTime: 30 * 1000, // 30 segundos
  });
}

// Mutation para crear una nueva sesión
export function useCreateGameSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionData: {
      name: string;
      description?: string;
    }) => {
      const response = await fetch('/api/admin/sessions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidar listas de sesiones
      queryClient.invalidateQueries({ queryKey: gameSessionsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gameSessionsKeys.active() });
    },
  });
}

// Mutation para actualizar el estado de una sesión
export function useUpdateSessionStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      sessionId,
      status,
    }: {
      sessionId: string;
      status: 'active' | 'paused' | 'finished';
    }) => {
      const response = await fetch('/api/admin/sessions/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, status }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidar sesiones relacionadas
      queryClient.invalidateQueries({ queryKey: gameSessionsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gameSessionsKeys.active() });
      queryClient.invalidateQueries({ queryKey: gameSessionsKeys.detail(variables.sessionId) });
    },
  });
}

// Mutation para cerrar una sesión
export function useCloseGameSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch('/api/admin/sessions/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameSessionsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gameSessionsKeys.active() });
    },
  });
}

// Mutation para guardar la cola de participantes
export function useSaveSessionQueue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      sessionId,
      waitingQueue,
    }: {
      sessionId: string;
      waitingQueue: string[];
    }) => {
      const response = await fetch('/api/admin/sessions/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, waitingQueue }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Actualizar el cache de la cola específica
      queryClient.invalidateQueries({ 
        queryKey: gameSessionsKeys.queue(variables.sessionId) 
      });
    },
  });
}