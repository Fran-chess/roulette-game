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

// --- Funciones Helper (sin cambios) ---
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
function easeOutBounce(x: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (x < 1 / d1) {
    return n1 * x * x;
  } else if (x < 2 / d1) {
    return n1 * (x -= 1.5 / d1) * x + 0.75;
  } else if (x < 2.5 / d1) {
    return n1 * (x -= 2.25 / d1) * x + 0.9375;
  } else {
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }
}
function customEasingFunction(t: number): number {
  if (t < 0.7) {
    return t * t;
  } else {
    return 0.49 + easeOutBounce((t - 0.7) / 0.3) * 0.51;
  }
}
const mapQuestionsToSegments = (questions: Question[]) => {
  colorIndexGlobal = 0;
  return questions.map((q) => ({
    fillStyle: getRandomColor(),
    text: q.category || q.id,
    questionId: q.id,
  }));
};

// --- Componente principal ---
const RouletteWheel = forwardRef<{ spin: () => void }, RouletteWheelProps>(
  ({ questions }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
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
      if (!questions || questions.length === 0) return [];
      return mapQuestionsToSegments(questions);
    }, [questions]);
    const numSegments = wheelSegments.length;
    const anglePerSegment = numSegments > 0 ? (2 * Math.PI) / numSegments : 0;

    // Detectar dispositivo
    useEffect(() => {
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
    }, []);

    useEffect(() => {
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
    }, []);

    // --- [modificación] Ajuste de tamaño del canvas totalmente automático ---
    useEffect(() => {
      const handleResize = () => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Siempre el tamaño máximo cuadrado posible dentro del contenedor
        let size = Math.min(containerWidth, containerHeight);

        // Ajuste mínimos según dispositivo
        if (isMobile) {
          size = Math.max(220, Math.min(size, 400));
        } else if (isTablet) {
          size = Math.max(320, Math.min(size, 520));
        } else {
          size = Math.max(380, Math.min(size, 640));
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
      };

      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
      // eslint-disable-next-line
    }, [
      currentAngle,
      numSegments,
      isSpinning,
      isLandscape,
      isTablet,
      isMobile,
    ]);

    // --- [modificación] Dibujo recibe size explícito, nunca usa viewport directamente ---
    const drawRoulette = useCallback(
      (rotationAngle = 0, canvasSize?: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const size = canvasSize || canvas.width;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size * 0.48; // Siempre ajustado al cuadrado

        ctx.clearRect(0, 0, size, size);

        // [modificación] Fuente base más pequeña, para evitar overflow en títulos largos
        const baseFontSize = Math.max(14, radius * (isMobile ? 0.09 : 0.12));
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

        wheelSegments.forEach((segment, i) => {
          const startAngle = i * anglePerSegment;
          const endAngle = (i + 1) * anglePerSegment;

          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, radius, startAngle, endAngle);
          ctx.closePath();

          if (highlightedSegment === i) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fill();
            ctx.fillStyle = segment.fillStyle;
            ctx.globalAlpha = 0.7;
            ctx.fill();
            ctx.globalAlpha = 1.0;
          } else {
            ctx.fillStyle = segment.fillStyle;
            ctx.fill();
          }

          // Bordes mejorados
          ctx.strokeStyle = "rgba(255, 255, 255, 0.34)";
          ctx.lineWidth = 2;
          ctx.stroke();

          // [modificación] Renderizado de texto profesional y adaptativo
          ctx.save();
          ctx.fillStyle = getContrastYIQ(segment.fillStyle);
          const textAngle = startAngle + anglePerSegment / 2;
          ctx.rotate(textAngle);

          const textX = radius * (isMobile ? 0.52 : 0.62);

          // [modificación] Sombra elegante
          ctx.shadowColor = "rgba(0,0,0,0.33)";
          ctx.shadowBlur = 6;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;

          // [modificación] Capitaliza cada palabra
          const displayText = segment.text
            .split(" ")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");

          // [modificación] Disminuye tamaño de fuente hasta que quepa el texto (mínimo 10px)
          let fontSizeLocal = baseFontSize;
          ctx.font = `900 ${fontSizeLocal}px "Marine-Bold", Arial, sans-serif`;
          while (
            ctx.measureText(displayText).width > radius * 0.75 &&
            fontSizeLocal > 10
          ) {
            fontSizeLocal -= 1;
            ctx.font = `900 ${fontSizeLocal}px "Marine-Bold", Arial, sans-serif`;
          }

          // [modificación] Borde blanco para máxima legibilidad
          ctx.strokeStyle = "rgba(255,255,255,0.85)";
          ctx.lineWidth = 2;
          ctx.strokeText(displayText, textX, 0);

          ctx.fillText(displayText, textX, 0);
          ctx.restore();
        });
        ctx.restore();

        // Puntero
        ctx.save();
        const pointerBaseHalfHeight = radius * (isMobile ? 0.08 : 0.09);
        const pointerTipX = centerX + radius - radius * 0.02;
        const pointerBaseX = centerX + radius + radius * 0.14;
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
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // Círculo central con gradiente
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.11)";
        ctx.shadowBlur = 7;
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY,
          radius * (isMobile ? 0.09 : 0.11), // Más pequeño
          0,
          2 * Math.PI
        );
        const gradientBg = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          radius * (isMobile ? 0.09 : 0.11)
        );
        gradientBg.addColorStop(0, "#50e9ff"); // celeste intenso
        gradientBg.addColorStop(0.6, "#2196f3"); // azul claro
        gradientBg.addColorStop(1, "#153e75"); // azul profundo
        ctx.fillStyle = gradientBg;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.54)"; // Borde más notorio
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      },
      // eslint-disable-next-line
      [wheelSegments, anglePerSegment, highlightedSegment, isTablet, isMobile]
    );

    // Exponer método spin al padre
    useImperativeHandle(ref, () => ({
      spin: () => {
        if (!isSpinning && numSegments > 0) {
          spin();
        }
      },
    }));

    // --- Spin ---
    const spin = () => {
      if (isSpinning || numSegments === 0) return;
      setIsSpinning(true);
      setHighlightedSegment(null);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      const randomSpins = Math.floor(Math.random() * 5) + 8;
      const randomStopSegment = Math.floor(Math.random() * numSegments);
      const stopAngleOnWheel = randomStopSegment * anglePerSegment;
      animationConfigRef.current = {
        startTime: performance.now(),
        duration: Math.random() * 2000 + 6000,
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
          if ("vibrate" in navigator) {
            try {
              navigator.vibrate(200);
            } catch {}
          }
          setTimeout(() => {
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
    };

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
