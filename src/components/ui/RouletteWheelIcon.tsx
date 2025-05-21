// src/components/icons/RouletteWheelIcon.tsx

import React from "react";

interface RouletteWheelIconProps {
  className?: string;
  size?: number; // px
}

export default function RouletteWheelIcon({
  className = "",
  size = 32,
}: RouletteWheelIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Círculo exterior */}
      <circle
        cx="16"
        cy="16"
        r="15"
        stroke="#10B981"
        strokeWidth="2.2"
        fill="#fff"
      />
      {/* Círculo interior */}
      <circle
        cx="16"
        cy="16"
        r="8"
        stroke="#0EA5E9"
        strokeWidth="2.2"
        fill="#fff"
      />
      {/* Agujas o divisores */}
      <g stroke="#0EA5E9" strokeWidth="1.5">
        <line x1="16" y1="16" x2="16" y2="3" />
        <line x1="16" y1="16" x2="28" y2="16" />
        <line x1="16" y1="16" x2="16" y2="29" />
        <line x1="16" y1="16" x2="4" y2="16" />
      </g>
      {/* Bolitas en los extremos */}
      <circle cx="16" cy="4" r="1.4" fill="#10B981" />
      <circle cx="28" cy="16" r="1.4" fill="#0EA5E9" />
      <circle cx="16" cy="28" r="1.4" fill="#10B981" />
      <circle cx="4" cy="16" r="1.4" fill="#0EA5E9" />
      {/* Centro */}
      <circle cx="16" cy="16" r="2" fill="#0EA5E9" />
    </svg>
  );
}
