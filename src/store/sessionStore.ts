import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { type RealtimeChannel } from '@supabase/supabase-js';
import { supabaseClient } from '@/lib/supabase';

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
  
  return session as unknown as GameSession;
}

export interface SessionState {
  // Estado de usuario y autenticación
  user: User | null;
  isAuthenticated: boolean;
  
  // Estado de sesión de juego
  currentSession: GameSession | null;
  sessions: GameSession[];
  
  // Estado de UI
  currentView: 'login' | 'admin' | 'tv' | 'game';
  isLoading: boolean;
  error: string | null;
  
  // Canal de sincronización en tiempo real
  realtimeChannel: RealtimeChannel | null;
  
  // Acciones
  setUser: (user: User | null) => void;
  setCurrentSession: (session: GameSession | null) => void;
  setSessions: (sessions: GameSession[]) => void;
  setCurrentView: (view: 'login' | 'admin' | 'tv' | 'game') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Acciones de sesión
  createSession: () => Promise<void>;
  updateSession: (sessionId: string, updates: Partial<GameSession>) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  
  // Autenticación
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // [modificación] Función para login de admin con endpoint custom
  loginWithAdmin: (adminData: User) => void;
  
  // Realtime
  initializeRealtime: () => void;
  subscribeToSessions: () => void;
  cleanup: () => void;
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

    // [modificación] Gestión de sesiones usando la tabla 'plays' en lugar de 'game_sessions'
    createSession: async () => {
      const { user } = get();
      if (!user) throw new Error('Usuario no autenticado');

      set({ isLoading: true, error: null });
      
      try {
        // [modificación] Generar un session_id único
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        const { data, error } = await supabaseClient
          .from('plays')
          .insert({
            session_id: sessionId,
            admin_id: user.id,
            status: 'pending_player_registration',
            nombre: 'Pendiente',
            email: 'pendiente@registro.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            admin_updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        // [modificación] Validar y convertir datos usando función helper
        const validatedSession = validateGameSession(data);

        set({ 
          currentSession: validatedSession,
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

    updateSession: async (sessionId, updates) => {
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

        // [modificación] Validar y convertir datos usando función helper
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
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const { admin, message } = await res.json();
        if (!res.ok) throw new Error(message);

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

    // [modificación] Realtime y sincronización usando tabla 'plays'
    initializeRealtime: () => {
      const { realtimeChannel } = get();
      
      // [modificación] Verificar si ya existe un canal activo
      if (realtimeChannel) {
// //         console.log('Canal de realtime ya existe, reutilizando conexión existente');
        return;
      }

// //       console.log('Inicializando nueva suscripción de realtime para tabla plays');
      
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
// //             console.log('Evento realtime recibido:', payload.eventType, payload);
            const { eventType, new: newRecord, old: oldRecord } = payload;
            const { sessions, currentSession } = get();

            switch (eventType) {
              case 'INSERT':
// //                 console.log('Nueva sesión insertada:', newRecord);
                set({
                  sessions: [...sessions, newRecord as GameSession],
                });
                break;
              
              case 'UPDATE':
// //                 console.log('Sesión actualizada:', newRecord);
                const updatedSessions = sessions.map(session =>
                  session.session_id === newRecord.session_id ? newRecord as GameSession : session
                );
                
                set({
                  sessions: updatedSessions,
                  currentSession: currentSession?.session_id === newRecord.session_id 
                    ? newRecord as GameSession 
                    : currentSession,
                });
                break;
              
              case 'DELETE':
// //                 console.log('Sesión eliminada:', oldRecord);
                set({
                  sessions: sessions.filter(session => session.session_id !== oldRecord.session_id),
                  currentSession: currentSession?.session_id === oldRecord.session_id 
                    ? null 
                    : currentSession,
                });
                break;
            }
          }
        )
        .subscribe((status) => {
// //           console.log('Estado de suscripción realtime:', status);
          if (status === 'SUBSCRIBED') {
// //             console.log('✅ Suscripción realtime activa para tabla plays');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Error en canal realtime');
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
        realtimeChannel.unsubscribe();
        set({ realtimeChannel: null });
      }
    },

    // [modificación] Función para login de admin con endpoint custom
    loginWithAdmin: (adminData: User) => {
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
