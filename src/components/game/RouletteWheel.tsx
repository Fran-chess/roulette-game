// src/components/game/RouletteWheel.tsx
"use client";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useGameStore } from "@/store/gameStore";
import type { RouletteWheelProps, Question } from "@/types";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import React from "react";

// --- Funciones Helper (sin cambios) ---
const baseColors = [
  "#192A6E", // azul-intenso
  "#5ACCC1", // verde-salud
  "#40C0EF", // celeste-medio
  "#F2BD35", // amarillo-ds
  "#D5A7CD", // Rosado-lila
  // Repetición de colores pero en diferente orden para evitar colores consecutivos iguales
  "#5ACCC1", // verde-salud
  "#192A6E", // azul-intenso
  "#F2BD35", // amarillo-ds
  "#40C0EF", // celeste-medio
  "#D5A7CD", // Rosado-lila
]; // [modificación] Se utilizan los colores definidos en tailwind.config.ts

let colorIndexGlobal = 0;
function getRandomColor() {
  // [modificación] Función modificada para asegurar que no se repitan colores consecutivos
  const previousColorIndex = (colorIndexGlobal - 1 + baseColors.length) % baseColors.length;
  let nextColorIndex = colorIndexGlobal % baseColors.length;
  
  // Si solo hay un color en el array, no hay más opciones
  if (baseColors.length <= 1) {
    colorIndexGlobal++;
    return baseColors[0];
  }
  
  // Si el siguiente color sería igual al anterior, saltamos una posición
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
// --- Fin Funciones Helper ---

export default function RouletteWheel({ questions }: RouletteWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const setLastSpinResultIndex = useGameStore(
    (state) => state.setLastSpinResultIndex
  );
  const setGameState = useGameStore((state) => state.setGameState); // Para la transición

  const [isSpinning, setIsSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [highlightedSegment, setHighlightedSegment] = useState<number | null>(
    null
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [spinEffect, setSpinEffect] = useState("");

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

  useEffect(() => {
    try {
      const audio = new Audio("/sounds/wheel-spin.mp3");
      audio.preload = "auto";
      audio.addEventListener("error", (e) => {
        const mediaError = audio.error; // Es HTMLMediaElement
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

  const drawRoulette = useCallback(
    (rotationAngle = 0) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) * 0.92;

      if (radius <= 0) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `bold ${Math.max(
        12,
        radius * 0.09
      )}px "Nunito Sans", Arial, Helvetica, sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fillStyle = "#f0f0f0";
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

        ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.save();
        ctx.fillStyle = getContrastYIQ(segment.fillStyle);
        const textAngle = startAngle + anglePerSegment / 2;
        ctx.rotate(textAngle);
        const textX = radius * 0.6;

        if (ctx.fillStyle === "#FFFFFF") {
          ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
          ctx.shadowBlur = 3;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
        } else {
          ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
          ctx.shadowBlur = 2;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
        }
        ctx.fillText(segment.text.substring(0, 15), textX, 0);
        ctx.restore();
      });
      ctx.restore();

      // Puntero (asegúrate que estas son las coordenadas que te gustan)
      // Esta es la versión que tenías en el último código que me pasaste:
      ctx.save();
      const pointerBaseHalfHeight = radius * 0.08;
      const pointerTipX = centerX + radius - radius * 0.02;
      const pointerBaseX = centerX + radius + radius * 0.15;

      ctx.beginPath();
      ctx.moveTo(pointerBaseX, centerY - pointerBaseHalfHeight);
      ctx.lineTo(pointerTipX, centerY);
      ctx.lineTo(pointerBaseX, centerY + pointerBaseHalfHeight);
      ctx.closePath();

      ctx.fillStyle = "#333333";
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Círculo central
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.14, 0, 2 * Math.PI);
      ctx.fillStyle = "#4a4a4a";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.09, 0, 2 * Math.PI);
      ctx.fillStyle = "#606060";
      ctx.fill();
      const innerShineGradient = ctx.createRadialGradient(
        centerX - radius * 0.02,
        centerY - radius * 0.02,
        0,
        centerX,
        centerY,
        radius * 0.09
      );
      innerShineGradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
      innerShineGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.05)");
      innerShineGradient.addColorStop(1, "rgba(0, 0, 0, 0.05)");
      ctx.fillStyle = innerShineGradient;
      ctx.fill();
      ctx.restore();
    },
    [wheelSegments, anglePerSegment, highlightedSegment]
  );

  useEffect(() => {
    // ... (código de redimensionamiento sin cambios)
    const canvas = canvasRef.current;
    if (canvas) {
      const parentElement = canvas.parentElement;
      const containerWidth = parentElement ? parentElement.clientWidth : 500;
      const size = Math.max(
        400,
        Math.min(containerWidth * 1.0, window.innerHeight * 0.85)
      );
      if (canvas.width !== size || canvas.height !== size) {
        canvas.width = size;
        canvas.height = size;
      }
    }
    if (canvas && !isSpinning && numSegments > 0) {
      drawRoulette(currentAngle);
    }
  }, [currentAngle, numSegments, isSpinning, drawRoulette, questions]);

  const spin = () => {
    // ... (inicio de la función spin sin cambios)
    if (isSpinning || numSegments === 0) return;

    setIsSpinning(true);
    setHighlightedSegment(null);
    setSpinEffect("spin-effect"); // Este efecto puede ser el que da el "empujón" visual

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .catch((e) =>
          console.warn("AUDIO: Error reproduciendo audio de giro:", e)
        );
    }

    // ... (resto de la configuración de animación sin cambios)
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
        setSpinEffect("");

        let winningAngle = 2 * Math.PI - (config.targetAngle % (2 * Math.PI));
        if (winningAngle >= 2 * Math.PI - 0.0001) winningAngle = 0;
        const winningIndex =
          Math.floor(winningAngle / anglePerSegment) % numSegments;

        setHighlightedSegment(winningIndex);

        // MODIFICACIÓN: Sonido de victoria (si aún lo quieres, si no, elimínalo también)
        // try {
        //   const victorySound = new Audio("/sounds/win-sound.mp3");
        //   victorySound.play().catch(e => console.warn("AUDIO: Error reproduciendo audio de victoria:", e));
        // } catch (error) {
        //   console.warn("AUDIO: Error al intentar audio de victoria:", error);
        // }

        // MODIFICACIÓN: Confeti eliminado
        // setShowConfetti(true);

        // MODIFICACIÓN: Ajuste de tiempos para la transición a la pregunta
        // El timeout principal ahora solo se encarga de la lógica post-giro,
        // la transición visual a la pregunta se maneja idealmente en el componente padre.
        setTimeout(() => {
          setLastSpinResultIndex(winningIndex); // Notificar al store de Zustand
          // La transición a 'question' se hará a través del store, lo que desmontará este componente
          // o lo ocultará, permitiendo que QuestionDisplay aparezca con su propia animación.
          // No es necesario setIsSpinning(false) aquí si el componente se va a desmontar.
          // Si no se desmonta, sí necesitarías setIsSpinning(false);

          // Este timeout para limpiar el resaltado ya no sería necesario aquí si la vista cambia.
          // setTimeout(() => {
          //   // setShowConfetti(false); // Confeti eliminado
          //   setHighlightedSegment(null);
          // }, 1000); // Reducido el tiempo de resaltado si la transición es rápida
        }, 800); // Tiempo reducido para mostrar el segmento ganador antes de que el store cambie el estado y la UI. Prueba este valor.

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

  // MODIFICACIÓN: Función renderConfetti eliminada o comentada
  // const renderConfetti = () => { /* ... */ };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      // className="flex flex-col items-center justify-center p-1 md:p-2 w-full h-full"
      // Ajuste para que la ruleta tenga más espacio si el botón de girar está pegado
      className="flex flex-col items-center justify-around p-1 md:p-2 w-full h-full"
    >
      <div className="relative mb-4 md:mb-6">
        {" "}
        {/* Contenedor de la ruleta */}
        <div className={`wheel-container ${spinEffect}`}>
          <canvas
            ref={canvasRef}
            className="rounded-full shadow-xl wheel-canvas"
          ></canvas>
        </div>
      </div>
      <motion.div
      // No es necesario whileHover y whileTap aquí si tu componente Button ya los maneja.
      // Si Button es un componente simple sin motion, entonces sí mantenlos.
      // Asumiendo que tu Button SÍ usa motion (como en el código que me pasaste antes):
      >
        <Button
          onClick={spin}
          disabled={isSpinning || numSegments === 0}
          // La clase de tu botón ya tiene los efectos hover y active
          className={`bg-verde-salud hover:bg-opacity-80 text-white text-lg md:text-xl py-3 px-6 md:py-4 md:px-8 rounded-full shadow-lg transition-all duration-300 
            ${
              isSpinning || numSegments === 0
                ? "opacity-70 cursor-not-allowed"
                : "hover:shadow-xl active:shadow-md"
            }`}
        >
          {isSpinning
            ? "Girando..."
            : numSegments > 0
            ? "¡GIRAR!"
            : "Cargando..."}
        </Button>
      </motion.div>

      
    </motion.div>
  );
}
