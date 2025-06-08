import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';

export interface RouletteButtonState {
  isSpinning: boolean;
  isDisabled: boolean;
  buttonClasses: string;
  iconClasses: string;
  buttonText: string;
}

/**
 * Hook personalizado para gestionar el estado del botón de la ruleta
 * Incluye manejo de clases CSS para efectos neumórficos y animaciones del ícono
 */
export function useRouletteButton(
  isSpinning: boolean = false,
  deviceType: 'mobile' | 'tablet' | 'tv' | 'desktop' = 'desktop'
): RouletteButtonState {
  const gameState = useGameStore((state) => state.gameState);
  
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
    };
  }, [isSpinning, gameState, deviceType]);
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