"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

interface MassiveConfettiProps {
  show: boolean;
  windowSize: { width: number; height: number };
  isTV65?: boolean;
  isTabletPortrait?: boolean;
  className?: string;
}

/**
 * [modificación] - Componente reutilizable para confetti masivo desde arriba y abajo
 * Optimizado para rendimiento eliminando disparos laterales que causaban lag
 * [NUEVO] - Incluye optimizaciones universales para tablets en orientación vertical
 */
export default function MassiveConfetti({ 
  show, 
  windowSize, 
  isTV65 = false,
  isTabletPortrait = false,
  className = "pointer-events-none fixed inset-0 z-50" 
}: MassiveConfettiProps) {
  // [modificación] - Configuración optimizada del confetti según las especificaciones y dispositivo
  const confettiConfig = useMemo(() => ({
    width: windowSize.width,
    height: windowSize.height,
    gravity: isTV65 ? 0.09 : isTabletPortrait ? 0.12 : 0.15,
    initialVelocityY: isTV65 ? 25 : isTabletPortrait ? 18 : 15,
    initialVelocityX: isTV65 ? 15 : isTabletPortrait ? 12 : 10,
    colors: [
      '#ff0040', '#ff8c00', '#ffd700', '#00ff80', '#00bfff',
      '#8a2be2', '#ff1493', '#32cd32', '#ff6347', '#1e90ff',
      '#ffa500', '#9370db', '#00ced1', '#ff69b4', '#00ff00',
      '#ffffff', '#fff700'
    ],
    opacity: isTV65 ? 0.96 : isTabletPortrait ? 0.92 : 0.9,
    wind: isTV65 ? 0.03 : isTabletPortrait ? 0.02 : 0.01,
    recycle: false,
  }), [windowSize.width, windowSize.height, isTV65, isTabletPortrait]);

  if (!show || windowSize.width <= 0 || windowSize.height <= 0) {
    return null;
  }

  return (
    <>
      <Confetti
        {...confettiConfig}
        numberOfPieces={isTV65 ? 600 : isTabletPortrait ? 180 : 220}
        confettiSource={{ x: 0, y: 0, w: windowSize.width, h: 40 }}
        recycle={false}
        className={`${className} ${isTabletPortrait ? 'confetti-tablet-portrait' : ''}`}
        style={{ zIndex: 9999 }}
      />
      <Confetti
        {...confettiConfig}
        numberOfPieces={isTV65 ? 450 : isTabletPortrait ? 140 : 170}
        confettiSource={{ x: 0, y: windowSize.height - 40, w: windowSize.width, h: 40 }}
        recycle={false}
        className={`${className} ${isTabletPortrait ? 'confetti-tablet-portrait' : ''}`}
        style={{ zIndex: 9999 }}
      />
    </>
  );
} 