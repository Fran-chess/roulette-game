'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useNavigationStore } from '@/store/navigationStore';
import { useSessionStore } from '@/store/sessionStore';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

// Cargamos los componentes persistentes de manera dinámica
const NavigationOverlay = dynamic(() => import('./NavigationOverlay'), {
  ssr: false,
});

/**
 * Componente raíz del shell persistente.
 * Se encarga de:
 * 1. Mantener elementos que NUNCA se desmontan durante la navegación (NavigationOverlay)
 * 2. Gestionar transiciones suaves entre páginas con efecto fade
 * 3. Manejar correctamente el montaje en cliente (client-side hydration)
 * 4. Capturar errores de DOM y Framer Motion globalmente
 */
export default function ShellRootClient({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isChangingRoute, setIsChangingRoute] = useState(false);
  
  // [modificación] Acceso al store de navegación para mejor coordinación
  const { isNavigating, stopNavigation } = useNavigationStore();
  
  // [modificación] Estado de sesión y autenticación
  const { 
    isAuthenticated, 
    user, 
    setCurrentView, 
    cleanup 
  } = useSessionStore();

  // [modificación] Handler para errores capturados por el Error Boundary
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('ShellRootClient: Error global capturado:', {
      error: error.message,
      path: pathname,
      user: user?.role,
      timestamp: new Date().toISOString(),
      componentStack: errorInfo.componentStack
    });

    // [modificación] Si el error es en la TV, intentar reinicializar
    if (pathname === '/tv' && user?.role === 'viewer') {
      console.log('ShellRootClient: Error en TV detectado, intentando recuperación...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  // Control de montaje en cliente
  useEffect(() => {
    setIsMounted(true);
    
    // [modificación] Reset del estado de navegación al montar si está bloqueado
    const checkStuckNavigation = setTimeout(() => {
      if (isNavigating) {
        console.warn('Estado de navegación bloqueado detectado al montar, reseteando...');
        stopNavigation();
      }
    }, 1000);
    
    return () => clearTimeout(checkStuckNavigation);
  }, [isNavigating, stopNavigation]);

  // [modificación] Control de rutas y autenticación
  useEffect(() => {
    if (!isMounted || !isAuthenticated) return;

    // Lógica de redirección basada en el rol del usuario
    if (user?.role === 'admin' && pathname === '/') {
      router.push('/admin');
      setCurrentView('admin');
    } else if (user?.role === 'viewer' && pathname === '/') {
      router.push('/tv');
      setCurrentView('tv');
    } else if (pathname === '/admin' && user?.role !== 'admin') {
      router.push('/tv');
      setCurrentView('tv');
    } else if (pathname === '/tv' && user?.role !== 'viewer') {
      router.push('/admin');
      setCurrentView('admin');
    }
  }, [isAuthenticated, user, pathname, router, setCurrentView, isMounted]);

  // [modificación] Limpieza de recursos al desmontar
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // [modificación] Actualizar contenido con transición suave cuando cambia la ruta
  useEffect(() => {
    if (!isMounted) return; // [modificación] Solo ejecutar si está montado
    
    setIsChangingRoute(true);
    
    // [modificación] Timeout más corto para transiciones más suaves
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsChangingRoute(false);
    }, 50); // [modificación] Reducido de 100ms a 50ms
    
    return () => clearTimeout(timer);
  }, [pathname, children, isMounted]);

  // Durante SSR o antes del montaje en cliente
  if (!isMounted) {
    return <>{children}</>; // SSR fallback
  }

  return (
    <ErrorBoundary 
      onError={handleError}
      fallback={
        // [modificación] Fallback específico para TV
        pathname === '/tv' ? (
          <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-6">📺</div>
              <h1 className="text-4xl font-bold text-white mb-4">Reiniciando TV...</h1>
              <p className="text-white/80">La pantalla se recuperará automáticamente</p>
            </div>
          </div>
        ) : undefined
      }
    >
      {/* [modificación] Overlay de navegación solo para admin */}
      {user?.role === 'admin' && <NavigationOverlay />}
      
      {/* Contenido dinámico de la página actual con transición suave */}
      <div 
        className="flex-grow w-full h-full relative z-10" 
        style={{ 
          opacity: isChangingRoute ? 0.7 : 1, // [modificación] Cambio más sutil de opacidad
          transition: 'opacity 150ms ease-in-out' // [modificación] Transición más rápida
        }}
      >
        {displayChildren}
      </div>
    </ErrorBoundary>
  );
}
