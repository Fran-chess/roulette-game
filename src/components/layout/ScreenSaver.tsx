'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface ScreenSaverProps {
  onInteraction: () => void;
  isVisible: boolean; 
}

export default function ScreenSaver({ onInteraction, isVisible }: ScreenSaverProps) {
  // [modificación] Añadido estado para el mensaje pulsante
  const [isTextVisible, setIsTextVisible] = useState(true);
  
  // [modificación] Efecto para alternar la visibilidad del texto cada 1.5 segundos
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setIsTextVisible(prev => !prev);
    }, 1500);
    
    return () => clearInterval(interval);
  }, [isVisible]);

  // Si no es visible retornamos null
  if (!isVisible) return null; 

  return (
    <div
      className="w-full h-full cursor-pointer flex flex-col items-center justify-center"
      onClick={onInteraction}
      onTouchStart={onInteraction}
    >
    </div>
  );
}