// src/components/ui/Button.tsx
'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'custom'; // Añadida variante custom
  className?: string;
}

export default function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  onClick,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyle = "px-6 py-3 rounded-lg font-marineBold focus:outline-none focus:ring-4 focus:ring-opacity-75 transition-all duration-200 ease-in-out text-lg shadow-md";
  
  // Si se proporciona una clase personalizada y la variante es 'custom', no aplicar estilos predeterminados
  if (variant === 'custom' && className) {
    return (
      <motion.button
        whileHover={!disabled ? { scale: 1.05 } : undefined}
        whileTap={!disabled ? { scale: 0.95 } : undefined}
        className={className}
        type={type}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </motion.button>
    );
  }
  
  const variantStyles = {
    primary: 'bg-azul-intenso text-white hover:bg-azul-intenso/90 hover:shadow-lg hover:scale-105 focus:ring-azul-intenso/50',
    secondary: 'bg-verde-salud text-white hover:bg-verde-salud/90 hover:shadow-lg hover:scale-105 focus:ring-verde-salud/50',
    danger: 'bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:scale-105 focus:ring-red-500/50',
    ghost: 'bg-transparent text-azul-intenso hover:bg-blue-100 hover:shadow-md hover:scale-105 focus:ring-azul-intenso/50 border-2 border-azul-intenso',
    custom: '', // Variante custom sin estilos predeterminados
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      className={`${baseStyle} ${variantStyles[variant]} ${className}`}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}