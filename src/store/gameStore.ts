// src/store/gameStore.ts
import { create } from 'zustand';
import type { 
  Question, 
  GameStore,
  GameState
} from '@/types';

// --- STORE SIMPLIFICADO PARA EL JUEGO ---
export const useGameStore = create<GameStore>((set, get) => ({
  // Estados principales del juego
  gameState: 'waiting' as GameState,
  currentQuestion: null,
  lastSpinResultIndex: null,
  recentSpinSegments: [],
  questions: [],
  showConfetti: false,
  
  // Estado para feedback del premio
  prizeFeedback: {
    answeredCorrectly: null,
    explanation: "",
    correctOption: "",
    prizeName: "",
  },

  // --- ACCIONES PRINCIPALES DEL JUEGO ---
  setGameState: (newState: GameState) => set({ gameState: newState }),
  
  setQuestions: (questionsArray: Question[]) => set({ questions: questionsArray }),

  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  
  setLastSpinResultIndex: (index) => set({ lastSpinResultIndex: index }),

  // Función para actualizar historial de segmentos
  addRecentSpinSegment: (segmentIndex: number) => set((state) => {
    const maxHistoryLength = 3; // Recordar últimos 3 giros
    const newHistory = [...state.recentSpinSegments, segmentIndex];
    
    // Mantener solo los últimos N giros
    if (newHistory.length > maxHistoryLength) {
      newHistory.shift(); // Remover el más antiguo
    }
    
    return { recentSpinSegments: newHistory };
  }),

  // Resetear datos de la ronda actual
  resetCurrentGameData: () => set({
    currentQuestion: null,
    lastSpinResultIndex: null,
    recentSpinSegments: [],
    gameState: 'waiting' as GameState,
  }),

  // Funciones para gestionar el feedback del premio
  setPrizeFeedback: (feedback) => set({ prizeFeedback: feedback }),

  setShowConfetti: (value: boolean) => set({ showConfetti: value }),
  
  resetPrizeFeedback: () => set({ 
    prizeFeedback: { 
      answeredCorrectly: null, 
      explanation: "", 
      correctOption: "", 
      prizeName: "" 
    } 
  }),

  // Resetear el juego a estado inicial
  resetCurrentGame: () => {
    set({
      gameState: 'waiting' as GameState,
      currentQuestion: null,
      lastSpinResultIndex: null,
      recentSpinSegments: [],
      showConfetti: false,
      prizeFeedback: {
        answeredCorrectly: null,
        explanation: "",
        correctOption: "",
        prizeName: ""
      },
    });
  },

  // Mover al siguiente estado del juego
  moveToNext: () => {
    const { gameState } = get();
    
    // Si estamos en ruleta o pregunta o premio, volver a waiting
    if (gameState === 'roulette' || gameState === 'question' || gameState === 'prize') {
      get().resetCurrentGame();
    } else {
      // Si estamos en waiting, ir a ruleta
      set({ gameState: 'roulette' as GameState });
    }
  },
}));