// src/components/game/RouletteWheel.tsx
"use client";
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useGameStore } from "@/store/gameStore";
import type { RouletteWheelProps, Question } from "@/types";
import { motion } from "framer-motion";
import React from "react";
import { useDOMSafe } from "@/lib/hooks/useSSRSafe";

// [modificación] Interfaz para segmentos de la ruleta
interface WheelSegment {
  text: string;
  color: string;
  question: Question;
}

// --- Funciones Helper ---
const baseColors = [
  "#192A6E", // azul-intenso
  "#5ACCC1", // verde-salud
  "#40C0EF", // celeste-medio
  "#F2BD35", // amarillo-ds
  "#D5A7CD", // Rosado-lila
  "#5ACCC1",
  "#192A6E",
  "#F2BD35",
  "#40C0EF",
  "#D5A7CD",
];

let colorIndexGlobal = 0;

function getRandomColor() {
  const previousColorIndex =
    (colorIndexGlobal - 1 + baseColors.length) % baseColors.length;
  let nextColorIndex = colorIndexGlobal % baseColors.length;
  if (baseColors.length <= 1) {
    colorIndexGlobal++;
    return baseColors[0];
  }
  if (baseColors.length > 1 && nextColorIndex === previousColorIndex) {
    nextColorIndex = (nextColorIndex + 1) % baseColors.length;
  }
  const color = baseColors[nextColorIndex];
  colorIndexGlobal++;
  return color;
}

function getContrastYIQ(hexcolor: string): string {
  hexcolor = hexcolor.replace("#", "");
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 135 ? "#1E1E1E" : "#FFFFFF";
}

// [modificación] Función de easing mejorada para simular desaceleración realista de ruleta
function customEasingFunction(t: number): number {
  // Función cúbica con desaceleración más pronunciada al final
  // Simula mejor el comportamiento físico de una ruleta real
  return 1 - Math.pow(1 - t, 3.5);
}

// [modificación] Función para mapear preguntas a segmentos de la ruleta
function mapQuestionsToSegments(questions: Question[]): WheelSegment[] {
  return questions.map((question) => ({
    text: question.category,
    color: getRandomColor(),
    question: question,
  }));
}

// --- Componente principal ---
const RouletteWheel = forwardRef<{ spin: () => void }, RouletteWheelProps>(
  ({ questions }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { isDOMReady, canUseDOM } = useDOMSafe();
    
    const setLastSpinResultIndex = useGameStore(
      (state) => state.setLastSpinResultIndex
    );

    // Estados responsive
    const [isLandscape, setIsLandscape] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const [isSpinning, setIsSpinning] = useState(false);
    const [currentAngle, setCurrentAngle] = useState(0);
    const [highlightedSegment, setHighlightedSegment] = useState<number | null>(
      null
    );
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const animationConfigRef = useRef({
      startTime: 0,
      duration: 0,
      targetAngle: 0,
      animationFrameId: 0,
    });

    const wheelSegments = useMemo(() => {
      if (!questions || questions.length === 0) {
        return [];
      }
      const segments = mapQuestionsToSegments(questions);
      return segments;
    }, [questions]);
    const numSegments = wheelSegments.length;
    const anglePerSegment = numSegments > 0 ? (2 * Math.PI) / numSegments : 0;

    // Detectar dispositivo
    useEffect(() => {
      if (!canUseDOM) return;
      
      const handleDeviceDetection = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        setIsLandscape(width > height);
        setIsTablet(width >= 768 && width <= 1280);
        setIsMobile(width < 768);
      };
      
      handleDeviceDetection();
      window.addEventListener("resize", handleDeviceDetection);
      return () => window.removeEventListener("resize", handleDeviceDetection);
    }, [canUseDOM]);

    useEffect(() => {
      if (!canUseDOM) return;
      
      try {
        const audio = new Audio("/sounds/wheel-spin.mp3");
        audio.preload = "auto";
        audio.addEventListener("error", () => {
          const mediaError = audio.error;
          console.warn(
            "AUDIO: No se pudo cargar el audio de giro:",
            mediaError
              ? `${mediaError.code} - ${mediaError.message}`
              : "Unknown error"
          );
        });
        audioRef.current = audio;
      } catch (error) {
        console.warn("AUDIO: Error al inicializar el objeto Audio:", error);
      }
      return () => {};
    }, [canUseDOM]);

    // --- [modificación] Dibujo recibe size explícito, nunca usa viewport directamente (movido antes de handleResize) ---
    const drawRoulette = useCallback(
      (rotationAngle = 0, canvasSize?: number) => {
        const canvas = canvasRef.current;
        if (!canvas || !isDOMReady) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const size = canvasSize || canvas.width;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size * 0.48; // Siempre ajustado al cuadrado

        ctx.clearRect(0, 0, size, size);

        // [modificación] Fuente base optimizada para TV 4K - reducido para letras más pequeñas
        const baseFontSize = Math.max(20, radius * (isMobile ? 0.08 : 0.12));
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        // Fondo translúcido
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fillStyle = "rgba(25, 42, 110, 0.09)";
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotationAngle);

        wheelSegments.forEach((segment: WheelSegment, i: number) => {
          const startAngle = i * anglePerSegment;
          const endAngle = (i + 1) * anglePerSegment;

          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, radius, startAngle, endAngle);
          ctx.closePath();

          // [modificación] Renderizado mejorado para segmento destacado
          if (highlightedSegment === i) {
            // [modificación] Glow exterior dorado brillante
            ctx.save();
            ctx.shadowColor = "#FFD700";
            ctx.shadowBlur = 25;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.fillStyle = segment.color;
            ctx.fill();
            
            // [modificación] Borde exterior grueso y blanco como aureola
            ctx.lineWidth = 8;
            ctx.strokeStyle = "#FFFFFF";
            ctx.shadowColor = "#FFD700";
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.restore();
          } else {
            // [modificación] Segmento normal sin efectos especiales
            ctx.fillStyle = segment.color;
            ctx.fill();
          }

          // [modificación] Renderizado de texto profesional y adaptativo
          ctx.save();
          const textAngle = startAngle + anglePerSegment / 2;
          ctx.rotate(textAngle);

          const textX = radius * (isMobile ? 0.52 : 0.62);

          // [modificación] Capitaliza cada palabra
          const displayText = segment.text
            .split(" ")
            .map(
              (word: string) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");

          // [modificación] Disminuye tamaño de fuente hasta que quepa el texto (mínimo 8px para permitir texto más pequeño)
          let fontSizeLocal = baseFontSize;
          ctx.font = `400 ${fontSizeLocal}px "Marine-Regular", Arial, sans-serif`;
          while (
            ctx.measureText(displayText).width > radius * 0.75 &&
            fontSizeLocal > 8
          ) {
            fontSizeLocal -= 1;
            ctx.font = `400 ${fontSizeLocal}px "Marine-Regular", Arial, sans-serif`;
          }

          // [modificación] Texto destacado para segmento ganador
          if (highlightedSegment === i) {
            // [modificación] Texto ganador con color fuerte y sombra dorada (sin fondo pill)
            ctx.fillStyle = "#192A6E";
            ctx.shadowColor = "#FFD700";
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.font = `600 ${fontSizeLocal}px "Marine-Regular", Arial, sans-serif`; // [modificación] Font weight más grueso
            ctx.fillText(displayText, textX, 0);
          } else {
            // [modificación] Texto normal con sombra elegante
            ctx.fillStyle = getContrastYIQ(segment.color);
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillText(displayText, textX, 0);
          }
          
          ctx.restore();
        });
        ctx.restore();

        // Puntero más grande para TV 4K
        ctx.save();
        const pointerBaseHalfHeight = radius * (isMobile ? 0.10 : 0.12);
        const pointerTipX = centerX + radius - radius * 0.02;
        const pointerBaseX = centerX + radius + radius * 0.16;
        ctx.beginPath();
        ctx.moveTo(pointerBaseX, centerY - pointerBaseHalfHeight);
        ctx.lineTo(pointerTipX, centerY);
        ctx.lineTo(pointerBaseX, centerY + pointerBaseHalfHeight);
        ctx.closePath();
        ctx.fillStyle = "#192A6E";
        ctx.shadowColor = "rgba(0,0,0,0.37)";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();

        // Círculo central con gradiente más grande para TV 4K
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY,
          radius * (isMobile ? 0.12 : 0.14), // [modificación] Más grande para TV 4K
          0,
          2 * Math.PI
        );
        const gradientBg = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          radius * (isMobile ? 0.12 : 0.14)
        );
        gradientBg.addColorStop(0, "#50e9ff"); // celeste intenso
        gradientBg.addColorStop(0.6, "#2196f3"); // azul claro
        gradientBg.addColorStop(1, "#153e75"); // azul profundo
        ctx.fillStyle = gradientBg;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.7)"; // [modificación] Borde más visible
        ctx.lineWidth = 3; // [modificación] Borde más grueso para TV 4K
        ctx.stroke();
        ctx.restore();
      },
      [wheelSegments, anglePerSegment, highlightedSegment, isMobile, isDOMReady]
    );

    // --- [modificación] Ajuste de tamaño del canvas optimizado para TV 4K ---
    const handleResize = useCallback(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Siempre el tamaño máximo cuadrado posible dentro del contenedor
      let size = Math.min(containerWidth, containerHeight);

      // [modificación] Ajuste mínimos optimizados para TV 65" 4K (3840x2160) - tamaños más grandes
      if (isMobile) {
        size = Math.max(300, Math.min(size, 500));
      } else if (isTablet) {
        size = Math.max(450, Math.min(size, 700));
      } else {
        // [modificación] Para desktop/TV: tamaños mucho más grandes para 4K, especialmente para 55vh
        size = Math.max(800, Math.min(size, 2200)); // [modificación] Aumentado de 1000 a 2200 para soportar 55vh
      }

      // Asigna el size cuadrado
      if (canvas.width !== size || canvas.height !== size) {
        canvas.width = size;
        canvas.height = size;
      }
      // Dibuja sólo si no está girando
      if (!isSpinning && numSegments > 0) {
        drawRoulette(currentAngle, size);
      }
    }, [currentAngle, numSegments, isSpinning, isMobile, isTablet, drawRoulette]);

    useEffect(() => {
      if (!isDOMReady || !canUseDOM) return;
      
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [
      isDOMReady,
      canUseDOM,
      handleResize,
      isLandscape,
    ]);

    // --- Spin ---
    const spin = useCallback(() => {
      if (isSpinning || numSegments === 0 || !isDOMReady) return;
      setIsSpinning(true);
      setHighlightedSegment(null);
      
      // [modificación] Reproducir audio sincronizado
      if (audioRef.current && canUseDOM) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      
      const randomSpins = Math.floor(Math.random() * 5) + 8;
      const randomStopSegment = Math.floor(Math.random() * numSegments);
      const stopAngleOnWheel = randomStopSegment * anglePerSegment;
      
      // [modificación] Duración fija de 2424ms para sincronizar con el audio
      // El archivo wheel-spin.mp3 dura aproximadamente 2.42 segundos (2424ms)
      // Esta sincronización asegura que la animación termine exactamente cuando termina el sonido
      const AUDIO_DURATION_MS = 2424; // Duración exacta del archivo de audio
      
      animationConfigRef.current = {
        startTime: performance.now(),
        duration: AUDIO_DURATION_MS, // [modificación] Cambio de Math.random() * 2000 + 6000 a duración fija
        targetAngle: randomSpins * 2 * Math.PI + stopAngleOnWheel,
        animationFrameId: 0,
      };
      
      const spinAnimation = (timestamp: number) => {
        const config = animationConfigRef.current;
        const elapsedTime = timestamp - config.startTime;
        if (elapsedTime >= config.duration) {
          const finalEffectiveAngle = config.targetAngle % (2 * Math.PI);
          setCurrentAngle(finalEffectiveAngle);
          let winningAngle = 2 * Math.PI - (config.targetAngle % (2 * Math.PI));
          if (winningAngle >= 2 * Math.PI - 0.0001) winningAngle = 0;
          const winningIndex =
            Math.floor(winningAngle / anglePerSegment) % numSegments;
          setHighlightedSegment(winningIndex);
          
          if (canUseDOM && "vibrate" in navigator) {
            try {
              navigator.vibrate(200);
            } catch {}
          }
          
          setTimeout(() => {
            // [modificación] Log para verificar el índice del resultado del giro
            console.log("[RouletteWheel] spinAnimation finished. Setting lastSpinResultIndex:", winningIndex);
            setLastSpinResultIndex(winningIndex);
          }, 800);
          setIsSpinning(false);
          return;
        }
        const timeFraction = elapsedTime / config.duration;
        const easingProgress = customEasingFunction(timeFraction);
        const newAnimatedAngle = config.targetAngle * easingProgress;
        drawRoulette(newAnimatedAngle);
        animationConfigRef.current.animationFrameId =
          requestAnimationFrame(spinAnimation);
      };
      animationConfigRef.current.animationFrameId =
        requestAnimationFrame(spinAnimation);
    }, [isSpinning, numSegments, isDOMReady, canUseDOM, anglePerSegment, setLastSpinResultIndex, drawRoulette]);

    // Exponer método spin al padre
    useImperativeHandle(ref, () => ({
      spin: () => {
        if (!isSpinning && numSegments > 0 && isDOMReady) {
          spin();
        }
      },
    }), [isSpinning, numSegments, isDOMReady, spin]);

    // [modificación] No renderizar hasta que DOM esté listo
    if (!isDOMReady || !canUseDOM) {
      return (
        <div className="flex flex-col items-center justify-center w-full min-h-[400px]">
          <div className="text-white text-lg">Preparando ruleta...</div>
        </div>
      );
    }

    // --- Render ---
    return (
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        // [modificación] maxHeight evita desbordes, minHeight:0 soluciona problemas de flexbox
        className="flex flex-col items-center justify-center w-full"
        style={{
          maxHeight: "calc(100vh - 110px)",
          minHeight: 0,
        }}
      >
        <div
          className="relative w-full flex items-center justify-center"
          style={{
            height: "100%", // El canvas ajusta el tamaño cuadrado máximo posible
          }}
        >
          <canvas
            ref={canvasRef}
            className="rounded-full wheel-canvas touch-optimized"
            style={{
              width: "100%",
              height: "auto",
              maxWidth: "100%",
              display: "block",
            }}
            aria-label="Ruleta de selección de categoría"
            role="img"
          />
        </div>
      </motion.div>
    );
  }
);
RouletteWheel.displayName = "RouletteWheel";
export default RouletteWheel;
