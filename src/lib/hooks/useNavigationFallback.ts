import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useNavigationStore } from "@/store/navigationStore";

/**
 * Hook personalizado para detectar y resolver automáticamente problemas de navegación bloqueada.
 *
 * Este hook monitorea el estado de navegación y proporciona un mecanismo de fallback
 * para evitar que la aplicación se quede atascada en un estado de carga permanente.
 *
 * @param timeout Tiempo en milisegundos antes de considerar la navegación como bloqueada (default: 8000ms)
 */
export function useNavigationFallback(timeout: number = 8000) {
  const { isNavigating, navigationTarget, resetNavigation } =
    useNavigationStore();
  const router = useRouter();
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastNavigationTarget = useRef<string | null>(null);

  useEffect(() => {
    if (isNavigating && navigationTarget) {
      // Si es una nueva navegación diferente, limpiar timeout anterior
      if (lastNavigationTarget.current !== navigationTarget) {
        if (fallbackTimeoutRef.current) {
          clearTimeout(fallbackTimeoutRef.current);
        }

        lastNavigationTarget.current = navigationTarget;

        // Establecer nuevo timeout de fallback
        fallbackTimeoutRef.current = setTimeout(() => {
          console.warn(
            `Navegación hacia ${navigationTarget} bloqueada por más de ${timeout}ms. Ejecutando fallback...`
          );

          try {
            // Intentar navegación directa como fallback
            router.push(navigationTarget);

            // Reset del estado después de la navegación de fallback
            setTimeout(() => {
              resetNavigation();
            }, 500);
          } catch (error) {
            console.error("Error en navegación de fallback:", error);
            resetNavigation();
          }
        }, timeout);
      }
    } else {
      // Limpiar timeout si no hay navegación activa
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
      lastNavigationTarget.current = null;
    }

    // Cleanup al desmontar
    return () => {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
    };
  }, [isNavigating, navigationTarget, timeout, router, resetNavigation]);

  // Función para forzar reset manual del estado de navegación
  const forceResetNavigation = () => {
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
    lastNavigationTarget.current = null;
    resetNavigation();
  };

  return {
    isNavigationStuck: isNavigating && navigationTarget !== null,
    forceResetNavigation,
  };
}
