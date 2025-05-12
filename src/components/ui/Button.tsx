// src/components/ui/Button.tsx
'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; // Puedes añadir más variantes
  className?: string;
}

export default function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  const baseStyle = "px-6 py-3 rounded-lg font-marineBold focus:outline-none focus:ring-4 focus:ring-opacity-75 transition-all duration-200 ease-in-out text-lg shadow-md";
  const variantStyles = {
    primary: 'bg-azul-intenso text-white hover:bg-azul-intenso/90 hover:shadow-lg hover:scale-105 focus:ring-azul-intenso/50',
    secondary: 'bg-verde-salud text-white hover:bg-verde-salud/90 hover:shadow-lg hover:scale-105 focus:ring-verde-salud/50',
    danger: 'bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:scale-105 focus:ring-red-500/50',
    ghost: 'bg-transparent text-azul-intenso hover:bg-blue-100 hover:shadow-md hover:scale-105 focus:ring-azul-intenso/50 border-2 border-azul-intenso',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseStyle} ${variantStyles[variant]} ${className}`}
      type={props.type}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {children}
    </motion.button>
  );
}