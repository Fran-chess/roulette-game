import { useEffect, useState } from 'react';
import { useIsMounted } from '@/hooks/useIsMounted';
import { MotionDiv } from '../shared/MotionComponents';
import { useGameStore } from '@/store/gameStore';

/**
 * Componente de video en pantalla completa
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
          ease: "easeOut" as const
        }}
        className="relative w-full h-full"
      >
        {/* Video en pantalla completa con object-cover para mantener proporción */}
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

        {/* Overlay sutil opcional para mejorar contraste si es necesario */}
        <div className="absolute inset-0 bg-gradient-to-br from-azul-intenso/5 via-transparent via-60% to-verde-salud/5 pointer-events-none" />
      </MotionDiv>
    </section>
  );
}

/**
 * Pantalla de espera con video en pantalla completa
 * Se muestra antes de comenzar el juego
 * Reacciona al toque para ir a la ruleta
 */
export default function WaitingScreen() {
  const isMounted = useIsMounted();
  const [isTabletPortrait, setIsTabletPortrait] = useState(false);
  const setGameState = useGameStore((state) => state.setGameState);

  // Manejar el toque/click para ir a la ruleta
  const handleTouch = () => {
    setGameState('roulette');
  };

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Detectar tablets modernos (600px-1279px) en orientación vertical
      const isTabletModern = 
        width >= 600 && width <= 1279 && 
        !((width >= 2160 && height >= 3840) || (width >= 3840 && height >= 2160));

      const isTabletPortraitResolution = 
        isTabletModern && height > width && height >= 800;

      setIsTabletPortrait(isTabletPortraitResolution);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <MotionDiv
      key="waiting-video"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`relative min-h-screen w-full bg-black overflow-hidden tv-portrait:min-h-screen cursor-pointer ${
        isTabletPortrait ? 'waiting-screen-tablet-portrait' : ''
      }`}
      style={{
        minHeight: window.innerWidth >= 600 && window.innerWidth <= 1279 ? '100dvh' : '100vh'
      }}
      role="main"
      aria-label="Pantalla de espera con video en pantalla completa - Toca para jugar"
      onClick={handleTouch}
      onTouchStart={handleTouch}
    >
      <FullScreenVideo />
      
      {/* Indicador sutil de que se puede tocar para jugar */}
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-10 left-0 right-0 text-center z-30"
      >
        <MotionDiv
          animate={{ 
            y: [0, -10, 0],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <p className="text-white text-2xl font-bold drop-shadow-lg">
            Toca la pantalla para jugar
          </p>
        </MotionDiv>
      </MotionDiv>
    </MotionDiv>
  );
}