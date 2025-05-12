// src/components/ui/Input.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: string;
  className?: string; // Para el <input>
  labelClassName?: string; // Para el <label>
  containerClassName?: string; // Para el <div> contenedor
  labelFocusColor?: string; // Color explícito para el label en foco (opcional)
}

export default function Input({
  label,
  name,
  type = 'text',
  className = '', // Esta clase será crucial para el theming del input desde RegistrationForm
  labelClassName = '', // Esta clase será crucial para el theming del label
  containerClassName = '',
  labelFocusColor, // Si se provee, se usará para animar el color del label en foco
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Los estilos base del input y label. Gran parte de la apariencia vendrá de `className` y `labelClassName`.
  const baseInputStyle = "w-full px-4 py-3 border-2 rounded-lg outline-none transition-all duration-200 ease-in-out text-base font-marineRegular";
  const baseLabelStyle = "block text-sm font-marineBold mb-2 transition-all duration-200";

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (props.onFocus) props.onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (props.onBlur) props.onBlur(e);
  };

  // Determina el color del label en foco.
  // Si se pasa `labelFocusColor`, se usa ese. Si no, el label no cambia de color en la animación (mantiene el de `labelClassName`).
  const animatedLabelColor = isFocused && labelFocusColor ? labelFocusColor : undefined;

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <motion.label
          htmlFor={name}
          className={`${baseLabelStyle} ${labelClassName}`} // `labelClassName` define el color base
          animate={{
            scale: isFocused ? 1.02 : 1,
            color: animatedLabelColor, // Anima al color de foco si se especifica, sino no cambia
          }}
          transition={{ duration: 0.2 }} // Transición suave para la animación del label
        >
          {label}
        </motion.label>
      )}
      {/*
        El `className` que se pasa desde RegistrationForm.tsx se encargará de:
        - Fondo del input (ej. bg-white/10)
        - Color del texto del input (ej. text-white)
        - Color del placeholder (ej. placeholder-gray-300)
        - Estilos del borde (ej. border-white/30)
        - Estilos de hover (ej. hover:bg-white/20)
        - Estilos de focus (ej. focus:border-teal-300 focus:ring-teal-300)
      */}
      <input
        id={name}
        name={name}
        type={type}
        className={`${baseInputStyle} ${className}`} // `className` aquí es CLAVE para el theming
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    </div>
  );
}