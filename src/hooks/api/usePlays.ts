import { useMutation, useQueryClient } from '@tanstack/react-query';
import { participantsKeys } from './useParticipants';
import { gameSessionsKeys } from './useGameSessions';

// Mutation para enviar una jugada
export function useSubmitPlay() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (playData: {
      participantId: string;
      sessionId: string;
      questionId: string;
      selectedAnswer: string;
      answeredCorrectly: boolean;
      spinResult: string;
      prizeWon?: string;
    }) => {
      const response = await fetch('/api/plays/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidar estadísticas del participante
      queryClient.invalidateQueries({ 
        queryKey: participantsKeys.stats(variables.participantId) 
      });
      
      // Invalidar verificación de premio del participante
      queryClient.invalidateQueries({ 
        queryKey: [...participantsKeys.stats(variables.participantId), 'prize-check'] 
      });
      
      // Invalidar la cola de la sesión (puede haber cambios)
      queryClient.invalidateQueries({ 
        queryKey: gameSessionsKeys.queue(variables.sessionId) 
      });
      
      // Invalidar participantes de la sesión
      queryClient.invalidateQueries({ 
        queryKey: gameSessionsKeys.participants(variables.sessionId) 
      });
      
      console.log('✅ Jugada enviada exitosamente:', {
        participant: variables.participantId,
        correct: variables.answeredCorrectly,
        prize: variables.prizeWon || 'Sin premio'
      });
    },
    onError: (error, variables) => {
      console.error('❌ Error al enviar jugada:', {
        error: error.message,
        participant: variables.participantId,
        session: variables.sessionId
      });
    },
  });
}

// Hook para optimistic updates en jugadas
export function useSubmitPlayWithOptimistic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (playData: {
      participantId: string;
      sessionId: string;
      questionId: string;
      selectedAnswer: string;
      answeredCorrectly: boolean;
      spinResult: string;
      prizeWon?: string;
    }) => {
      // Simular optimistic update en las stats
      const previousStats = queryClient.getQueryData(
        participantsKeys.stats(playData.participantId)
      );
      
      if (previousStats) {
        // Actualizar optimísticamente las estadísticas
        queryClient.setQueryData(
          participantsKeys.stats(playData.participantId),
          (oldData: { stats?: { totalPlays: number; correctAnswers: number; incorrectAnswers: number; hasPrize: boolean } } | undefined) => {
            if (!oldData?.stats) return oldData;
            
            return {
              ...oldData,
              stats: {
                ...oldData.stats,
                totalPlays: oldData.stats.totalPlays + 1,
                correctAnswers: playData.answeredCorrectly 
                  ? oldData.stats.correctAnswers + 1 
                  : oldData.stats.correctAnswers,
                incorrectAnswers: !playData.answeredCorrectly 
                  ? oldData.stats.incorrectAnswers + 1 
                  : oldData.stats.incorrectAnswers,
                hasPrize: playData.prizeWon ? true : oldData.stats.hasPrize,
              }
            };
          }
        );
      }
      
      // Realizar la mutación real
      const response = await fetch('/api/plays/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playData),
      });
      
      if (!response.ok) {
        // Revertir optimistic update en caso de error
        if (previousStats) {
          queryClient.setQueryData(
            participantsKeys.stats(playData.participantId),
            previousStats
          );
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Refrescar con datos reales del servidor
      queryClient.invalidateQueries({ 
        queryKey: participantsKeys.stats(variables.participantId) 
      });
      
      queryClient.invalidateQueries({ 
        queryKey: gameSessionsKeys.queue(variables.sessionId) 
      });
      
      console.log('✅ Jugada enviada con optimistic update:', {
        participant: variables.participantId,
        correct: variables.answeredCorrectly,
        prize: variables.prizeWon || 'Sin premio'
      });
    },
    onError: (error, variables) => {
      console.error('❌ Error en optimistic update:', {
        error: error.message,
        participant: variables.participantId
      });
    },
  });
}