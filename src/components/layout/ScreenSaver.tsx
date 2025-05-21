"use client";
import { useNavigationStore } from "@/store/navigationStore";
import { useCallback, useEffect } from "react";

interface ScreenSaverProps {
  onInteraction: () => void;
  isVisible: boolean;
}

/**
 * Screensaver minimalista: sólo captura interacción y no muestra ningún contenido extra.
 */
export default function ScreenSaver({
  onInteraction,
  isVisible,
}: ScreenSaverProps) {
  const isNavigating = useNavigationStore((state) => state.isNavigating);

  // Handler universal
  const handleAnyInteraction = useCallback(
    (e: any) => {
      onInteraction();
    },
    [onInteraction]
  );

  // Detección global de interacción (mouse, touch, teclado, wheel)
  useEffect(() => {
    if (!isVisible || isNavigating) return;

    const events = [
      "keydown",
      "mousemove",
      "touchmove",
      "wheel",
      "mousedown",
      "touchstart",
    ];
    const handler = (e: any) => handleAnyInteraction(e);

    events.forEach((event) =>
      window.addEventListener(event, handler, { passive: true })
    );
    return () => {
      events.forEach((event) => window.removeEventListener(event, handler));
    };
  }, [isVisible, isNavigating, handleAnyInteraction]);

  if (!isVisible || isNavigating) return null;

  return (
    // Overlay invisible que cubre todo para capturar clicks/touches
    <div
      className="fixed inset-0 z-50 w-full h-full cursor-pointer"
      onClick={handleAnyInteraction}
      onTouchStart={handleAnyInteraction}
      // Sin fondo ni contenido
    />
  );
}
