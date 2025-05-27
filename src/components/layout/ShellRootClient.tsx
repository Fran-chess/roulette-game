'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useNavigationStore } from '@/store/navigationStore';
import { useSessionStore } from '@/store/sessionStore';

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
    <>
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
    </>
  );
}
