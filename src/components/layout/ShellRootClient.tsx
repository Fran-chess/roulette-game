'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

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
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isChangingRoute, setIsChangingRoute] = useState(false);

  // Control de montaje en cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Actualizar contenido con transición suave cuando cambia la ruta
  useEffect(() => {
    // [modificación] Mejorado el manejo de transiciones entre rutas
    setIsChangingRoute(true);
    
    // Pequeño retraso para asegurar transición visual suave
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsChangingRoute(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [pathname, children]);

  // Durante SSR o antes del montaje en cliente
  if (!isMounted) {
    return <>{children}</>; // SSR fallback
  }

  return (
    <>
      {/* Overlay de navegación - persiste entre navegaciones */}
      <NavigationOverlay />
      
      {/* Contenido dinámico de la página actual con transición suave */}
      <div 
        className="flex-grow w-full h-full relative z-10" 
        style={{ 
          opacity: isChangingRoute ? 0 : 1,
          transition: 'opacity 200ms ease-in-out'
        }}
      >
        {displayChildren}
      </div>
    </>
  );
}
