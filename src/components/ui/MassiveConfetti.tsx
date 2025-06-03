"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

interface MassiveConfettiProps {
  show: boolean;
  windowSize: { width: number; height: number };
  isTV65?: boolean;
  className?: string;
}

/**
 * [modificación] - Componente reutilizable para confetti masivo desde todos los bordes
 * Implementa el sistema de disparo masivo optimizado para TV65 y otros dispositivos
 */
export default function MassiveConfetti({ 
  show, 
  windowSize, 
  isTV65 = false, 
  className = "pointer-events-none fixed inset-0 z-50" 
}: MassiveConfettiProps) {
  // [modificación] - Configuración optimizada del confetti según las especificaciones
  const confettiConfig = useMemo(() => ({
    width: windowSize.width,
    height: windowSize.height,
    gravity: isTV65 ? 0.09 : 0.15,
    initialVelocityY: isTV65 ? 25 : 15,
    initialVelocityX: isTV65 ? 15 : 10,
    colors: [
      '#ff0040', '#ff8c00', '#ffd700', '#00ff80', '#00bfff',
      '#8a2be2', '#ff1493', '#32cd32', '#ff6347', '#1e90ff',
      '#ffa500', '#9370db', '#00ced1', '#ff69b4', '#00ff00',
      '#ffffff', '#fff700' // [modificación] - Añadir blanco/dorado para más "fiesta"
    ],
    opacity: isTV65 ? 0.96 : 0.9,
    wind: isTV65 ? 0.03 : 0.01,
    recycle: false,
  }), [windowSize.width, windowSize.height, isTV65]);

  if (!show || windowSize.width <= 0 || windowSize.height <= 0) {
    return null;
  }

  return (
    <>
      {/* Arriba */}
      <Confetti
        {...confettiConfig}
        numberOfPieces={isTV65 ? 500 : 180}
        confettiSource={{ x: 0, y: 0, w: windowSize.width, h: 40 }}
        recycle={false}
        className={className}
        style={{ zIndex: 9999 }}
      />
      {/* Abajo */}
      <Confetti
        {...confettiConfig}
        numberOfPieces={isTV65 ? 380 : 130}
        confettiSource={{ x: 0, y: windowSize.height - 40, w: windowSize.width, h: 40 }}
        recycle={false}
        className={className}
        style={{ zIndex: 9999 }}
      />
      {/* Izquierda */}
      <Confetti
        {...confettiConfig}
        numberOfPieces={isTV65 ? 250 : 80}
        confettiSource={{ x: 0, y: 0, w: 40, h: windowSize.height }}
        recycle={false}
        className={className}
        style={{ zIndex: 9999 }}
      />
      {/* Derecha */}
      <Confetti
        {...confettiConfig}
        numberOfPieces={isTV65 ? 250 : 80}
        confettiSource={{ x: windowSize.width - 40, y: 0, w: 40, h: windowSize.height }}
        recycle={false}
        className={className}
        style={{ zIndex: 9999 }}
      />
    </>
  );
} 