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
  currentPlay: null,
  questions: [], // [modificación] Lista de preguntas para la ruleta
  gameSession: null, // [modificación] Guarda la PlaySession activa para el juego actual
  
  // NUEVA: Cola de participantes
  waitingQueue: [],

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
    gameState: 'waiting' as GameState,
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
    console.log('🔄 QUEUE: Agregando participante a cola:', participant.nombre);
    console.log('🔄 QUEUE: Cola actual antes:', get().waitingQueue.length);
    console.log('🔄 QUEUE: Participante activo antes:', get().currentParticipant?.nombre || 'No');
    console.log('🔄 QUEUE: GameState antes:', get().gameState);
    
    const currentParticipant = get().currentParticipant;
    
    if (!currentParticipant) {
      // Si no hay participante activo, activar directamente
      console.log('🔄 QUEUE: No hay participante activo, activando directamente');
      set({ currentParticipant: participant, gameState: 'inGame' });
      
      // Actualizar estado del participante a playing
      try {
        await fetch('/api/admin/sessions/update-participant-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: participant.id,
            status: 'playing'
          }),
        });
      } catch (error) {
        console.error('Error al activar participante:', error);
      }
    } else {
      // Si hay participante activo, agregar a la cola
      console.log('🔄 QUEUE: Hay participante activo, agregando a cola');
      set((state) => {
        const newQueue = [...state.waitingQueue, participant];
        return { waitingQueue: newQueue };
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
    
    console.log('✅ QUEUE: Participante procesado - Cola final:', get().waitingQueue.length);
    console.log('✅ QUEUE: Participante activo final:', get().currentParticipant ? 'Sí' : 'No');
  },

  removeFromQueue: async (participantId: string) => {
    set((state) => {
      const newQueue = state.waitingQueue.filter(p => p.id !== participantId);
      return { waitingQueue: newQueue };
    });
    
    // Sync a BD
    const currentSession = get().gameSession;
    if (currentSession) {
      await get().saveQueueToDB(currentSession.session_id);
    }
  },

  moveToNext: async () => {
    const { waitingQueue, currentParticipant } = get();
    
    console.log('🔄 MOVE-TO-NEXT: Iniciando transición de participante');
    console.log('🔄 MOVE-TO-NEXT: Participante actual:', currentParticipant?.nombre || 'null');
    console.log('🔄 MOVE-TO-NEXT: Cola actual:', waitingQueue.length, 'participantes');
    if (waitingQueue.length > 0) {
      console.log('🔄 MOVE-TO-NEXT: Participantes en cola:', waitingQueue.map(p => p.nombre));
    }
    
    // 1. Mover participante actual a completed si existe
    if (currentParticipant) {
      console.log('🔄 MOVE-TO-NEXT: Marcando participante actual como completed:', currentParticipant.nombre);
      
      try {
        await fetch('/api/admin/sessions/update-participant-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: currentParticipant.id,
            status: 'completed'
          }),
        });
        console.log('✅ MOVE-TO-NEXT: Participante marcado como completed exitosamente');
      } catch (error) {
        console.error('❌ MOVE-TO-NEXT: Error al actualizar estado de participante:', error);
        tvProdLogger.error('Error al actualizar estado de participante:', error);
      }
    }
    
    // 2. Tomar siguiente de la cola
    if (waitingQueue.length > 0) {
      const nextParticipant = waitingQueue[0];
      console.log('🔄 MOVE-TO-NEXT: Activando siguiente participante:', nextParticipant.nombre);
      
      // Crear una copia del participante con status actualizado
      const updatedNextParticipant = {
        ...nextParticipant,
        status: 'playing' as const
      };
      
      // Remover de la cola y activar participante
      set((state) => ({
        waitingQueue: state.waitingQueue.slice(1),
        currentParticipant: updatedNextParticipant,
        gameState: 'inGame' as GameState
      }));
      
      console.log('✅ MOVE-TO-NEXT: Estado actualizado - nuevo participante activo');
      
      // Actualizar estado del participante a playing en la base de datos
      try {
        await fetch('/api/admin/sessions/update-participant-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: nextParticipant.id,
            status: 'playing'
          }),
        });
        console.log('✅ MOVE-TO-NEXT: Nuevo participante marcado como playing exitosamente');
      } catch (error) {
        console.error('❌ MOVE-TO-NEXT: Error al activar participante:', error);
        tvProdLogger.error('Error al activar participante:', error);
      }
    } else {
      // Cola vacía, volver a waiting
      console.log('🔄 MOVE-TO-NEXT: Cola vacía, estableciendo currentParticipant a null');
      set({
        currentParticipant: null,
        gameState: 'screensaver' as GameState
      });
      console.log('✅ MOVE-TO-NEXT: Estado actualizado - sin participante activo');
    }
    
    // Verificar estado final
    const finalState = get();
    console.log('🔄 MOVE-TO-NEXT: Estado final:');
    console.log('   - Participante activo:', finalState.currentParticipant?.nombre || 'null');
    console.log('   - Cola restante:', finalState.waitingQueue.length, 'participantes');
    console.log('   - GameState:', finalState.gameState);
    
    // Sync a BD
    const currentSession = get().gameSession;
    if (currentSession) {
      await get().saveQueueToDB(currentSession.session_id);
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
    console.log('📥 LOAD-QUEUE: Iniciando carga desde BD para sesión:', sessionId);
    try {
      const response = await fetch(`/api/admin/sessions/queue?sessionId=${sessionId}`);
      if (!response.ok) {
        throw new Error('Error al cargar cola desde BD');
      }
      
      const data = await response.json();
      const queueIds = data.waitingQueue || [];
      console.log('📥 LOAD-QUEUE: IDs de cola desde BD:', queueIds);
      
      // También cargar el participante activo de la sesión
      try {
        const participantResponse = await fetch(`/api/admin/sessions/participants?sessionId=${sessionId}`);
        const participantData = await participantResponse.json();
        
        if (participantResponse.ok && participantData.participants) {
          const activeParticipant = participantData.participants.find((p: Participant) => p.status === 'playing');
          if (activeParticipant) {
            console.log('📥 LOAD-QUEUE: Participante activo encontrado:', activeParticipant.nombre);
            set({ currentParticipant: activeParticipant });
          } else {
            console.log('📥 LOAD-QUEUE: No hay participante con status playing');
          }
        }
      } catch (error) {
        console.error('📥 LOAD-QUEUE: Error cargando participante activo:', error);
      }
      
      // Reconstruir cola desde IDs
      if (queueIds.length > 0) {
        console.log('📥 LOAD-QUEUE: Reconstruyendo cola desde IDs...');
        const participantsResponse = await fetch('/api/participants?detail=true');
        const participantsData = await participantsResponse.json();
        const allParticipants = participantsData.participants || [];
        
        // Reconstruir cola en orden y eliminar duplicados, filtrando participantes completados
        const reconstructedQueue = queueIds
          .map((id: string) => allParticipants.find((p: Participant) => p.id === id))
          .filter((p: Participant | undefined) => p !== undefined && p.status !== 'completed' && p.status !== 'disqualified');
        
        console.log('📥 LOAD-QUEUE: Cola reconstruida (antes de duplicados):', reconstructedQueue.map((p: Participant) => `${p.nombre}(${p.status})`));
        
        // Eliminar duplicados basándose en el ID
        const uniqueQueue = reconstructedQueue.filter((participant: Participant, index: number, self: Participant[]) => 
          index === self.findIndex((p: Participant) => p.id === participant.id)
        );
        
        console.log('📥 LOAD-QUEUE: Cola final (después de limpiar duplicados):', uniqueQueue.map((p: Participant) => `${p.nombre}(${p.status})`));
        set({ waitingQueue: uniqueQueue });
      } else {
        console.log('📥 LOAD-QUEUE: No hay IDs en cola, estableciendo cola vacía');
        set({ waitingQueue: [] });
      }
    } catch (error) {
      console.error('📥 LOAD-QUEUE: Error al cargar cola desde BD:', error);
      tvProdLogger.error('Error al cargar cola desde BD:', error);
    }
  },

  saveQueueToDB: async (sessionId: string) => {
    try {
      const { waitingQueue } = get();
      // Solo guardar participantes que no estén completados o descalificados
      const activeQueueIds = waitingQueue
        .filter(p => p.status !== 'completed' && p.status !== 'disqualified')
        .map(p => p.id);
      
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
    
    console.log('🧹 QUEUE-CLEANUP: Iniciando limpieza automática');
    console.log('🧹 QUEUE-CLEANUP: Cola actual:', waitingQueue.map((p: Participant) => `${p.nombre}(${p.status || 'sin-status'})`));
    
    // Filtrar solo participantes activos (no completados ni descalificados)
    const activeQueue = waitingQueue.filter(p => 
      p.status !== 'completed' && p.status !== 'disqualified'
    );
    
    // Solo actualizar si hay cambios
    if (activeQueue.length !== waitingQueue.length) {
      console.log('🧹 QUEUE-CLEANUP: Removiendo participantes completados de la cola');
      console.log(`   - Cola antes: ${waitingQueue.length}, Cola después: ${activeQueue.length}`);
      console.log('   - Participantes removidos:', waitingQueue.filter((p: Participant) => p.status === 'completed' || p.status === 'disqualified').map((p: Participant) => p.nombre));
      
      set({ waitingQueue: activeQueue });
      
      // Sync a BD si hay sesión activa
      if (gameSession) {
        await get().saveQueueToDB(gameSession.session_id);
      }
    } else {
      console.log('🧹 QUEUE-CLEANUP: No hay participantes completados para limpiar');
    }
  },
}));
