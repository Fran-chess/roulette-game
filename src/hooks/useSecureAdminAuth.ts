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
 * Hook personalizado para autenticación segura de admin
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
   * Verifica la sesión actual del admin usando el endpoint de perfil
   * Este endpoint valida automáticamente las cookies HTTP Only
   */
  const checkAuthStatus = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/admin/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const { admin } = await response.json();
        
        if (admin && admin.id && admin.email && admin.name) {
          const adminData: AdminUser = {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: 'admin',
          };

          setAuthState({
            isAuthenticated: true,
            admin: adminData,
            isLoading: false,
            error: null,
            isInitialized: true,
          });

          loginWithAdmin(adminData);

          console.log('✅ Sesión de admin verificada correctamente');
        } else {
          throw new Error('Datos de admin incompletos');
        }
      } else {
        setAuthState({
          isAuthenticated: false,
          admin: null,
          isLoading: false,
          error: response.status === 401 ? 'Sesión expirada' : 'Error de autenticación',
          isInitialized: true,
        });

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

      setUser(null);
    }
  }, [loginWithAdmin, setUser]);

  /**
   * Función de login que maneja la autenticación completa
   */
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
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
   * Función de logout que limpia todas las sesiones
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });

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
   * Verificar estado de autenticación al montar el componente
   */
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  /**
   * Verificar periódicamente si la sesión sigue válida (cada 5 minutos)
   */
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.isInitialized) return;

    const interval = setInterval(() => {
      checkAuthStatus();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.isInitialized, checkAuthStatus]);

  return {
    ...authState,
    login,
    logout,
    checkAuthStatus,
  };
} 