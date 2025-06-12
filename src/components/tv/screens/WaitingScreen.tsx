import { useEffect, useState } from 'react';
import { useIsMounted } from '@/hooks/useIsMounted';
import { MotionDiv } from '../shared/MotionComponents';

/**
 * [modificación] Componente de video en pantalla completa
 * Reproduce el video DarSaludPanallaLed.mp4 ocupando toda la pantalla sin deformar la relación de aspecto
 */
function FullScreenVideo() {
  const isMounted = useIsMounted();
  
  if (!isMounted) return null;

  return (
    <section className="absolute inset-0 z-20" aria-label="Video publicitario en pantalla completa">
      <MotionDiv
        initial={{ 
          opacity: 0, 
          scale: 1.02,
          filter: "blur(5px)"
        }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          filter: "blur(0px)"
        }}
        transition={{ 
          duration: 1.5,
          ease: "easeOut" as const // [modificación] Easing profesional y suave
        }}
        className="relative w-full h-full"
      >
        {/* [modificación] Video en pantalla completa con object-cover para mantener proporción */}
        <video
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-label="Video publicitario de DarSalud para pantalla LED"
        >
          <source src="/video/DarSaludPanallaLed.mp4" type="video/mp4" />
          <p className="text-white text-center flex items-center justify-center h-full">
            Tu navegador no soporta la reproducción de video. Por favor actualiza tu navegador.
          </p>
        </video>

        {/* [modificación] Overlay sutil opcional para mejorar contraste si es necesario */}
        <div className="absolute inset-0 bg-gradient-to-br from-azul-intenso/5 via-transparent via-60% to-verde-salud/5 pointer-events-none" />
      </MotionDiv>
    </section>
  );
}

/**
 * [modificación] Pantalla de espera con video en pantalla completa
 * Se muestra cuando no hay sesiones activas
 * Optimizada universalmente para tablets en orientación vertical
 */
export default function WaitingScreen() {
  const isMounted = useIsMounted();
  
  // [NUEVO] Estados para detección de dispositivo universal
  const [isTabletPortrait, setIsTabletPortrait] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ width: 0, height: 0 });

  // [NUEVO] useEffect para detección universal de tablets en orientación vertical
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // [NUEVO] Detectar tablets en orientación vertical universal
      const isTabletPortraitResolution = 
        width >= 768 && width <= 1200 && 
        height > width && // Orientación vertical
        height >= 1000 && // Altura mínima para tablets
        !((width >= 2160 && height >= 3840) || (width >= 3840 && height >= 2160)); // Excluir TV65

      setIsTabletPortrait(isTabletPortraitResolution);
      setDebugInfo({ width, height });

      // [NUEVO] Log para tablets verticales
      if (isTabletPortraitResolution) {
        console.log('📱 WaitingScreen: Tablet en orientación vertical detectada, aplicando optimizaciones universales');
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // [modificación] Log para debugging cuando se muestra la pantalla de espera con video
  useEffect(() => {
    if (isMounted) {
      console.log('📺 WaitingScreen: Pantalla de espera montada - video en pantalla completa optimizado universalmente');
      console.log('📺 WaitingScreen: Reproduciendo DarSaludPanallaLed.mp4 en loop automático');
      if (isTabletPortrait) {
        console.log('📱 WaitingScreen: Optimizaciones para tablet vertical aplicadas');
      }
    }
  }, [isMounted, isTabletPortrait]);

  if (!isMounted) {
    return null; // [modificación] Retornar null durante la hidratación
  }

  return (
    <MotionDiv
      key="waiting-video"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`relative min-h-screen w-full bg-black overflow-hidden tv-portrait:min-h-screen ${
        isTabletPortrait ? 'waiting-screen-tablet-portrait' : ''
      }`}
      role="main"
      aria-label="Pantalla de espera con video en pantalla completa optimizada universalmente para tablets verticales"
    >
      {/* [modificación] Video en pantalla completa que reemplaza el carrusel de imágenes */}
      <FullScreenVideo />

      {/* [NUEVO] DEBUG INFO VISUAL - SOLO EN DESARROLLO */}
      {process.env.NODE_ENV === 'development' && debugInfo.width > 0 && (
        <div className="absolute top-4 left-4 bg-black/80 text-white p-4 text-lg font-bold z-50 rounded-br-lg">
          <div>
            Resolución: {debugInfo.width}x{debugInfo.height}
          </div>
          <div>Tablet Vertical: {isTabletPortrait ? "SÍ" : "NO"}</div>
        </div>
      )}

      {/* [modificación] Información de debug solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 bg-black/70 text-white text-xs p-2 rounded tv-portrait:text-lg tv-portrait:p-4 z-30">
          {isTabletPortrait ? 'Tablet Portrait Mode' : 'Standard Mode'}: Video Full Screen - DarSaludPanallaLed.mp4
        </div>
      )}
    </MotionDiv>
  );
} 
