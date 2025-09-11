'use client';

import { useEffect, useState } from 'react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

/**
 * Componente raíz del shell persistente simplificado.
 * Se encarga de:
 * 1. Gestionar transiciones suaves entre páginas
 * 2. Manejar correctamente el montaje en cliente
 * 3. Capturar errores globalmente
 */
export default function ShellRootClient({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isChangingRoute, setIsChangingRoute] = useState(false);

  // Control de montaje en cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Actualizar contenido con transición suave
  useEffect(() => {
    if (!isMounted) return;
    
    setIsChangingRoute(true);
    
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsChangingRoute(false);
    }, 50);
    
    return () => clearTimeout(timer);
  }, [children, isMounted]);

  // Durante SSR o antes del montaje en cliente
  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <ErrorBoundary>
      {/* Contenido dinámico de la página actual con transición suave */}
      <div 
        className="w-full h-screen relative z-10" 
        style={{ 
          opacity: isChangingRoute ? 0.7 : 1,
          transition: 'opacity 150ms ease-in-out'
        }}
      >
        {displayChildren}
      </div>
    </ErrorBoundary>
  );
}