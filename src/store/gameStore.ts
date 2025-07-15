// src/store/gameStore.ts
import { create } from 'zustand';
import type { 
  Participant, 
  Question, 
  PlaySession,
  GameStore,
  GameState,
  ParticipantsStats
} from '@/types';
import { useSessionStore } from './sessionStore';
import { tvLogger, tvProdLogger } from '@/utils/tvLogger';

// --- ACCIONES DEL STORE PARA EL JUEGO ---
export const useGameStore = create<GameStore>((set, get) => ({
  // Estados principales del juego
  gameState: 'roulette' as GameState,
  participants: [], // Lista de participantes (podría no ser necesaria si solo gestionas uno a la vez)
  currentParticipant: null,
  currentQuestion: null,
  lastSpinResultIndex: null,
  currentPlay: null,
  questions: [], // [modificación] Lista de preguntas para la ruleta
  gameSession: null, // [modificación] Guarda la PlaySession activa para el juego actual

  // [modificación] Estado para feedback del premio
  prizeFeedback: {
    answeredCorrectly: null,
    explanation: "",
    correctOption: "",
    prizeName: "",
  },

  // Estado global para mostrar confeti
  showConfetti: false,

  // [modificación] Removido adminUser del estado ya que se maneja en sessionStore
  adminState: {
    activeSessions: [],
    currentSession: null,
    participantsStats: { count: 0, participants: [] },
    isLoading: {
      sessionsList: false,
      sessionAction: false,
      participants: false,
    },
    error: null,
    success: null,
  },

  // --- ACCIONES PRINCIPALES DEL JUEGO ---
  setGameState: (newState: GameState) => set({ gameState: newState }),

  // [modificación] Actualizar setGameSession para evitar actualizaciones innecesarias
  setGameSession: (sessionData: PlaySession | null) => {
    if (!sessionData) {
      set({
        gameSession: null,
        currentParticipant: null,
        // [modificación] No establecer gameState automáticamente - dejar que los componentes manejen el estado
        currentQuestion: null,
        lastSpinResultIndex: null,
      });
      return;
    }

    // [modificación] Verificación más estricta para evitar actualizaciones redundantes
    const currentSession = get().gameSession;
    const currentParticipant = get().currentParticipant;
    
    if (currentSession && 
        currentSession.id === sessionData.id && 
        currentSession.status === sessionData.status &&
        currentSession.updated_at === sessionData.updated_at) {
      return;
    }

    // [modificación] Si solo hay cambios menores en participante, evitar log repetitivo
    if (currentSession && currentSession.id === sessionData.id && currentParticipant) {
    } else {
    }
    
    // [modificación] IMPORTANTE: Ya no extraemos datos del participante desde sessionData
    // porque estos datos ahora están en la tabla participants separada.
    // Los componentes que necesiten datos del participante deberán obtenerlos por separado.
    
    // [modificación] Solo actualizar la sesión, sin intentar crear participante desde sessionData
    set({
      gameSession: sessionData,
      // currentParticipant se manejará por separado cuando se necesite
      // No modificamos gameState aquí, esto lo hará el componente según necesite
    });
  },
  
  setCurrentParticipant: (participant) => set({ currentParticipant: participant }),
  
  // [modificación] Añadir función para establecer preguntas
  setQuestions: (questionsArray: Question[]) => set({ questions: questionsArray }),

  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  
  setLastSpinResultIndex: (index) => set({ lastSpinResultIndex: index }),

  updateCurrentParticipantScore: ({ questionId, answeredCorrectly, prizeWon }) => {
    set((state) => {
      if (!state.currentParticipant) return state;

      // Actualizamos el participante actual
      const updatedParticipant = {
        ...state.currentParticipant,
        lastQuestionId: questionId,
        answeredCorrectly,
        ...(prizeWon ? { prizeWon } : {})
      };

      // Actualizamos la lista de participantes si existe el participante allí
      const updatedParticipants = state.participants.map(p => 
        p.id === updatedParticipant.id ? updatedParticipant : p
      );

      return {
        currentParticipant: updatedParticipant,
        participants: updatedParticipants
      };
    });
  },

  // [modificación] Añadir resetCurrentGameData para resetear solo datos de la ronda actual
  resetCurrentGameData: () => set({
    currentQuestion: null,
    lastSpinResultIndex: null,
    gameState: 'roulette' as GameState,
  }),

  // [modificación] Funciones para gestionar el feedback del premio
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

  // [modificación] Actualizar clearCurrentGame para resetear completamente el juego
  resetCurrentGame: () => set({
    gameState: 'roulette' as GameState,
    currentParticipant: null,
    currentQuestion: null,
    lastSpinResultIndex: null,
    gameSession: null,
    showConfetti: false,
    prizeFeedback: {
      answeredCorrectly: null,
      explanation: "",
      correctOption: "",
      prizeName: ""
    },
    // No se limpian las 'questions' si son genéricas
  }),

  // Función de reseteo completo (incluido para compatibilidad)
  resetAllData: () => set({
    gameState: 'roulette' as GameState,
    participants: [],
    currentParticipant: null,
    currentQuestion: null,
    lastSpinResultIndex: null,
    currentPlay: null,
    gameSession: null,
    questions: [],
    showConfetti: false,
    prizeFeedback: {
      answeredCorrectly: null,
      explanation: "",
      correctOption: "",
      prizeName: "" 
    },
  }),

  // --- ACCIONES DEL PANEL DE ADMINISTRADOR ---
  // [modificación] Removido setAdminUser ya que ahora se maneja en sessionStore

  fetchGameSessions: async () => {
    const sessionState = useSessionStore.getState();
    const adminId = sessionState.user?.id;
    
    if (!adminId) {
      tvLogger.warn("Store: fetchGameSessions - No adminId available.");
      set(state => ({ adminState: { ...state.adminState, isLoading: { ...state.adminState.isLoading, sessionsList: false }, activeSessions: [] }}));
      return [];
    }
    set(state => ({ adminState: { ...state.adminState, isLoading: { ...state.adminState.isLoading, sessionsList: true }, error: null } }));
    try {
      const response = await fetch(`/api/admin/sessions/list?adminId=${adminId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status} al cargar sesiones`);
      }
      const sessionsData: PlaySession[] = await response.json();
      set(state => ({ adminState: { ...state.adminState, activeSessions: sessionsData || [], isLoading: { ...state.adminState.isLoading, sessionsList: false } } }));
      return sessionsData;
    } catch (error: Error | unknown) {
      tvProdLogger.error("Store: fetchGameSessions error:", error);
      set(state => ({ adminState: { ...state.adminState, error: error instanceof Error ? error.message : 'Error desconocido', activeSessions: [], isLoading: { ...state.adminState.isLoading, sessionsList: false } } }));
      return [];
    }
  },

  fetchParticipantsStats: async () => {
    set(state => ({ adminState: { ...state.adminState, isLoading: { ...state.adminState.isLoading, participants: true }, error: null } }));
    try {
      tvLogger.debug('Store: Iniciando fetchParticipantsStats...');
      const response = await fetch('/api/participants');
      if (!response.ok) {
        const errorData = await response.json();
        tvProdLogger.error('Store: Error en fetchParticipantsStats response:', errorData);
        throw new Error(errorData.message || `Error ${response.status} al cargar estadísticas de participantes`);
      }
      const statsData: ParticipantsStats = await response.json();
      tvLogger.debug('Store: fetchParticipantsStats datos recibidos:', statsData);
      const stats = { count: statsData.count, participants: statsData.participants || [] };
      set(state => ({ 
        adminState: { 
          ...state.adminState, 
          participantsStats: stats, 
          isLoading: { ...state.adminState.isLoading, participants: false } 
        } 
      }));
      tvLogger.debug('Store: fetchParticipantsStats guardado en store:', stats);
      return stats;
    } catch (error: Error | unknown) {
      tvProdLogger.error("Store: fetchParticipantsStats error:", error);
      set(state => ({ 
        adminState: { 
          ...state.adminState, 
          error: error instanceof Error ? error.message : 'Error desconocido', 
          participantsStats: { count: 0, participants: [] }, 
          isLoading: { ...state.adminState.isLoading, participants: false } 
        } 
      }));
      return { count: 0, participants: [] };
    }
  },

  fetchParticipantsList: async () => {
    set(state => ({ adminState: { ...state.adminState, isLoading: { ...state.adminState.isLoading, participants: true }, error: null } }));
    try {
      tvLogger.debug('Store: Iniciando fetchParticipantsList...');
      const response = await fetch('/api/participants?detail=true');
      if (!response.ok) {
        const errorData = await response.json();
        tvProdLogger.error('Store: Error en fetchParticipantsList response:', errorData);
        throw new Error(errorData.message || `Error ${response.status} al cargar lista de participantes`);
      }
      const data = await response.json();
      tvLogger.debug('Store: fetchParticipantsList datos recibidos:', data);
      const participants = data.participants || [];
      tvLogger.debug('Store: fetchParticipantsList participantes procesados:', participants);
      set(state => ({ 
        adminState: { 
          ...state.adminState, 
          participantsStats: { count: data.count, participants }, 
          isLoading: { ...state.adminState.isLoading, participants: false } 
        } 
      }));
      tvLogger.debug('Store: fetchParticipantsList guardado en store - count:', data.count, 'participants length:', participants.length);
      return participants;
    } catch (error: Error | unknown) {
      tvProdLogger.error("Store: fetchParticipantsList error:", error);
      set(state => ({ 
        adminState: { 
          ...state.adminState, 
          error: error instanceof Error ? error.message : 'Error desconocido', 
          participantsStats: { count: 0, participants: [] }, 
          isLoading: { ...state.adminState.isLoading, participants: false } 
        } 
      }));
      return [];
    }
  },

  setParticipantsStats: (stats: ParticipantsStats) => set(state => ({
    adminState: { ...state.adminState, participantsStats: stats }
  })),

  setAdminCurrentSession: (session: PlaySession | null) => set(state => ({
    adminState: { ...state.adminState, currentSession: session }
  })),

  setAdminLoading: (type, isLoadingValue) => set(state => ({
    adminState: { ...state.adminState, isLoading: { ...state.adminState.isLoading, [type]: isLoadingValue } }
  })),

  setAdminNotification: (type: 'success' | 'error', message: string | null) => set(state => ({
    adminState: { ...state.adminState, success: type === 'success' ? message : null, error: type === 'error' ? message : null }
  })),

  clearAdminNotifications: () => set(state => ({
    adminState: { ...state.adminState, error: null, success: null }
  })),

  createNewSession: async () => {
    // [modificación] Obtener adminId desde sessionStore en lugar de adminUser
    const sessionState = useSessionStore.getState();
    const adminId = sessionState.user?.id;
    
    if (!adminId) {
      get().setAdminNotification('error', 'No se puede crear sesión: ID de Admin no disponible.');
      return null;
    }
    get().setAdminLoading('sessionAction', true);
    get().clearAdminNotifications();
    try {
      const response = await fetch('/api/admin/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.details ? `${errorData.message} Det: ${errorData.details}` : errorData.message;
        throw new Error(errorMessage || 'Error al crear el juego.');
      }
      const data = await response.json();
      let gameSessionUUID = '';
      if (data && data.sessionId) gameSessionUUID = data.sessionId;
      else if (data && data.session && data.session.session_id) gameSessionUUID = data.session.session_id;
      else throw new Error('Respuesta de creación de juego inválida.');

      const fullUrl = `${window.location.origin}/register/${gameSessionUUID}`;
      try {
        await navigator.clipboard.writeText(fullUrl);
        get().setAdminNotification('success', 'Sesión de juego creada.');
      } catch {
        get().setAdminNotification('success', 'Error: Sesión de juego no creada.');
      }
      await get().fetchGameSessions();
      return gameSessionUUID;
    } catch (error: Error | unknown) {
      tvProdLogger.error("Store: createNewSession error:", error);
      get().setAdminNotification('error', error instanceof Error ? error.message : 'Error desconocido');
      return null;
    } finally {
      get().setAdminLoading('sessionAction', false);
    }
  },

  updateSessionStatus: async (sessionId: string, status: string) => {
    // [modificación] Obtener adminId desde sessionStore en lugar de adminUser
    const sessionState = useSessionStore.getState();
    const adminId = sessionState.user?.id;
    
    get().setAdminLoading('sessionAction', true);
    get().clearAdminNotifications();
    try {
      const response = await fetch('/api/admin/sessions/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, status, adminId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al actualizar estado.');
      get().setAdminNotification('success', `Juego ${sessionId.substring(0,8)} actualizado a ${status}.`);
      return true;
    } catch (error: Error | unknown) {
      tvProdLogger.error("Store: updateSessionStatus error:", error);
      get().setAdminNotification('error', error instanceof Error ? error.message : 'Error desconocido');
      return false;
    } finally {
      get().setAdminLoading('sessionAction', false);
    }
  },

  // Funcionalidad para compatibilidad con flujos existentes
  addParticipant: (participantData) => {
    const newParticipant: Participant = {
      id: Date.now().toString(),
      ...participantData,
    };
    set((state) => ({
      participants: [...state.participants, newParticipant],
    }));
  },

  startPlaySession: async (userData, onSuccess, onError) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar jugador');
      }
      
      const { participant } = data;
      
      if (participant) {
        get().setCurrentParticipant(participant);
        if (onSuccess) onSuccess(data);
      } else {
        throw new Error('Respuesta de registro inválida');
      }
    } catch (error: Error | unknown) {
      tvProdLogger.error('Error en startPlaySession:', error);
      if (onError) onError(error);
    }
  },
}));
