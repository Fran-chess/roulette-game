// src/store/gameStore.ts
import { create } from 'zustand';
// import { persist, createJSONStorage } from 'zustand/middleware'; // Descomentar si necesitas persistencia
import type { Participant, Question, GameState, GameStore as GameStoreType, Play } from '@/types';


// Usamos GameStoreType de @/types para el estado y las acciones
export const useGameStore = create<GameStoreType>((set, get) => ({
  gameState: 'screensaver',
  participants: [],
  currentParticipant: null,
  currentQuestion: null,
  lastSpinResultIndex: null,
  currentPlay: null,

  setGameState: (state) => set({ gameState: state }),
  addParticipant: (participantData) => {
    const newParticipant: Participant = {
      id: Date.now().toString(),
      timestamp: new Date(),
      nombre: participantData.nombre, // Asegúrate que todos los campos obligatorios de Omit vengan
      apellido: participantData.apellido,
      email: participantData.email,
      especialidad: participantData.especialidad,
      // No inicializamos lastQuestionId, answeredCorrectly, prizeWon aquí
    };
    set((state) => ({
      participants: [...state.participants, newParticipant],
      currentParticipant: newParticipant,
    }));
  },
  startPlaySession: async (userData, onSuccess, onError) => {
    try {
      const response = await fetch('/api/handle-play-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al iniciar sesión de juego');
      }

      set((state: GameStoreType) => {
        const existingIndex = state.participants.findIndex((p: Participant) => p.id === result.participant.id);
        
        let updatedParticipants: Participant[];
        if (existingIndex >= 0) {
          updatedParticipants = [
            ...state.participants.slice(0, existingIndex),
            result.participant,
            ...state.participants.slice(existingIndex + 1)
          ];
        } else {
          updatedParticipants = [...state.participants, result.participant];
        }
        
        return {
          currentParticipant: result.participant,
          currentPlay: result.play || null,
          participants: updatedParticipants
        };
      });
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error: any) {
      console.error("Error en startPlaySession (store):", error);
      if (onError) {
        onError(error);
      }
    }
  },
  setCurrentParticipant: (participant) => set({ currentParticipant: participant }),
  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  setLastSpinResultIndex: (index) => set({ lastSpinResultIndex: index }),

  updateCurrentParticipantScore: ({ questionId, answeredCorrectly, prizeWon }) => {
    set((state) => {
      if (!state.currentParticipant) return {};
      const updatedParticipant: Participant = {
        ...state.currentParticipant,
        lastQuestionId: questionId,
        answeredCorrectly: answeredCorrectly,
        prizeWon: prizeWon,
      };
      return {
        currentParticipant: updatedParticipant,
        participants: state.participants.map(p =>
          p.id === updatedParticipant.id ? updatedParticipant : p
        ),
      };
    });
  },

  resetCurrentGame: () => set({
    currentQuestion: null,
    lastSpinResultIndex: null,
    currentPlay: null,
  }),
  resetAllData: () => {
    if (confirm('¿Estás seguro de que quieres borrar TODOS los datos de participantes? Esta acción no se puede deshacer.')) {
        set({
            participants: [],
            currentParticipant: null,
            currentQuestion: null,
            lastSpinResultIndex: null,
            currentPlay: null,
            gameState: 'screensaver',
        });
    }
  },
}));