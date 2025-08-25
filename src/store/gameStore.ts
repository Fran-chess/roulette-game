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
  gameState: 'waiting' as GameState,
  participants: [], // Lista de participantes (podría no ser necesaria si solo gestionas uno a la vez)
  currentParticipant: null,
  currentQuestion: null,
  lastSpinResultIndex: null,
  // [NUEVO] Historial de segmentos para evitar repetición
  recentSpinSegments: [], // Array de últimos segmentos donde cayó la ruleta
  currentPlay: null,
  questions: [], // [modificación] Lista de preguntas para la ruleta
  gameSession: null, // [modificación] Guarda la PlaySession activa para el juego actual
  
  // NUEVA: Cola de participantes
  waitingQueue: [],
  nextParticipant: null,
  
  // Control de timeout para transiciones
  transitionTimeout: null as NodeJS.Timeout | null,

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
        recentSpinSegments: [],
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
  
  setNextParticipant: (participant) => set({ nextParticipant: participant }),
  
  // [modificación] Añadir función para establecer preguntas
  setQuestions: (questionsArray: Question[]) => set({ questions: questionsArray }),

  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  
  setLastSpinResultIndex: (index) => set({ lastSpinResultIndex: index }),

  // [NUEVO] Función para actualizar historial de segmentos
  addRecentSpinSegment: (segmentIndex: number) => set((state) => {
    const maxHistoryLength = 3; // Recordar últimos 3 giros
    const newHistory = [...state.recentSpinSegments, segmentIndex];
    
    // Mantener solo los últimos N giros
    if (newHistory.length > maxHistoryLength) {
      newHistory.shift(); // Remover el más antiguo
    }
    
    return { recentSpinSegments: newHistory };
  }),

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
    recentSpinSegments: [],
    gameState: 'inGame' as GameState,
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
    gameState: 'inGame' as GameState,
    currentParticipant: null,
    nextParticipant: null,
    currentQuestion: null,
    lastSpinResultIndex: null,
    recentSpinSegments: [],
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
    gameState: 'waiting' as GameState,
    participants: [],
    currentParticipant: null,
    nextParticipant: null,
    currentQuestion: null,
    lastSpinResultIndex: null,
    recentSpinSegments: [],
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
      // Usar el nuevo endpoint optimizado que trae todas las sesiones con sus participantes
      const response = await fetch('/api/admin/sessions/with-participants');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status} al cargar sesiones`);
      }
      const data = await response.json();
      const sessionsData: PlaySession[] = data.sessions || [];
      
      // El endpoint ya incluye los participantes, así que solo guardamos las sesiones
      // Los participantes están disponibles en cada session.participants si se necesitan
      set(state => ({ adminState: { ...state.adminState, activeSessions: sessionsData, isLoading: { ...state.adminState.isLoading, sessionsList: false } } }));
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
      const response = await fetch('/api/participants?detail=true');
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

  // Función para obtener la sesión activa
  fetchActiveSession: async () => {
    const sessionState = useSessionStore.getState();
    const adminId = sessionState.user?.id;
    
    if (!adminId) {
      tvLogger.warn("Store: fetchActiveSession - No adminId available.");
      return null;
    }
    
    set(state => ({ adminState: { ...state.adminState, isLoading: { ...state.adminState.isLoading, sessionsList: true }, error: null } }));
    
    try {
      const response = await fetch('/api/admin/sessions/active');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status} al obtener sesión activa`);
      }
      const data = await response.json();
      
      if (data.hasActiveSession && data.activeSession) {
        set(state => ({ 
          adminState: { 
            ...state.adminState, 
            currentSession: data.activeSession,
            isLoading: { ...state.adminState.isLoading, sessionsList: false }
          }
        }));
        return data.activeSession;
      } else {
        set(state => ({ 
          adminState: { 
            ...state.adminState, 
            currentSession: null,
            isLoading: { ...state.adminState.isLoading, sessionsList: false }
          }
        }));
        return null;
      }
    } catch (error: Error | unknown) {
      tvProdLogger.error("Store: fetchActiveSession error:", error);
      set(state => ({ 
        adminState: { 
          ...state.adminState, 
          error: error instanceof Error ? error.message : 'Error desconocido',
          isLoading: { ...state.adminState.isLoading, sessionsList: false }
        }
      }));
      return null;
    }
  },

  // Función pública para obtener sesión activa (para interfaz TV sin autenticación)
  fetchActiveSessionPublic: async () => {
    try {
      const response = await fetch('/api/sessions/active', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        let errorMessage = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Si no se puede parsear el JSON, usar mensaje por defecto
        }
        throw new Error(`${errorMessage} al obtener sesión activa`);
      }
      
      const data = await response.json();
      
      if (data.hasActiveSession && data.session?.session_id) {
        console.log('📥 TV-INIT: ✅ Sesión activa encontrada via API pública:', data.session.session_id);
        // Actualizar solo gameSession, no adminState
        set({ gameSession: data.session });
        return data.session;
      } else {
        console.log('📥 TV-INIT: No hay sesión activa disponible (API pública)');
        set({ gameSession: null });
        return null;
      }
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      tvProdLogger.error("Store: fetchActiveSessionPublic error:", errorMessage);
      console.error('📥 TV-INIT: Error al obtener sesión activa:', errorMessage);
      set({ gameSession: null });
      return null;
    }
  },

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
        
        // Manejar el caso específico de sesión ya activa
        if (response.status === 409 && errorData.cannotCreate) {
          get().setAdminNotification('error', 'Ya existe una partida activa. Debes continuar con la partida existente o cerrarla primero.');
          // Actualizar la sesión actual con la sesión activa encontrada
          if (errorData.activeSession) {
            get().setAdminCurrentSession(errorData.activeSession);
          }
          return null;
        }
        
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

  // Función para cerrar la sesión activa
  closeActiveSession: async (sessionId: string) => {
    get().setAdminLoading('sessionAction', true);
    get().clearAdminNotifications();
    
    try {
      const response = await fetch('/api/admin/sessions/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cerrar la sesión');
      }
      
      await response.json();
      get().setAdminNotification('success', 'Partida cerrada exitosamente.');
      
      // Limpiar la sesión actual
      get().setAdminCurrentSession(null);
      
      // Actualizar la lista de sesiones
      await get().fetchGameSessions();
      
      return true;
    } catch (error: Error | unknown) {
      tvProdLogger.error("Store: closeActiveSession error:", error);
      get().setAdminNotification('error', error instanceof Error ? error.message : 'Error desconocido');
      return false;
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

  // --- HANDLERS DE COLA ---
  addToQueue: async (participant: Participant) => {
    tvLogger.participant(`QUEUE: Agregando ${participant.nombre} a cola (${get().waitingQueue.length} en cola)`);
    tvLogger.participant(`QUEUE: Estado actual - GameState: ${get().gameState}, CurrentParticipant: ${get().currentParticipant?.nombre || 'null'}`);
    
    const currentParticipant = get().currentParticipant;
    
    // IMPORTANTE: Verificar si el participante actual está realmente activo
    // Si está completado o removido, limpiar el estado para permitir activación directa
    const shouldClearCurrentParticipant = currentParticipant && (
      currentParticipant.status === 'completed' || 
      currentParticipant.status === 'disqualified'
    );
    
    if (shouldClearCurrentParticipant) {
      tvLogger.participant(`QUEUE: Limpiando participante inactivo: ${currentParticipant.nombre} (${currentParticipant.status})`);
      set({ currentParticipant: null, gameState: 'waiting' });
    }
    
    const activeCurrentParticipant = shouldClearCurrentParticipant ? null : currentParticipant;
    
    if (!activeCurrentParticipant) {
      // Si no hay participante activo, activar directamente
      tvLogger.participant(`QUEUE: Activando directamente: ${participant.nombre}`);
      tvLogger.participant(`QUEUE: Estableciendo gameState: 'inGame' y currentParticipant: ${participant.nombre}`);
      
      // Asegurar que el participante tenga status correcto para jugar
      const playingParticipant = { ...participant, status: 'playing' as const };
      set({ currentParticipant: playingParticipant, gameState: 'inGame' });
      
      // Actualizar estado del participante a playing
      try {
        await fetch('/api/participants/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: playingParticipant.id,
            status: 'playing'
          }),
        });
      } catch (error) {
        console.error('Error al activar participante:', error);
      }
    } else {
      // Si hay participante activo, agregar a la cola o actualizar si ya existe
      tvLogger.participant(`QUEUE: Procesando ${participant.nombre} para cola (participante activo: ${activeCurrentParticipant.nombre})`);
      
      set((state) => {
        // Verificar si el participante ya existe en la cola
        const existingIndex = state.waitingQueue.findIndex(p => p.id === participant.id);
        
        if (existingIndex >= 0) {
          // Actualizar participante existente en la cola
          const newQueue = [...state.waitingQueue];
          newQueue[existingIndex] = participant;
          console.log(`🔄 QUEUE: Participante actualizado en cola: ${participant.nombre}`);
          return { waitingQueue: newQueue };
        } else {
          // Agregar nuevo participante a la cola
          const newQueue = [...state.waitingQueue, participant];
          console.log(`🔗 QUEUE: Nueva cola:`, newQueue.map(p => p.nombre));
          return { waitingQueue: newQueue };
        }
      });
    }
    
    // Sync a BD
    const currentSession = get().gameSession;
    if (currentSession) {
      await get().saveQueueToDB(currentSession.session_id);
    }
    
    // Broadcast state change to other tabs/windows
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gameStoreUpdate', {
        detail: {
          type: 'QUEUE_UPDATE',
          currentParticipant: get().currentParticipant,
          waitingQueue: get().waitingQueue,
          gameState: get().gameState
        }
      }));
    }
    
    tvLogger.participant(`QUEUE: Participante procesado - Cola final: ${get().waitingQueue.length}`);
    tvLogger.participant(`QUEUE: Participante activo final: ${get().currentParticipant ? 'Sí' : 'No'}`);
  },

  removeFromQueue: async (participantId: string) => {
    tvLogger.participant(`REMOVE-FROM-QUEUE: Removiendo participante de la cola`);
    
    // PASO 1: Primero intentar marcar el participante como 'disqualified' en la BD
    try {
      const response = await fetch('/api/admin/sessions/update-participant-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participantId,
          status: 'disqualified'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error ${response.status}: ${errorData.error || 'Error desconocido'}`);
      }
      
      tvLogger.participant(`REMOVE-FROM-QUEUE: Participante marcado como disqualified en BD`);
    } catch (error) {
      tvProdLogger.error('REMOVE-FROM-QUEUE: Error al marcar participante como removido en BD:', error);
      throw error; // Propagar el error para que el caller sepa que falló
    }
    
    // PASO 2: Solo si la BD fue exitosa, eliminar de la cola en memoria y limpiar nextParticipant si coincide
    set((state) => {
      const newQueue = state.waitingQueue.filter(p => p.id !== participantId);
      tvLogger.participant(`REMOVE-FROM-QUEUE: Cola actualizada - antes: ${state.waitingQueue.length}, después: ${newQueue.length}`);
      
      // IMPORTANTE: Si el participante removido era el nextParticipant, limpiarlo inmediatamente
      const newNextParticipant = state.nextParticipant?.id === participantId ? null : state.nextParticipant;
      if (state.nextParticipant?.id === participantId) {
        tvLogger.participant(`REMOVE-FROM-QUEUE: Limpiando nextParticipant`);
      }
      
      return { 
        waitingQueue: newQueue,
        nextParticipant: newNextParticipant
      };
    });
    
    // PASO 3: Sync cola a BD (guardando la nueva cola sin el participante removido)
    const currentSession = get().gameSession;
    if (currentSession) {
      await get().saveQueueToDB(currentSession.session_id);
      tvLogger.participant(`REMOVE-FROM-QUEUE: Cola sincronizada en BD`);
      
      // PASO 4: Recargar cola desde BD para asegurar consistencia
      await get().loadQueueFromDB(currentSession.session_id);
      tvLogger.participant(`REMOVE-FROM-QUEUE: Cola recargada desde BD`);
    }
  },

  // NUEVA FUNCIÓN: Centralizada para manejar transiciones con timeout controlado
  prepareAndActivateNext: async (delayMs: number = 3000) => {
    const { currentParticipant, transitionTimeout, gameSession } = get();
    
    tvLogger.transition(`Iniciando transición con delay: ${delayMs}ms`);
    
    // Cancelar timeout anterior si existe para evitar condiciones de carrera
    if (transitionTimeout) {
      clearTimeout(transitionTimeout);
      set({ transitionTimeout: null });
      tvLogger.transition('Timeout anterior cancelado');
    }
    
    // PASO 1: Marcar participante actual como completado si existe
    if (currentParticipant) {
      tvLogger.transition(`Marcando como completado: ${currentParticipant.nombre}`);
      
      try {
        await fetch('/api/participants/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: currentParticipant.id,
            status: 'completed'
          }),
        });
        tvLogger.transition(`Participante ${currentParticipant.nombre} marcado como completado`);
      } catch (error) {
        tvProdLogger.error('Error al marcar participante como completado:', error);
      }
    }
    
    // PASO 2: Recargar cola desde BD para obtener datos actualizados
    if (gameSession) {
      tvLogger.transition('Recargando cola desde BD');
      await get().loadQueueFromDB(gameSession.session_id);
    }
    
    // PASO 3: Obtener siguiente participante válido
    const { waitingQueue } = get();
    const validQueue = waitingQueue.filter(p => 
      p.status !== 'completed' && 
      p.status !== 'disqualified'
    );
    
    if (validQueue.length > 0) {
      const nextParticipant = validQueue[0];
      tvLogger.transition(`Preparando transición para: ${nextParticipant.nombre}`);
      
      // PASO 4: Establecer estado de transición
      set({
        nextParticipant: nextParticipant,
        gameState: 'transition' as GameState
      });
      
      // PASO 5: Programar activación del participante después del delay
      const newTimeout = setTimeout(async () => {
        tvLogger.transition(`Activando participante: ${nextParticipant.nombre}`);
        
        // Activar participante
        const updatedParticipant = {
          ...nextParticipant,
          status: 'playing' as const
        };
        
        // Actualizar estado: remover de cola, establecer como actual, limpiar transición
        set((state) => ({
          waitingQueue: state.waitingQueue.filter(p => p.id !== nextParticipant.id),
          currentParticipant: updatedParticipant,
          nextParticipant: null,
          gameState: 'inGame' as GameState,
          transitionTimeout: null
        }));
        
        // Actualizar estado en BD
        try {
          await fetch('/api/participants/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              participantId: nextParticipant.id,
              status: 'playing'
            }),
          });
          tvLogger.transition(`Participante ${nextParticipant.nombre} activado exitosamente`);
        } catch (error) {
          tvProdLogger.error('Error al activar participante:', error);
        }
      }, delayMs);
      
      // Guardar referencia del timeout
      set({ transitionTimeout: newTimeout });
      
    } else {
      // No hay más participantes - ir a screensaver
      tvLogger.transition('Cola vacía, estableciendo modo screensaver');
      set({
        currentParticipant: null,
        nextParticipant: null,
        gameState: 'screensaver' as GameState
      });
    }
  },

  // FUNCIÓN LEGACY: Mantener para compatibilidad pero simplificada
  moveToNext: async () => {
    const { gameState } = get();
    
    // Si estamos en transición, solo activar el nextParticipant (para TransitionScreen legacy)
    if (gameState === 'transition') {
      const { nextParticipant } = get();
      
      if (nextParticipant) {
        tvLogger.session(`LEGACY-MOVE-TO-NEXT: Activando ${nextParticipant.nombre}`);
        
        const updatedParticipant = {
          ...nextParticipant,
          status: 'playing' as const
        };
        
        set((state) => ({
          waitingQueue: state.waitingQueue.filter(p => p.id !== nextParticipant.id),
          currentParticipant: updatedParticipant,
          nextParticipant: null,
          gameState: 'inGame' as GameState
        }));
        
        try {
          await fetch('/api/participants/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              participantId: nextParticipant.id,
              status: 'playing'
            }),
          });
        } catch (error) {
          tvProdLogger.error('Error al activar participante:', error);
        }
      }
    } else {
      // Para otros casos, usar la nueva función con delay por defecto
      await get().prepareAndActivateNext(3000);
    }
  },

  reorderQueue: async (newOrder: Participant[]) => {
    set({ waitingQueue: newOrder });
    
    // Sync a BD
    const currentSession = get().gameSession;
    if (currentSession) {
      await get().saveQueueToDB(currentSession.session_id);
    }
  },

  // --- SINCRONIZACIÓN BD ---
  loadQueueFromDB: async (sessionId: string) => {
    tvLogger.session(`LOAD-QUEUE: Cargando cola desde BD`);
    try {
      // Hacer ambas llamadas en paralelo para mejor rendimiento
      const [queueResponse, participantsResponse] = await Promise.all([
        fetch(`/api/admin/sessions/queue?sessionId=${sessionId}`),
        fetch(`/api/admin/sessions/participants?sessionId=${sessionId}`)
      ]);

      if (!queueResponse.ok) {
        throw new Error('Error al cargar cola desde BD');
      }

      if (!participantsResponse.ok) {
        throw new Error('Error al cargar participantes desde BD');
      }
      
      const queueData = await queueResponse.json();
      const participantsData = await participantsResponse.json();
      
      const queueIds = queueData.waitingQueue || [];
      const queueParticipants = queueData.participants || [];
      const allParticipants = participantsData.participants || [];
      
      tvLogger.session(`LOAD-QUEUE: ${queueIds.length} IDs en cola, ${queueParticipants.length} participantes filtrados, ${allParticipants.length} participantes totales`);
      
      // Buscar el participante activo (con status 'playing')
      const activeParticipant = allParticipants.find((p: Participant) => p.status === 'playing');
      
      if (activeParticipant) {
        tvLogger.participant(`LOAD-QUEUE: Participante activo encontrado: ${activeParticipant.nombre}`);
        set({ currentParticipant: activeParticipant });
      } else {
        tvLogger.participant('LOAD-QUEUE: No hay participante con status playing - limpiando currentParticipant');
        // IMPORTANTE: Limpiar currentParticipant si no hay nadie jugando actualmente
        set({ currentParticipant: null });
      }
      
      // Filtrar participantes removidos de la cola y completados
      // Usar allParticipants para obtener el estado más actual
      const validQueueParticipants = queueParticipants.filter((p: Participant) => {
        // Buscar el estado más actual del participante en allParticipants
        const currentParticipant = allParticipants.find((ap: Participant) => ap.id === p.id);
        const actualStatus = currentParticipant?.status || p.status;
        
        return actualStatus !== 'completed' && actualStatus !== 'disqualified';
      });
      
      if (validQueueParticipants.length > 0) {
        tvLogger.session(`LOAD-QUEUE: ${validQueueParticipants.length} participantes válidos en cola`);
        set({ waitingQueue: validQueueParticipants });
        
        // IMPORTANTE: También limpiar nextParticipant si está en la lista de removidos
        const nextParticipant = get().nextParticipant;
        if (nextParticipant && (
          nextParticipant.status === 'completed' || 
          nextParticipant.status === 'disqualified'
        )) {
          console.log(`🧹 LOAD-QUEUE: Limpiando nextParticipant inválido: ${nextParticipant.nombre}`);
          set({ nextParticipant: null });
        }
      } else {
        tvLogger.session('LOAD-QUEUE: No hay participantes válidos en cola después del filtrado');
        set({ waitingQueue: [] });
      }
      
      tvLogger.session(`LOAD-QUEUE: Estado actualizado - Participante activo: ${activeParticipant ? activeParticipant.nombre : 'ninguno'}, Cola: ${validQueueParticipants.length} participantes válidos`);
    } catch (error) {
      console.error('📥 LOAD-QUEUE: Error al cargar cola desde BD:', error);
      tvProdLogger.error('Error al cargar cola desde BD:', error);
    }
  },

  saveQueueToDB: async (sessionId: string) => {
    try {
      const { waitingQueue } = get();
      // Solo guardar participantes que no estén completados, descalificados o removidos de la cola
      const activeQueueIds = waitingQueue
        .filter(p => 
          p.status !== 'completed' && 
          p.status !== 'disqualified'
        )
        .map(p => p.id);
      
      tvLogger.session(`SAVE-QUEUE: Guardando ${activeQueueIds.length} participantes válidos en BD`);
      
      await fetch('/api/admin/sessions/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          waitingQueue: activeQueueIds
        }),
      });
    } catch (error) {
      tvProdLogger.error('Error al guardar cola en BD:', error);
    }
  },

  syncQueueWithDB: async (sessionId: string) => {
    await get().loadQueueFromDB(sessionId);
  },

  // Nueva función para limpiar participantes completados de la cola
  cleanupCompletedFromQueue: async () => {
    const { waitingQueue, gameSession } = get();
    
    tvLogger.session('QUEUE-CLEANUP: Iniciando limpieza automática');
    tvLogger.session('QUEUE-CLEANUP: Cola actual:', waitingQueue.map((p: Participant) => `${p.nombre}(${p.status || 'sin-status'})`));
    
    // Filtrar solo participantes activos (no completados, descalificados o removidos)
    const activeQueue = waitingQueue.filter(p => 
      p.status !== 'completed' && 
      p.status !== 'disqualified'
    );
    
    // Solo actualizar si hay cambios
    if (activeQueue.length !== waitingQueue.length) {
      tvLogger.session('QUEUE-CLEANUP: Removiendo participantes completados de la cola');
      tvLogger.session(`   - Cola antes: ${waitingQueue.length}, Cola después: ${activeQueue.length}`);
      // [PROD] Log de participantes removidos
      
      set({ waitingQueue: activeQueue });
      
      // Sync a BD si hay sesión activa
      if (gameSession) {
        await get().saveQueueToDB(gameSession.session_id);
      }
    } else {
      tvLogger.session('QUEUE-CLEANUP: No hay participantes completados para limpiar');
    }
  },
}));
