'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { MotionDiv } from '../shared/MotionComponents';
import { useIsMounted } from '@/hooks/useIsMounted';
import { tvLogger } from '@/utils/tvLogger';

/**
 * TransitionScreen Component
 * Shows a transition screen with the next participant's name
 * before starting their game session
 */
export default function TransitionScreen() {
  const isMounted = useIsMounted();
  const nextParticipant = useGameStore((state) => state.nextParticipant);
  const confirmTransitionVisible = useGameStore((state) => state.confirmTransitionVisible);
  const transitionConfirmed = useGameStore((state) => state.transitionConfirmed);
  
  // Device detection states
  const [isTabletPortrait, setIsTabletPortrait] = useState(false);
  const [isTV65, setIsTV65] = useState(false);
  const [isTVTouch, setIsTVTouch] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Device detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Detect TV 65" resolution
      const isTV65Resolution =
        (width >= 2160 && height >= 3840) || (width >= 3840 && height >= 2160);

      setIsTV65(isTV65Resolution);
      setIsTVTouch(width >= 1280 && !isTV65Resolution);
      
      // Detect tablets in portrait orientation
      const isTabletPortraitResolution = 
        width >= 600 && width <= 1279 && 
        height > width && 
        height >= 800 && 
        !isTV65Resolution;
      setIsTabletPortrait(isTabletPortraitResolution);
      
      // Detect tablets in landscape
      const isTabletModern = width >= 600 && width <= 1279 && !isTV65Resolution && !isTabletPortraitResolution;
      setIsTablet(isTabletModern);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // REMOVIDO: Auto-transition - ahora manejado centralizadamente por prepareAndActivateNext
  
  // Handshake: Confirmar que esta pantalla está visible cuando se monta
  useEffect(() => {
    if (isMounted && nextParticipant && !transitionConfirmed) {
      tvLogger.transition('🎬 TRANSITION-SCREEN: Montado y visible - confirmando al store');
      confirmTransitionVisible();
    }
  }, [isMounted, nextParticipant, transitionConfirmed, confirmTransitionVisible]);

  console.log('🎬 TRANSITION-SCREEN: Renderizando', {
    isMounted,
    nextParticipant: nextParticipant?.nombre || 'null',
    transitionConfirmed
  });

  if (!isMounted) {
    console.log('🎬 TRANSITION-SCREEN: No montado aún');
    return null;
  }

  if (!nextParticipant) {
    console.log('🎬 TRANSITION-SCREEN: No hay nextParticipant - retornando null');
    return null;
  }

  console.log('🎬 TRANSITION-SCREEN: Renderizando transición para:', nextParticipant.nombre);

  // Responsive classes
  const containerClasses = () => {
    if (isTV65) {
      return "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800 p-24";
    } else if (isTabletPortrait) {
      return "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800 p-8";
    } else if (isTVTouch) {
      return "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800 p-16";
    } else if (isTablet) {
      return "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800 p-12";
    }
    return "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800 p-8";
  };

  const cardClasses = () => {
    if (isTV65) {
      return "bg-white/10 backdrop-blur-xl rounded-4xl border-4 border-white/30 p-24 text-center shadow-3xl max-w-6xl w-full";
    } else if (isTabletPortrait) {
      return "bg-white/10 backdrop-blur-xl rounded-2xl border-2 border-white/30 p-12 text-center shadow-2xl max-w-2xl w-full";
    } else if (isTVTouch) {
      return "bg-white/10 backdrop-blur-xl rounded-2xl border-2 border-white/30 p-16 text-center shadow-2xl max-w-4xl w-full";
    } else if (isTablet) {
      return "bg-white/10 backdrop-blur-xl rounded-2xl border-2 border-white/30 p-12 text-center shadow-2xl max-w-3xl w-full";
    }
    return "bg-white/10 backdrop-blur-xl rounded-2xl border-2 border-white/30 p-8 text-center shadow-2xl max-w-lg w-full";
  };

  const titleClasses = () => {
    if (isTV65) {
      return "text-[8rem] font-marineBlack text-white mb-12 leading-tight drop-shadow-2xl";
    } else if (isTabletPortrait) {
      return "text-6xl font-marineBlack text-white mb-8 leading-tight drop-shadow-2xl";
    } else if (isTVTouch) {
      return "text-7xl font-marineBlack text-white mb-10 leading-tight drop-shadow-2xl";
    } else if (isTablet) {
      return "text-5xl font-marineBlack text-white mb-8 leading-tight drop-shadow-2xl";
    }
    return "text-4xl font-marineBlack text-white mb-6 leading-tight drop-shadow-2xl";
  };

  const nameClasses = () => {
    if (isTV65) {
      return "text-[10rem] font-marineBlack text-green-400 mb-8 leading-tight drop-shadow-2xl";
    } else if (isTabletPortrait) {
      return "text-7xl font-marineBlack text-green-400 mb-6 leading-tight drop-shadow-2xl";
    } else if (isTVTouch) {
      return "text-8xl font-marineBlack text-green-400 mb-8 leading-tight drop-shadow-2xl";
    } else if (isTablet) {
      return "text-6xl font-marineBlack text-green-400 mb-6 leading-tight drop-shadow-2xl";
    }
    return "text-5xl font-marineBlack text-green-400 mb-4 leading-tight drop-shadow-2xl";
  };

  const subtitleClasses = () => {
    if (isTV65) {
      return "text-[6rem] font-marineRegular text-white/90 leading-relaxed";
    } else if (isTabletPortrait) {
      return "text-3xl font-marineRegular text-white/90 leading-relaxed";
    } else if (isTVTouch) {
      return "text-4xl font-marineRegular text-white/90 leading-relaxed";
    } else if (isTablet) {
      return "text-2xl font-marineRegular text-white/90 leading-relaxed";
    }
    return "text-xl font-marineRegular text-white/90 leading-relaxed";
  };

  return (
    <MotionDiv
      key="transition-screen"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={containerClasses()}
      role="main"
      aria-label={`Pantalla de transición para ${nextParticipant.nombre}`}
    >
      <MotionDiv
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className={cardClasses()}
      >
        {/* Animated dots indicator */}
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center space-x-2 mb-8"
        >
          {[0, 1, 2].map((i) => (
            <MotionDiv
              key={i}
              className={`w-4 h-4 rounded-full bg-green-400 ${
                isTV65 ? 'w-8 h-8' : isTabletPortrait || isTVTouch || isTablet ? 'w-6 h-6' : 'w-4 h-4'
              }`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h1 className={titleClasses()}>
            ¡Siguiente participante!
          </h1>
          
          <h2 className={nameClasses()}>
            {nextParticipant.nombre} {nextParticipant.apellido}
          </h2>
          
          <p className={subtitleClasses()}>
            Prepárate para jugar...
          </p>
        </MotionDiv>

        {/* Loading bar */}
        <MotionDiv
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 3, ease: "linear" }}
          className={`mt-8 h-2 bg-green-400 rounded-full ${
            isTV65 ? 'h-4' : isTabletPortrait || isTVTouch || isTablet ? 'h-3' : 'h-2'
          }`}
        />
      </MotionDiv>

      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <MotionDiv
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <style jsx global>{`
        .rounded-4xl {
          border-radius: 2.5rem;
        }
        
        .shadow-3xl {
          box-shadow: 0 35px 70px -12px rgba(0, 0, 0, 0.9),
            0 0 80px rgba(255, 255, 255, 0.25),
            inset 0 3px 6px rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </MotionDiv>
  );
}