import { useState, useEffect, useCallback } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import type { AdminUser } from '@/types';

interface SecureAdminAuthState {
  isAuthenticated: boolean;
  admin: AdminUser | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

/**
 * [modificación] Hook personalizado para autenticación segura de admin
 * Trabaja con cookies HTTP Only y valida sesiones automáticamente
 */
export function useSecureAdminAuth() {
  const [authState, setAuthState] = useState<SecureAdminAuthState>({
    isAuthenticated: false,
    admin: null,
    isLoading: true,
    error: null,
    isInitialized: false,
  });

  const { loginWithAdmin, setUser, logout: sessionLogout } = useSessionStore();

  /**
   * [modificación] Verifica la sesión actual del admin usando el endpoint de perfil
   * Este endpoint valida automáticamente las cookies HTTP Only
   */
  const checkAuthStatus = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // [modificación] Llamar al endpoint que valida automáticamente las cookies
      const response = await fetch('/api/admin/profile', {
        method: 'GET',
        credentials: 'include', // [modificación] Incluir cookies automáticamente
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const { admin } = await response.json();
        
        // [modificación] Validar que los datos del admin sean completos
        if (admin && admin.id && admin.email && admin.name) {
          const adminData: AdminUser = {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: 'admin',
          };

          // [modificación] Actualizar estado local y sessionStore
          setAuthState({
            isAuthenticated: true,
            admin: adminData,
            isLoading: false,
            error: null,
            isInitialized: true,
          });

          // [modificación] Sincronizar con sessionStore
          loginWithAdmin(adminData);

          console.log('✅ Sesión de admin verificada correctamente');
        } else {
          throw new Error('Datos de admin incompletos');
        }
      } else {
        // [modificación] Sesión inválida o expirada
        setAuthState({
          isAuthenticated: false,
          admin: null,
          isLoading: false,
          error: response.status === 401 ? 'Sesión expirada' : 'Error de autenticación',
          isInitialized: true,
        });

        // [modificación] Limpiar sessionStore
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Error al verificar estado de autenticación:', error);
      
      setAuthState({
        isAuthenticated: false,
        admin: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error de conexión',
        isInitialized: true,
      });

      // [modificación] Limpiar sessionStore en caso de error
      setUser(null);
    }
  }, [loginWithAdmin, setUser]);

  /**
   * [modificación] Función de login que maneja la autenticación completa
   */
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include', // [modificación] Incluir cookies automáticamente
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const { admin } = await response.json();
        
        const adminData: AdminUser = {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: 'admin',
        };

        // [modificación] Actualizar estado y sessionStore
        setAuthState({
          isAuthenticated: true,
          admin: adminData,
          isLoading: false,
          error: null,
          isInitialized: true,
        });

        loginWithAdmin(adminData);
        
        console.log('✅ Login de admin exitoso');
        return true;
      } else {
        const { message } = await response.json();
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: message || 'Error al iniciar sesión',
        }));
        return false;
      }
    } catch (error) {
      console.error('❌ Error en login de admin:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error de conexión',
      }));
      return false;
    }
  }, [loginWithAdmin]);

  /**
   * [modificación] Función de logout que limpia todas las sesiones
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // [modificación] Llamar al endpoint de logout que limpia las cookies
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // [modificación] Limpiar estado local y sessionStore
      setAuthState({
        isAuthenticated: false,
        admin: null,
        isLoading: false,
        error: null,
        isInitialized: true,
      });

      await sessionLogout();
      
      console.log('✅ Logout de admin exitoso');
    } catch (error) {
      console.error('❌ Error en logout de admin:', error);
      
      // [modificación] Limpiar estado local aunque falle la llamada al servidor
      setAuthState({
        isAuthenticated: false,
        admin: null,
        isLoading: false,
        error: null,
        isInitialized: true,
      });

      await sessionLogout();
    }
  }, [sessionLogout]);

  /**
   * [modificación] Verificar estado de autenticación al montar el componente
   */
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  /**
   * [modificación] Verificar periódicamente si la sesión sigue válida (cada 5 minutos)
   */
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.isInitialized) return;

    const interval = setInterval(() => {
      checkAuthStatus();
    }, 5 * 60 * 1000); // [modificación] 5 minutos

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.isInitialized, checkAuthStatus]);

  return {
    ...authState,
    login,
    logout,
    checkAuthStatus,
  };
} 