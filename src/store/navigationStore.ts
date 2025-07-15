import { create } from 'zustand';
import { tvLogger } from '@/utils/tvLogger';

/**
 * @typedef NavigationState
 * @property {boolean} isNavigating - Indica si hay una navegación en curso
 * @property {string|null} navigationTarget - Destino de la navegación (ej: '/game/123')
 * @property {string|null} loadingMessage - Mensaje personalizado para mostrar durante la carga
 */

/**
 * Store para controlar el estado de navegación global y mostrar un overlay durante transiciones.
 * Esto evita los "parpadeos" cuando Next.js monta/desmonta componentes en navegaciones.
 */
interface NavigationStore {
  // Estado
  isNavigating: boolean;
  navigationTarget: string | null;
  loadingMessage: string | null;
  
  // Acciones
  /**
   * Inicia una transición de navegación con overlay
   * @param target Ruta a la que se está navegando
   * @param message Mensaje personalizado a mostrar
   */
  startNavigation: (target: string, message?: string | null) => void;
  
  /**
   * Finaliza la transición de navegación
   */
  stopNavigation: () => void;
  
  /**
   * Reinicia completamente el store de navegación
   */
  resetNavigation: () => void;
}

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  isNavigating: false,
  navigationTarget: null,
  loadingMessage: null,
  
  startNavigation: (target, message = null) => {
    const current = get();
    if (current.isNavigating && current.navigationTarget === target) {
      tvLogger.warn(`Ya hay una navegación en curso hacia ${target}`);
      return;
    }
    
    set({
      isNavigating: true,
      navigationTarget: target,
      loadingMessage: message,
    });
  },
  
  stopNavigation: () => set({
    isNavigating: false,
    navigationTarget: null,
    loadingMessage: null,
  }),
  
  resetNavigation: () => {
    set({
      isNavigating: false,
      navigationTarget: null,
      loadingMessage: null,
    });
  },
})); 
