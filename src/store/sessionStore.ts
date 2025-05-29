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

export interface GameSession {
  id: string;
  status: 'waiting' | 'player_registration' | 'active' | 'completed' | 'paused';
  admin_id: string;
  participant_id?: string;
  participant_name?: string;
  participant_email?: string;
  participant_specialty?: string; // [modificación] Campo para especialidad médica
  created_at: string;
  updated_at: string;
  current_question?: string;
  score?: number;
  prize_won?: string;
}

// [modificación] Función para validar y convertir datos de Supabase a GameSession
function validateGameSession(data: unknown): GameSession {
  if (!data || typeof data !== 'object') {
    throw new Error('Datos de sesión inválidos');
  }
  
  const session = data as Record<string, unknown>;
  
  // Validar campos requeridos
  if (typeof session.id !== 'string' || 
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

    // [modificación] Gestión de sesiones usando el cliente centralizado
    createSession: async () => {
      const { user } = get();
      if (!user) throw new Error('Usuario no autenticado');

      set({ isLoading: true, error: null });
      
      try {
        const { data, error } = await supabaseClient
          .from('game_sessions')
          .insert({
            admin_id: user.id,
            status: 'waiting',
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
          .from('game_sessions')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId)
          .select()
          .single();

        if (error) throw error;

        // [modificación] Validar y convertir datos usando función helper
        const validatedSession = validateGameSession(data);

        const { currentSession } = get();
        if (currentSession?.id === sessionId) {
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
          .from('game_sessions')
          .delete()
          .eq('id', sessionId);

        if (error) throw error;

        const { currentSession, sessions } = get();
        
        set({
          currentSession: currentSession?.id === sessionId ? null : currentSession,
          sessions: sessions.filter(s => s.id !== sessionId),
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

    // [modificación] Realtime y sincronización
    initializeRealtime: () => {
      const channel = supabaseClient
        .channel('game_sessions')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_sessions',
          },
          (payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            const { sessions, currentSession } = get();

            switch (eventType) {
              case 'INSERT':
                set({
                  sessions: [...sessions, newRecord as GameSession],
                });
                break;
              
              case 'UPDATE':
                const updatedSessions = sessions.map(session =>
                  session.id === newRecord.id ? newRecord as GameSession : session
                );
                
                set({
                  sessions: updatedSessions,
                  currentSession: currentSession?.id === newRecord.id 
                    ? newRecord as GameSession 
                    : currentSession,
                });
                break;
              
              case 'DELETE':
                set({
                  sessions: sessions.filter(session => session.id !== oldRecord.id),
                  currentSession: currentSession?.id === oldRecord.id 
                    ? null 
                    : currentSession,
                });
                break;
            }
          }
        )
        .subscribe();

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