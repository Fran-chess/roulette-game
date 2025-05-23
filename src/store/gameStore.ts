// src/store/gameStore.ts
import { create } from 'zustand';
import type { 
  Participant, 
  Question, 
  PlaySession,
  GameStore
} from '@/types';

// --- ACCIONES DEL STORE PARA EL JUEGO ---
export const useGameStore = create<GameStore>((set, get) => ({
  // Estados principales del juego
  gameState: 'screensaver',
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

  // Estado del administrador
  adminUser: null,
  adminState: {
    activeSessions: [],
    currentSession: null,
    isLoading: {
      sessionsList: false,
      sessionAction: false,
    },
    error: null,
    success: null,
  },

  // --- ACCIONES PRINCIPALES DEL JUEGO ---
  setGameState: (newState) => set({ gameState: newState }),

  // [modificación] Actualizar setGameSession para evitar actualizaciones innecesarias
  setGameSession: (sessionData: PlaySession | null) => {
    if (!sessionData) {
      console.log('GameStore: Limpiando sesión de juego activa.');
      set({
        gameSession: null,
        currentParticipant: null,
        gameState: 'screensaver',
        currentQuestion: null,
        lastSpinResultIndex: null,
      });
      return;
    }

    // [modificación] Verificar si la sesión ya está establecida y es la misma
    const currentSession = get().gameSession;
    if (currentSession && 
        currentSession.id === sessionData.id && 
        currentSession.status === sessionData.status) {
      console.log('GameStore: Sesión ya establecida con mismo estado, evitando actualización redundante');
      return;
    }

    console.log('GameStore: Estableciendo sesión de juego:', sessionData);
    let participantForSession: Participant | null = null;
    // [modificación] Mantener el estado actual del juego por defecto (no modificarlo aquí)
    // Esta será responsabilidad del componente que llama a setGameSession
    
    // [modificación] Extraer datos del participante si existen
    if (sessionData.nombre && sessionData.email) {
      participantForSession = {
        id: sessionData.participant_id || sessionData.email, 
        timestamp: new Date(sessionData.updated_at || sessionData.created_at),
        nombre: sessionData.nombre,
        apellido: sessionData.apellido || '',
        email: sessionData.email,
        especialidad: sessionData.especialidad || '',
      };
    }
    
    // [modificación] Sólo guardar los datos, no modificar el estado de la aplicación
    console.log(`GameStore: Actualizando datos de sesión`);
    set({
      gameSession: sessionData,
      currentParticipant: participantForSession,
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
    gameState: 'roulette',
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
    gameState: 'screensaver',
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
    gameState: 'screensaver',
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
  setAdminUser: (adminData) => set({ adminUser: adminData }),

  fetchGameSessions: async () => {
    const adminId = get().adminUser?.id;
    if (!adminId) {
      console.warn("Store: fetchGameSessions - No adminId available.");
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
      console.error("Store: fetchGameSessions error:", error);
      set(state => ({ adminState: { ...state.adminState, error: error instanceof Error ? error.message : 'Error desconocido', activeSessions: [], isLoading: { ...state.adminState.isLoading, sessionsList: false } } }));
      return [];
    }
  },

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
    const adminId = get().adminUser?.id;
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
        get().setAdminNotification('success', 'Juego creado. URL copiada!');
      } catch {
        get().setAdminNotification('success', 'Juego creado. (URL no copiada)');
      }
      await get().fetchGameSessions();
      return gameSessionUUID;
    } catch (error: Error | unknown) {
      console.error("Store: createNewSession error:", error);
      get().setAdminNotification('error', error instanceof Error ? error.message : 'Error desconocido');
      return null;
    } finally {
      get().setAdminLoading('sessionAction', false);
    }
  },

  updateSessionStatus: async (sessionId: string, status: string) => {
    const adminId = get().adminUser?.id;
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
      console.error("Store: updateSessionStatus error:", error);
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
      timestamp: new Date(),
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
      console.error('Error en startPlaySession:', error);
      if (onError) onError(error);
    }
  },
}));