/**
 * Componente de Ruleta Interactiva
 * Versión refactorizada y modularizada
 */

"use client";

import {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  memo,
} from "react";
import { motion } from "framer-motion";
import { useSSR } from "@/hooks/useSSR";
import { useRouletteLogic } from "@/hooks/useRouletteLogic";
import { renderRoulette, resizeCanvas, type RenderContext } from "@/services/roulette/canvasRenderer";
import type { RouletteWheelProps } from "@/types";

/**
 * Componente RouletteWheel
 * Renderiza una ruleta interactiva con canvas HTML5
 *
 * @component
 * @example
 * ```tsx
 * <RouletteWheel
 *   questions={questions}
 *   onSpinStateChange={(spinning) => console.log(spinning)}
 * />
 * ```
 */
const RouletteWheel = memo(
  forwardRef<{ spin: () => void }, RouletteWheelProps>(
    ({ questions, onSpinStateChange, onCenterButtonClick, isSpinning: externalIsSpinning }, ref) => {
      // Referencias DOM
      const canvasRef = useRef<HTMLCanvasElement>(null);
      const containerRef = useRef<HTMLDivElement>(null);
      const animationFrameRef = useRef<number | undefined>(undefined);

      // Hook SSR
      const { isDOMReady, canUseDOM } = useSSR();

      // Lógica de la ruleta centralizada
      const {
        segments,
        spinState,
        highlightedSegment,
        winnerGlowIntensity,
        startSpin,
        updateAnimation,
        handleMouseMove,
        handleMouseLeave,
      } = useRouletteLogic({
        questions,
        onSpinStateChange,
      });

      // Dimensiones del canvas
      const canvasDimensions = useRef({
        width: 0,
        height: 0,
        radius: 0,
        centerX: 0,
        centerY: 0,
      });

      /**
       * Renderiza la ruleta en el canvas
       */
      const drawRoulette = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");

        if (!canvas || !ctx || !isDOMReady || segments.length === 0) return;

        const context: RenderContext = {
          canvas,
          ctx,
          centerX: canvasDimensions.current.centerX,
          centerY: canvasDimensions.current.centerY,
          radius: canvasDimensions.current.radius,
          currentAngle: spinState.currentAngle,
          segments,
          highlightedSegment,
          winnerGlowIntensity,
          isSpinning: spinState.isSpinning,
        };

        renderRoulette(context);
      }, [
        segments,
        spinState.currentAngle,
        spinState.isSpinning,
        highlightedSegment,
        winnerGlowIntensity,
        isDOMReady,
      ]);

      /**
       * Loop de animación
       */
      const animate = useCallback(() => {
        updateAnimation();
        drawRoulette();

        if (spinState.isSpinning) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      }, [updateAnimation, drawRoulette, spinState.isSpinning]);

      /**
       * Inicia el giro de la ruleta
       */
      const spin = useCallback(() => {
        startSpin();
      }, [startSpin]);

      /**
       * Maneja el redimensionamiento del canvas
       */
      const handleResize = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;

        if (!canvas || !container || !canUseDOM) return;

        const { width, height, radius } = resizeCanvas(canvas, container);

        canvasDimensions.current = {
          width,
          height,
          radius,
          centerX: width / 2,
          centerY: height / 2,
        };

        drawRoulette();
      }, [canUseDOM, drawRoulette]);

      /**
       * Maneja el click en el canvas
       */
      const onCanvasClick = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
          const canvas = canvasRef.current;
          if (!canvas || externalIsSpinning) return;

          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          // Calcular si el click está en el botón central
          const centerX = canvasDimensions.current.centerX;
          const centerY = canvasDimensions.current.centerY;
          const centerRadius = canvasDimensions.current.radius * 0.15; // Mismo ratio que CENTER_CIRCLE_RATIO

          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance <= centerRadius && onCenterButtonClick) {
            onCenterButtonClick();
          }
        },
        [externalIsSpinning, onCenterButtonClick]
      );

      /**
       * Maneja el movimiento del mouse
       */
      const onMouseMove = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          handleMouseMove(
            x,
            y,
            canvasDimensions.current.centerX,
            canvasDimensions.current.centerY
          );
        },
        [handleMouseMove]
      );

      /**
       * Maneja cuando el mouse sale del canvas
       */
      const onMouseLeave = useCallback(() => {
        handleMouseLeave();
      }, [handleMouseLeave]);

      // Exponer el método spin al componente padre
      useImperativeHandle(
        ref,
        () => ({
          spin: () => {
            if (!spinState.isSpinning && segments.length > 0 && isDOMReady) {
              spin();
            }
          },
        }),
        [spinState.isSpinning, segments.length, isDOMReady, spin]
      );

      // Configurar el canvas y manejar redimensionamiento
      useEffect(() => {
        if (!isDOMReady || !canUseDOM) return;

        handleResize();

        const resizeObserver = new ResizeObserver(handleResize);
        if (containerRef.current) {
          resizeObserver.observe(containerRef.current);
        }

        window.addEventListener("resize", handleResize);

        return () => {
          resizeObserver.disconnect();
          window.removeEventListener("resize", handleResize);
          const frameId = animationFrameRef.current;
          if (frameId) {
            cancelAnimationFrame(frameId);
          }
        };
      }, [isDOMReady, canUseDOM, handleResize]);

      // Manejar animación cuando el estado del giro cambia
      useEffect(() => {
        if (spinState.isSpinning) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }

        return () => {
          const frameId = animationFrameRef.current;
          if (frameId) {
            cancelAnimationFrame(frameId);
          }
        };
      }, [spinState.isSpinning, animate]);

      // Renderizar cuando cambien los datos relevantes
      useEffect(() => {
        if (!spinState.isSpinning && segments.length > 0 && isDOMReady) {
          drawRoulette();
        }
      }, [
        spinState.isSpinning,
        segments.length,
        isDOMReady,
        drawRoulette,
      ]);

      // Mostrar placeholder mientras carga
      if (!isDOMReady || !canUseDOM) {
        return (
          <div className="flex items-center justify-center w-full h-full min-h-[300px]">
            <div className="text-white/60 text-lg">Cargando ruleta...</div>
          </div>
        );
      }

      return (
        <motion.div
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <canvas
            ref={canvasRef}
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={onCanvasClick}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              touchAction: "none",
            }}
          />

          {/* Indicador de carga si no hay segmentos */}
          {segments.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <div className="text-white text-xl">Sin preguntas disponibles</div>
            </div>
          )}
        </motion.div>
      );
    }
  )
);

RouletteWheel.displayName = "RouletteWheel";

export default RouletteWheel;