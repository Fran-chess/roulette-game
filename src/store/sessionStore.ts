import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { type RealtimeChannel } from '@supabase/supabase-js';
import { supabaseClient } from '@/lib/supabase';
import { validateUUID } from '@/lib/supabaseHelpers';

// [modificación] Tipos para la gestión de sesiones y roles
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'viewer';
  name?: string;
}

// [modificación] Actualizar GameSession para usar los estados correctos del backend
export interface GameSession {
  id: string;
  session_id: string;
  status: 'pending_player_registration' | 'player_registered' | 'playing' | 'completed' | 'archived';
  admin_id: string;
  participant_id?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  especialidad?: string; // [modificación] Campo para especialidad médica
  created_at: string;
  updated_at: string;
  admin_updated_at?: string;
  lastquestionid?: string;
  answeredcorrectly?: boolean;
  score?: number;
  premio_ganado?: string;
  detalles_juego?: Record<string, unknown>;
}

// [modificación] Función para validar y convertir datos de Supabase a GameSession
export function validateGameSession(data: unknown): GameSession {
  if (!data || typeof data !== 'object') {
    throw new Error('Datos de sesión inválidos');
  }
  
  const session = data as Record<string, unknown>;
  
  // Validar campos requeridos
  if (typeof session.id !== 'string' || 
      typeof session.session_id !== 'string' ||
      typeof session.status !== 'string' || 
      typeof session.admin_id !== 'string' ||
      typeof session.created_at !== 'string' ||
      typeof session.updated_at !== 'string') {
    throw new Error('Campos requeridos de sesión faltantes o inválidos');
  }

  // [modificación] Validar que session_id y admin_id sean UUIDs válidos
  try {
    validateUUID(session.session_id);
    validateUUID(session.admin_id);
  } catch (error) {
    throw new Error(`UUIDs inválidos en sesión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
  
  return session as unknown as GameSession;
}

export interface SessionState {
  // Estado de usuario
  user: User | null;
  isAuthenticated: boolean;
  
  // Estado de sesiones
  currentSession: GameSession | null;
  sessions: GameSession[];
  
  // UI State - [modificación] Restaurar 'tv' para compatibilidad con ShellRootClient
  currentView: 'login' | 'admin' | 'tv' | 'game';
  isLoading: boolean;
  error: string | null;
  
  // Realtime
  realtimeChannel: RealtimeChannel | null;
  
  // Acciones
  setUser: (user: User | null) => void;
  setCurrentSession: (session: GameSession | null) => void;
  setSessions: (sessions: GameSession[]) => void;
  setCurrentView: (view: 'login' | 'admin' | 'tv' | 'game') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // [modificación] Gestión de sesiones usando estructura sessions + plays
  createSession: () => Promise<void>;
  updateSession: (sessionId: string, updates: Partial<GameSession>) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  
  // Autenticación
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Realtime
  initializeRealtime: () => void;
  subscribeToSessions: () => void;
  cleanup: () => void;
  
  // Admin helpers
  loginWithAdmin: (adminData: User) => void;
}

// [modificación] Store principal con sincronización en tiempo real
export const useSessionStore = create<SessionState>()(
  subscribeWithSelector((set, get) => ({
    // Estado inicial
    user: null,
    isAuthenticated: false,
    currentSession: null,
    sessions: [],
    currentView: 'login',
    isLoading: false,
    error: null,
    realtimeChannel: null,

    // Setters básicos
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    setCurrentSession: (currentSession) => set({ currentSession }),
    setSessions: (sessions) => set({ sessions }),
    setCurrentView: (currentView) => set({ currentView }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    // [modificación] Crear sesión usando nueva API con estructura sessions + plays y validación UUID
    createSession: async () => {
      const { user } = get();
      if (!user) throw new Error('Usuario no autenticado');

      // [modificación] Validar que el user.id sea un UUID válido antes de proceder
      try {
        validateUUID(user.id);
      } catch (error) {
        throw new Error(`ID de usuario inválido: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }

      set({ isLoading: true, error: null });
      
      try {
        console.log('🎮 STORE: Creando nueva sesión...');
        
        // [modificación] Usar endpoint actualizado que maneja sessions + plays con validación UUID
        const response = await fetch('/api/admin/sessions/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al crear sesión');
        }

        const result = await response.json();
        
        console.log('✅ STORE: Sesión creada exitosamente:', result);

        // [modificación] Validar y convertir datos usando función helper con validación UUID
        if (result.session) {
          const validatedSession = validateGameSession(result.session);
          set({ 
            currentSession: validatedSession,
            isLoading: false 
          });
          
          console.log('🔗 STORE: Sesión configurada en store:', validatedSession.session_id);
        } else {
          console.warn('⚠️ STORE: Sesión creada pero sin datos de respuesta');
          set({ isLoading: false });
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('❌ STORE: Error al crear sesión:', errorMessage);
        set({ 
          error: errorMessage,
          isLoading: false 
        });
      }
    },

    updateSession: async (sessionId, updates) => {
      // [modificación] Validar que sessionId sea un UUID válido
      try {
        validateUUID(sessionId);
      } catch (error) {
        throw new Error(`sessionId inválido: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }

      set({ isLoading: true, error: null });
      
      try {
        const { data, error } = await supabaseClient
          .from('plays')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('session_id', sessionId)
          .select()
          .single();

        if (error) throw error;

        // [modificación] Validar y convertir datos usando función helper con validación UUID
        const validatedSession = validateGameSession(data);

        const { currentSession } = get();
        if (currentSession?.session_id === sessionId) {
          set({ currentSession: validatedSession });
        }

        set({ isLoading: false });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        set({ 
          error: errorMessage,
          isLoading: false 
        });
      }
    },

    deleteSession: async (sessionId) => {
      // [modificación] Validar que sessionId sea un UUID válido
      try {
        validateUUID(sessionId);
      } catch (error) {
        throw new Error(`sessionId inválido: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }

      set({ isLoading: true, error: null });
      
      try {
        const { error } = await supabaseClient
          .from('plays')
          .delete()
          .eq('session_id', sessionId);

        if (error) throw error;

        const { currentSession, sessions } = get();
        
        set({
          currentSession: currentSession?.session_id === sessionId ? null : currentSession,
          sessions: sessions.filter(s => s.session_id !== sessionId),
          isLoading: false
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        set({ 
          error: errorMessage,
          isLoading: false 
        });
      }
    },

    // [modificación] Autenticación usando endpoint personalizado para admins
    login: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        console.log('🔐 STORE: Iniciando login...');
        
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        
        const { admin, message } = await res.json();
        if (!res.ok) throw new Error(message);

        // [modificación] Validar que el admin.id sea un UUID válido
        try {
          validateUUID(admin.id);
        } catch (error) {
          throw new Error(`ID de admin inválido recibido: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }

        console.log('✅ STORE: Login exitoso para:', admin.email);

        // guardo el admin en el store
        set({
          user: { id: admin.id, email: admin.email, name: admin.name, role: 'admin' },
          isAuthenticated: true,
          currentView: 'admin',
          isLoading: false,
        });

        // y arranco realtime
        get().initializeRealtime();
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
        console.error('❌ STORE: Error en login:', errorMessage);
        set({
          error: errorMessage,
          isLoading: false,
        });
      }
    },

    logout: async () => {
      set({ isLoading: true });
      
      try {
        await supabaseClient.auth.signOut();
        get().cleanup();
        
        set({
          user: null,
          isAuthenticated: false,
          currentSession: null,
          sessions: [],
          currentView: 'login',
          isLoading: false,
          error: null,
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        set({ 
          error: errorMessage,
          isLoading: false 
        });
      }
    },

    // [modificación] Realtime y sincronización usando tabla 'plays' con validación UUID
    initializeRealtime: () => {
      const { realtimeChannel } = get();
      
      // [modificación] Verificar si ya existe un canal activo
      if (realtimeChannel) {
        console.log('🔄 STORE: Canal de realtime ya existe, reutilizando conexión existente');
        return;
      }

      console.log('🚀 STORE: Inicializando nueva suscripción de realtime para tabla plays');
      
      const channel = supabaseClient
        .channel('plays_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'plays',
          },
          (payload) => {
            console.log('📡 STORE: Evento realtime recibido:', payload.eventType, payload);
            const { eventType, new: newRecord, old: oldRecord } = payload;
            const { sessions, currentSession } = get();

            try {
              switch (eventType) {
                case 'INSERT':
                  console.log('➕ STORE: Nueva sesión insertada:', newRecord);
                  // [modificación] Validar sesión antes de agregarla
                  const validatedNewSession = validateGameSession(newRecord);
                  set({
                    sessions: [...sessions, validatedNewSession],
                  });
                  break;
                
                case 'UPDATE':
                  console.log('🔄 STORE: Sesión actualizada:', newRecord);
                  // [modificación] Validar sesión antes de actualizarla
                  const validatedUpdatedSession = validateGameSession(newRecord);
                  const updatedSessions = sessions.map(session =>
                    session.session_id === validatedUpdatedSession.session_id ? validatedUpdatedSession : session
                  );
                  
                  set({
                    sessions: updatedSessions,
                    currentSession: currentSession?.session_id === validatedUpdatedSession.session_id 
                      ? validatedUpdatedSession 
                      : currentSession,
                  });
                  break;
                
                case 'DELETE':
                  console.log('🗑️ STORE: Sesión eliminada:', oldRecord);
                  // [modificación] No necesita validación para DELETE, solo usar el session_id
                  const deletedSessionId = oldRecord?.session_id;
                  if (deletedSessionId) {
                    set({
                      sessions: sessions.filter(session => session.session_id !== deletedSessionId),
                      currentSession: currentSession?.session_id === deletedSessionId 
                        ? null 
                        : currentSession,
                    });
                  }
                  break;
              }
            } catch (validationError) {
              console.error('❌ STORE: Error al validar datos de realtime:', validationError);
              // No actualizar el store si hay errores de validación
            }
          }
        )
        .subscribe((status) => {
          console.log('📊 STORE: Estado de suscripción realtime:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ STORE: Suscripción realtime activa para tabla plays');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ STORE: Error en canal realtime');
          }
        });

      set({ realtimeChannel: channel });
    },

    subscribeToSessions: () => {
      // Ya implementado en initializeRealtime
    },

    cleanup: () => {
      const { realtimeChannel } = get();
      if (realtimeChannel) {
        console.log('🧹 STORE: Limpiando canal realtime');
        realtimeChannel.unsubscribe();
        set({ realtimeChannel: null });
      }
    },

    // [modificación] Función para login de admin con endpoint custom y validación UUID
    loginWithAdmin: (adminData: User) => {
      // [modificación] Validar que el adminData.id sea un UUID válido
      try {
        validateUUID(adminData.id);
      } catch (error) {
        console.error('❌ STORE: ID de admin inválido en loginWithAdmin:', error);
        set({ 
          error: `ID de admin inválido: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          isLoading: false 
        });
        return;
      }

      set({
        user: adminData,
        isAuthenticated: true,
        currentView: 'admin',
        isLoading: false,
        error: null,
      });
    },
  }))
); 
