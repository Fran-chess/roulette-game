// src/components/ui/Button.tsx
"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import React from "react";

// [modificación] Propiedades que pueden causar conflicto entre React y Framer Motion
type ConflictingProps = 
  | 'onDrag' 
  | 'onDragStart' 
  | 'onDragEnd' 
  | 'onAnimationStart'
  | 'onAnimationComplete';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, ConflictingProps> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "custom" | "gradient"; // Añadida variante custom
  className?: string;
  touchOptimized?: boolean; // Nueva prop para pantallas táctiles
  loading?: boolean; // [modificación] Para estado de carga
  loadingText?: string; // [modificación] Texto a mostrar durante la carga
}

export default function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  onClick,
  disabled,
  touchOptimized = false, // Por defecto false para no romper botones existentes
  loading = false, // [modificación]
  loadingText = "Cargando...", // [modificación]
  ...otherProps // [modificación] Renombrado para claridad
}: ButtonProps) {
  // Base style con optimizaciones táctiles opcionales
  const baseStyle = `px-6 py-3 rounded-lg font-marineBold focus:outline-none focus:ring-4 focus:ring-opacity-75 
    transition-all duration-200 ease-in-out text-lg shadow-md 
    ${touchOptimized ? "touch-optimized min-h-[48px] sm:min-h-[56px]" : ""}`;

  // [modificación] Extraer propiedades específicas de motion para evitar conflictos
  const motionProps: HTMLMotionProps<"button"> = {
    whileHover: !disabled && !loading ? { scale: 1.05 } : undefined,
    whileTap: !disabled && !loading ? { scale: 0.95 } : undefined,
    type,
    onClick,
    disabled: disabled || loading,
    className: `${touchOptimized ? "touch-optimized" : ""} ${className}`,
    ...otherProps // [modificación] Pasar otras propiedades no conflictivas
  };

  // Si se proporciona una clase personalizada y la variante es 'custom', no aplicar estilos predeterminados
  if (variant === "custom" && className) {
    return (
      <motion.button
        {...motionProps}
      >
        {loading ? loadingText : children}{" "}
        {/* [modificación] Mostrar texto de carga */}
      </motion.button>
    );
  }

  const variantStyles = {
    primary:
      "bg-azul-intenso text-white hover:bg-azul-intenso/90 hover:shadow-lg hover:scale-105 focus:ring-azul-intenso/50",
    secondary:
      "bg-verde-salud text-white hover:bg-verde-salud/90 hover:shadow-lg hover:scale-105 focus:ring-verde-salud/50",
    danger:
      "bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:scale-105 focus:ring-red-500/50",
    ghost:
      "bg-transparent text-azul-intenso hover:bg-blue-100 hover:shadow-md hover:scale-105 focus:ring-azul-intenso/50 border-2 border-azul-intenso",
    gradient:
      "bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-xl hover:from-cyan-500 hover:to-teal-400 hover:shadow-2xl hover:scale-[1.04] focus:ring-cyan-200 focus:outline-none active:scale-[0.97]",
    custom: "", // Variante custom sin estilos predeterminados
  };

  // Ajustar las animaciones para evitar que sean demasiado pronunciadas en pantallas táctiles
  const touchMotionProps = touchOptimized
    ? {
        whileHover: !disabled && !loading ? { scale: 1.03 } : undefined, // [modificación] Menos escala en hover, considerar loading
        whileTap: !disabled && !loading ? { scale: 0.97 } : undefined, // [modificación] Menos escala en tap, considerar loading
        transition: { type: "spring", stiffness: 500, damping: 25 }, // Animación más rápida
      }
    : {
        whileHover: !disabled && !loading ? { scale: 1.05 } : undefined, // [modificación] Considerar loading
        whileTap: !disabled && !loading ? { scale: 0.95 } : undefined, // [modificación] Considerar loading
      };

  // [modificación] Actualizar propiedades para la versión normal del botón
  const standardMotionProps: HTMLMotionProps<"button"> = {
    ...touchMotionProps,
    type,
    onClick,
    disabled: disabled || loading,
    className: `${baseStyle} ${variantStyles[variant]} ${className} ${
      loading ? "opacity-75 cursor-not-allowed" : ""
    }`,
    ...otherProps // [modificación] Pasar otras propiedades no conflictivas
  };

  return (
    <motion.button
      {...standardMotionProps}
    >
      {loading ? loadingText : children}
    </motion.button>
  );
}
