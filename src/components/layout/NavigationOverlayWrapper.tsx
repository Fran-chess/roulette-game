'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Cargar el NavigationOverlay dinámicamente para evitar errores de SSR
const NavigationOverlay = dynamic(() => import('./NavigationOverlay'), {
  ssr: false,
});

/**
 * Wrapper para el NavigationOverlay que asegura que solo se cargue en el cliente.
 * Esto es necesario porque el overlay interactúa con el router de Next.js y usa
 * estados globales (Zustand) que no deben ejecutarse durante SSR.
 * 
 * Al estar en el layout raíz, este componente permanece montado durante toda la
 * navegación de la aplicación, evitando el "flicker" durante cambios de página.
 */
const NavigationOverlayWrapper = () => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return null;
  }
  
  return <NavigationOverlay />;
};

export default NavigationOverlayWrapper; 