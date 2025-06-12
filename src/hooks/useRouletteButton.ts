import { useMemo, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';

export interface RouletteButtonState {
  isSpinning: boolean;
  isDisabled: boolean;
  buttonClasses: string;
  iconClasses: string;
  buttonText: string;
  handleRippleEffect: (event: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => void;
}

/**
 * Función para crear efecto ripple en el punto exacto del toque
 */
const createRippleEffect = (event: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
  const button = event.currentTarget;
  const rect = button.getBoundingClientRect();
  
  // Obtener coordenadas del toque/click
  let clientX: number, clientY: number;
  
  if ('touches' in event && event.touches.length > 0) {
    // Touch event
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else if ('clientX' in event) {
    // Mouse event
    clientX = event.clientX;
    clientY = event.clientY;
  } else {
    // Fallback al centro del botón
    clientX = rect.left + rect.width / 2;
    clientY = rect.top + rect.height / 2;
  }
  
  // Calcular posición relativa al botón
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  
  // Remover ripples anteriores
  const existingRipples = button.querySelectorAll('.ripple-effect');
  existingRipples.forEach(ripple => ripple.remove());
  
  // Crear elemento ripple
  const ripple = document.createElement('div');
  ripple.className = 'ripple-effect';
  
  // Calcular el tamaño del ripple (diagonal del botón para cubrir todo)
  const size = Math.sqrt(rect.width * rect.width + rect.height * rect.height) * 2;
  
  // Aplicar estilos
  ripple.style.cssText = `
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, 
      rgba(90, 204, 193, 0.6) 0%,
      rgba(90, 204, 193, 0.3) 30%,
      rgba(90, 204, 193, 0.1) 60%,
      transparent 100%
    );
    pointer-events: none;
    transform: translate(-50%, -50%) scale(0);
    animation: ripple-animation 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    left: ${x}px;
    top: ${y}px;
    width: ${size}px;
    height: ${size}px;
    z-index: 0;
  `;
  
  // Insertar el ripple
  button.appendChild(ripple);
  
  // Remover el ripple después de la animación
  setTimeout(() => {
    if (ripple.parentNode) {
      ripple.remove();
    }
  }, 600);
};

/**
 * Hook personalizado para gestionar el estado del botón de la ruleta
 * Incluye manejo de clases CSS para efectos neumórficos, animaciones del ícono y efecto ripple
 */
export function useRouletteButton(
  isSpinning: boolean = false,
  deviceType: 'mobile' | 'tablet' | 'tv' | 'desktop' = 'desktop'
): RouletteButtonState {
  const gameState = useGameStore((state) => state.gameState);
  
  // Función para manejar el efecto ripple
  const handleRippleEffect = useCallback((event: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    // Solo crear ripple si el botón no está deshabilitado
    const isDisabled = isSpinning || gameState === 'question' || gameState === 'prize';
    if (!isDisabled) {
      createRippleEffect(event);
    }
  }, [isSpinning, gameState]);
  
  return useMemo(() => {
    // Determinar si el botón está deshabilitado
    const isDisabled = isSpinning || gameState === 'question' || gameState === 'prize';
    
    // Clases base del botón neumórfico
    let buttonClasses = 'neomorphic-button';
    
    // Agregar clases según el tamaño del dispositivo
    switch (deviceType) {
      case 'mobile':
        buttonClasses += ' neomorphic-button-mobile';
        break;
      case 'tablet':
        buttonClasses += ' neomorphic-button-tablet';
        break;
      case 'tv':
        buttonClasses += ' neomorphic-button-tv';
        break;
      default:
        // Desktop usa las clases base
        break;
    }
    
    // Agregar clases según el estado
    if (isSpinning) {
      buttonClasses += ' spinning-state';
    } else if (gameState === 'roulette' && !isDisabled) {
      buttonClasses += ' ready-to-spin';
    }
    
    // Mantener compatibilidad con clases existentes y agregar optimizaciones táctiles
    buttonClasses += ' touch-optimized';
    
    // Clases para el ícono
    let iconClasses = 'roulette-icon-container';
    
    if (isSpinning) {
      iconClasses += ' roulette-icon-spinning';
    } else if (gameState === 'roulette' && !isDisabled) {
      iconClasses += ' roulette-icon-idle';
    } else if (isDisabled && gameState !== 'roulette') {
      iconClasses += ' roulette-icon-waiting';
    }
    
    // Texto del botón según el estado
    let buttonText = '¡GIRAR LA RULETA!';
    
    if (isSpinning) {
      buttonText = 'GIRANDO...';
    } else if (gameState === 'question') {
      buttonText = 'RESPONDE LA PREGUNTA';
    } else if (gameState === 'prize') {
      buttonText = '¡FELICITACIONES!';
    }
    
    return {
      isSpinning,
      isDisabled,
      buttonClasses,
      iconClasses,
      buttonText,
      handleRippleEffect,
    };
  }, [isSpinning, gameState, deviceType, handleRippleEffect]);
}

/**
 * Hook simplificado para obtener solo las clases del ícono
 * Útil cuando se necesita aplicar las clases directamente al componente del ícono
 */
export function useRouletteIconClasses(isSpinning: boolean = false): string {
  const gameState = useGameStore((state) => state.gameState);
  
  return useMemo(() => {
    let iconClasses = 'roulette-icon-container';
    
    if (isSpinning) {
      iconClasses += ' roulette-icon-spinning';
    } else if (gameState === 'roulette') {
      iconClasses += ' roulette-icon-idle';
    } else {
      iconClasses += ' roulette-icon-waiting';
    }
    
    return iconClasses;
  }, [isSpinning, gameState]);
} 