import { useQuery } from '@tanstack/react-query';
import { Question } from '@/types';

// Query Keys para questions
export const questionsKeys = {
  all: ['questions'] as const,
  lists: () => [...questionsKeys.all, 'list'] as const,
};

// Hook para obtener todas las preguntas
export function useQuestions() {
  return useQuery({
    queryKey: questionsKeys.lists(),
    queryFn: async (): Promise<{ questions: Question[] }> => {
      const response = await fetch('/api/questions');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - las preguntas no cambian frecuentemente
    gcTime: 30 * 60 * 1000, // 30 minutos en cache - mantener las preguntas por mucho tiempo
    retry: 3, // Reintentar hasta 3 veces si falla
  });
}

// Hook para obtener una pregunta aleatoria (usando las preguntas cacheadas)
export function useRandomQuestion() {
  const { data: questionsData, ...queryResult } = useQuestions();
  
  const getRandomQuestion = (): Question | null => {
    if (!questionsData?.questions || questionsData.questions.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * questionsData.questions.length);
    return questionsData.questions[randomIndex];
  };
  
  return {
    ...queryResult,
    data: questionsData,
    getRandomQuestion,
    questionsCount: questionsData?.questions?.length || 0,
  };
}