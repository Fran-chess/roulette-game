/**
 * Componente de Timer Circular
 * Muestra un contador visual con progreso circular
 */

import { memo } from 'react';

interface TimerCircleProps {
  /** Segundos actuales */
  seconds: number;
  /** Segundos iniciales/totales */
  initialSeconds: number;
  /** Si el timer está en estado urgente */
  isUrgent: boolean;
  /** Tamaño del círculo en píxeles */
  size?: number;
  /** Grosor del trazo en píxeles */
  strokeWidth?: number;
}

/**
 * Componente visual de timer circular con animación
 */
const TimerCircle = memo(({
  seconds,
  initialSeconds,
  isUrgent,
  size = 100,
  strokeWidth = 4,
}: TimerCircleProps) => {
  // Cálculos del círculo
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (seconds / initialSeconds) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <svg
          className={`transform -rotate-90 transition-all ${
            isUrgent ? "animate-pulse" : ""
          }`}
          width={size}
          height={size}
        >
          {/* Círculo de fondo */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Círculo de progreso */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isUrgent ? "#ef4444" : "#10b981"}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>

        {/* Número central */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`
              font-bold text-2xl
              sm:text-3xl
              lg:text-4xl
              ${isUrgent ? "text-red-500 animate-pulse" : "text-white"}
            `}
          >
            {seconds}
          </span>
        </div>
      </div>
    </div>
  );
});

TimerCircle.displayName = 'TimerCircle';

export default TimerCircle;