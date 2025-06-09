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
import { tvLogger } from "@/utils/tvLogger";

// Interfaz para segmentos de la ruleta
interface WheelSegment {
  text: string;
  color: string;
  questions: Question[];
}

// --- Funciones Helper ---
// Paleta de colores oficial de DarSalud
const rouletteColors = [
  "#192A6E", // azul-intenso (reservado para "Dar Salud")
  "#5ACCC1", // verde-salud
  "#40C0EF", // celeste-medio
  "#F2BD35", // amarillo-ds
  "#D5A7CD", // rosado-lila
];

// Mapeo específico para categorías solicitadas
const specificCategoryColors: { [key: string]: string } = {
  "Dar Salud": "#192A6E",          // azul-intenso (EXCLUSIVO para Dar Salud)
  "Bacterias": "#40C0EF",          // celeste-medio
  "Factores de riesgo": "#F2BD35", // amarillo-ds
};

// Función para asignar colores evitando adyacencia repetida
function assignColorsToSegments(segments: { text: string; questions: Question[] }[]): WheelSegment[] {
  if (!segments || segments.length === 0) return [];
  
  const result: WheelSegment[] = [];
  const usedColors: string[] = [];
  
  // Colores disponibles (excluyendo azul intenso que es exclusivo de "Dar Salud")
  const availableColorsForOthers = rouletteColors.filter(color => color !== "#192A6E");
  
  segments.forEach((segment, index) => {
    const normalizedCategory = segment.text === "Dar Salud II" ? "Dar Salud" : segment.text;
    
    // Si tiene color específico definido, usarlo
    if (specificCategoryColors[normalizedCategory]) {
      result.push({
        text: segment.text,
        color: specificCategoryColors[normalizedCategory],
        questions: segment.questions
      });
      usedColors.push(specificCategoryColors[normalizedCategory]);
      return;
    }

    // Para todas las demás categorías, usar los otros colores evitando adyacencia
    let availableColors = availableColorsForOthers.filter(color => {
      const prevColor = index > 0 ? usedColors[index - 1] : null;
      const nextSegment = segments[index + 1];
      const nextNormalizedCategory = nextSegment ? (nextSegment.text === "Dar Salud II" ? "Dar Salud" : nextSegment.text) : null;
      const nextColor = nextNormalizedCategory && specificCategoryColors[nextNormalizedCategory] ? specificCategoryColors[nextNormalizedCategory] : null;
      
      // También verificar el color del segmento que vendrá después del siguiente (para mejor distribución)
      const nextNextSegment = segments[index + 2];
      const nextNextColor = nextNextSegment && usedColors.length > index + 1 ? usedColors[index + 1] : null;
      
      return color !== prevColor && color !== nextColor && color !== nextNextColor;
    });

    // Si no hay colores disponibles, relajar restricciones gradualmente
    if (availableColors.length === 0) {
      availableColors = availableColorsForOthers.filter(color => {
        const prevColor = index > 0 ? usedColors[index - 1] : null;
        return color !== prevColor;
      });
    }
    
    // En último caso, usar cualquier color excepto azul intenso
    if (availableColors.length === 0) {
      availableColors = availableColorsForOthers;
    }
    
    // Seleccionar color de manera más inteligente para mejor distribución
    let selectedColor: string;
    
    if (availableColors.length === 1) {
      selectedColor = availableColors[0];
    } else {
      // Usar índice del segmento para mejor distribución circular
      const colorIndex = index % availableColors.length;
      selectedColor = availableColors[colorIndex];
    }
    
    result.push({
      text: segment.text,
      color: selectedColor,
      questions: segment.questions
    });
    usedColors.push(selectedColor);
  });
  
  return result;
}

function getContrastYIQ(hexcolor: string): string {
  hexcolor = hexcolor.replace("#", "");
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 135 ? "#1E1E1E" : "#FFFFFF";
}

// Función de easing para simular desaceleración realista de ruleta - MEJORADA para mayor fluidez
function customEasingFunction(t: number): number {
  // Curva de easing más suave y realista que simula mejor la física de una ruleta real
  // Combina una función exponencial con una cúbica para transición ultra fluida
  if (t < 0.5) {
    return 2 * t * t * t; // Aceleración inicial suave
  } else {
    return 1 - Math.pow(-2 * t + 2, 4) / 2; // Desaceleración progresiva más realista
  }
}

// Función para agrupar preguntas por categoría y crear configuración de ruleta
function createRouletteSegments(questions: Question[]): WheelSegment[] {
  if (!questions || questions.length === 0) return [];

  // Agrupar preguntas por categoría
  const groupedQuestions: { [key: string]: Question[] } = {};
  
  questions.forEach(question => {
    const normalizedCategory = question.category === "Dar Salud II" ? "Dar Salud" : question.category;
    
    if (!groupedQuestions[normalizedCategory]) {
      groupedQuestions[normalizedCategory] = [];
    }
    groupedQuestions[normalizedCategory].push(question);
  });

  const categories = Object.keys(groupedQuestions);
  const segmentsWithoutColors: { text: string; questions: Question[] }[] = [];
  
  // Agregar todas las categorías normales
  categories.forEach(category => {
    if (category !== "Dar Salud") {
      segmentsWithoutColors.push({
        text: category,
        questions: groupedQuestions[category]
      });
    }
  });

  // Agregar "Dar Salud" dos veces en posiciones no consecutivas
  if (groupedQuestions["Dar Salud"]) {
    const darSaludQuestions = groupedQuestions["Dar Salud"];
    const totalSegments = segmentsWithoutColors.length + 2;
    const firstPosition = Math.floor(totalSegments / 3);
    const secondPosition = Math.floor((totalSegments * 2) / 3);
    
    segmentsWithoutColors.splice(firstPosition, 0, {
      text: "Dar Salud",
      questions: darSaludQuestions
    });
    
    segmentsWithoutColors.splice(secondPosition + 1, 0, {
      text: "Dar Salud",
      questions: darSaludQuestions
    });
  }

  return assignColorsToSegments(segmentsWithoutColors);
}

// --- Componente principal ---
const RouletteWheel = forwardRef<{ spin: () => void }, RouletteWheelProps>(
  ({ questions, onSpinStateChange }, ref) => {
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
  const [highlightedSegment, setHighlightedSegment] = useState<number | null>(null);
  // [NUEVO] Estado para animación suave del segmento ganador
  const [winnerGlowIntensity, setWinnerGlowIntensity] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

    // [NUEVO] Notificar cambios en el estado de spinning
    useEffect(() => {
      onSpinStateChange?.(isSpinning);
    }, [isSpinning, onSpinStateChange]);

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
      const segments = createRouletteSegments(questions);
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
          tvLogger.warn(
            "AUDIO: No se pudo cargar el audio de giro:",
            mediaError
              ? `${mediaError.code} - ${mediaError.message}`
              : "Unknown error"
          );
        });
        audioRef.current = audio;
      } catch (error) {
        tvLogger.warn("AUDIO: Error al inicializar el objeto Audio:", error);
      }
      return () => {};
    }, [canUseDOM]);

    // Dibujo de ruleta con borde casino y LEDs animados
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

        // Fuente base optimizada para TV 4K - reducido para letras más pequeñas
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

          // Renderizado mejorado para segmento destacado
          if (highlightedSegment === i) {
            // [NUEVO] Glow suave y fluido para el segmento ganador
            const glowAlpha = 0.3 + winnerGlowIntensity * 0.4; // Intensidad base + variación suave
            const shadowBlurIntensity = 20 + winnerGlowIntensity * 15; // Variación del blur
            
            // Glow exterior dorado brillante con animación suave
            ctx.save();
            ctx.shadowColor = `rgba(255, 215, 0, ${glowAlpha})`;
            ctx.shadowBlur = shadowBlurIntensity;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.fillStyle = segment.color;
            ctx.fill();
            
            // Borde exterior grueso y blanco como aureola con intensidad variable
            ctx.lineWidth = 6 + winnerGlowIntensity * 4; // Grosor variable más suave
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 + winnerGlowIntensity * 0.3})`;
            ctx.shadowColor = `rgba(255, 215, 0, ${glowAlpha * 0.8})`;
            ctx.shadowBlur = shadowBlurIntensity * 0.7;
            ctx.stroke();
            ctx.restore();
          } else {
            // Segmento normal sin efectos especiales
            ctx.fillStyle = segment.color;
            ctx.fill();
          }

          // Renderizado de texto profesional y adaptativo
          ctx.save();
          const textAngle = startAngle + anglePerSegment / 2;
          ctx.rotate(textAngle);

          const textX = radius * (isMobile ? 0.52 : 0.62);

          // Capitaliza cada palabra
          const displayText = segment.text
            .split(" ")
            .map(
              (word: string) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");

          // Disminuye tamaño de fuente hasta que quepa el texto (mínimo 8px para permitir texto más pequeño)
          let fontSizeLocal = baseFontSize;
          ctx.font = `400 ${fontSizeLocal}px "Marine-Regular", Arial, sans-serif`;
          while (
            ctx.measureText(displayText).width > radius * 0.75 &&
            fontSizeLocal > 8
          ) {
            fontSizeLocal -= 1;
            ctx.font = `400 ${fontSizeLocal}px "Marine-Regular", Arial, sans-serif`;
          }

          // Texto destacado para segmento ganador
          if (highlightedSegment === i) {
            // [NUEVO] Texto ganador con efecto de brillo suave y fluido
            const textGlowAlpha = 0.6 + winnerGlowIntensity * 0.4; // Alpha variable para el texto
            const textBlurIntensity = 15 + winnerGlowIntensity * 10; // Blur variable más suave
            
            ctx.fillStyle = "#FFFFFF"; // Texto blanco brillante
            
            // Múltiples capas de glow para efecto de brillo suave
            // Capa 1: Glow dorado exterior con intensidad variable
            ctx.shadowColor = `rgba(255, 215, 0, ${textGlowAlpha})`;
            ctx.shadowBlur = textBlurIntensity;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.font = `600 ${fontSizeLocal}px "Marine-Regular", Arial, sans-serif`;
            ctx.fillText(displayText, textX, 0);
            
            // Capa 2: Glow blanco interior para brillo con intensidad variable
            ctx.shadowColor = `rgba(255, 255, 255, ${textGlowAlpha * 0.8})`;
            ctx.shadowBlur = textBlurIntensity * 0.6;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.fillText(displayText, textX, 0);
            
            // Capa 3: Texto final con brillo amarillo-blanco suave
            ctx.shadowColor = `rgba(255, 255, 153, ${textGlowAlpha * 0.7})`;
            ctx.shadowBlur = textBlurIntensity * 0.3;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(displayText, textX, 0);
          } else {
            // Texto normal con sombra elegante
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

        // [MEJORADO] Puntero ultra visible con glow y sombras múltiples - SIN animación de rebote para mayor fluidez
        ctx.save();
        const pointerBaseHalfHeight = radius * (isMobile ? 0.10 : 0.12);
        const pointerTipX = centerX + radius - radius * 0.02;
        const pointerBaseX = centerX + radius + radius * 0.16;
        
        // [NUEVO] Glow pulsante adicional cuando no está girando - MÁS LENTO Y SUAVE
        if (!isSpinning) {
          const pulseIntensity = 0.5 + 0.3 * Math.sin(Date.now() * 0.0015); // Pulso más lento y suave
          
          // Glow exterior pulsante
          ctx.shadowColor = "#FFD700";
          ctx.shadowBlur = 35 + pulseIntensity * 15;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.beginPath();
          ctx.moveTo(pointerBaseX, centerY - pointerBaseHalfHeight);
          ctx.lineTo(pointerTipX, centerY);
          ctx.lineTo(pointerBaseX, centerY + pointerBaseHalfHeight);
          ctx.closePath();
          ctx.fillStyle = `rgba(255, 215, 0, ${0.2 + pulseIntensity * 0.3})`;
          ctx.fill();
        }
        
        // [NUEVO] CAPA 1: Glow exterior ultra brillante
        ctx.shadowColor = "#FFD700"; // Dorado brillante
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.beginPath();
        ctx.moveTo(pointerBaseX, centerY - pointerBaseHalfHeight);
        ctx.lineTo(pointerTipX, centerY);
        ctx.lineTo(pointerBaseX, centerY + pointerBaseHalfHeight);
        ctx.closePath();
        ctx.fillStyle = "#192A6E";
        ctx.fill();
        
        // [NUEVO] CAPA 2: Sombra profunda debajo del puntero
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 8;
        ctx.shadowOffsetY = 12;
        ctx.beginPath();
        ctx.moveTo(pointerBaseX, centerY - pointerBaseHalfHeight);
        ctx.lineTo(pointerTipX, centerY);
        ctx.lineTo(pointerBaseX, centerY + pointerBaseHalfHeight);
        ctx.closePath();
        ctx.fillStyle = "#192A6E";
        ctx.fill();
        
        // [NUEVO] CAPA 3: Puntero principal con gradiente
        ctx.shadowColor = "rgba(0, 0, 0, 0)"; // Sin sombra para esta capa
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Gradiente radial para el puntero
        const pointerGradient = ctx.createLinearGradient(
          pointerTipX, centerY - pointerBaseHalfHeight,
          pointerBaseX, centerY + pointerBaseHalfHeight
        );
        pointerGradient.addColorStop(0, "#40C0EF"); // celeste brillante en la punta
        pointerGradient.addColorStop(0.5, "#192A6E"); // azul DarSalud en el medio
        pointerGradient.addColorStop(1, "#0D1B3C"); // azul muy oscuro en la base
        
        ctx.beginPath();
        ctx.moveTo(pointerBaseX, centerY - pointerBaseHalfHeight);
        ctx.lineTo(pointerTipX, centerY);
        ctx.lineTo(pointerBaseX, centerY + pointerBaseHalfHeight);
        ctx.closePath();
        ctx.fillStyle = pointerGradient;
        ctx.fill();
        
        // [NUEVO] CAPA 4: Borde brillante con glow
        ctx.strokeStyle = "#5ACCC1"; // Verde-salud brillante
        ctx.lineWidth = isMobile ? 4 : 6;
        ctx.shadowColor = "#5ACCC1";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.stroke();
        
        // [NUEVO] CAPA 5: Borde interior blanco brillante
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = isMobile ? 2 : 3;
        ctx.shadowColor = "#FFFFFF";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.stroke();
        
        // [NUEVO] CAPA 6: Punto de luz en la punta del puntero
        ctx.beginPath();
        ctx.arc(pointerTipX, centerY, radius * 0.015, 0, 2 * Math.PI);
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fill();
        
        ctx.restore();

        // Círculo central tecnológico con efectos múltiples
        const centralRadius = radius * (isMobile ? 0.12 : 0.14);
        
        // CAPA 1: Sombra exterior profunda para relieve
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 25;
        ctx.shadowOffsetY = 8;
        ctx.shadowOffsetX = 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, centralRadius, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; // Sombra base
        ctx.fill();
        ctx.restore();

        // CAPA 2: Base del círculo con degradé tecnológico
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, centralRadius, 0, 2 * Math.PI);
        
        // Degradé radial tecnológico más sofisticado
        const mainGradient = ctx.createRadialGradient(
          centerX - centralRadius * 0.3, // Offset para simular iluminación
          centerY - centralRadius * 0.3,
          0,
          centerX,
          centerY,
          centralRadius
        );
        mainGradient.addColorStop(0, "#40C0EF"); // celeste brillante (centro)
        mainGradient.addColorStop(0.3, "#2196F3"); // azul medio
        mainGradient.addColorStop(0.7, "#192A6E"); // azul DarSalud
        mainGradient.addColorStop(1, "#0D1B3C"); // azul muy oscuro (borde)
        
        ctx.fillStyle = mainGradient;
        ctx.fill();
        ctx.restore();

        // CAPA 3: Highlight superior para efecto relieve
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          centerX - centralRadius * 0.2,
          centerY - centralRadius * 0.25,
          centralRadius * 0.6,
          0,
          2 * Math.PI
        );
        
        const highlightGradient = ctx.createRadialGradient(
          centerX - centralRadius * 0.2,
          centerY - centralRadius * 0.25,
          0,
          centerX - centralRadius * 0.2,
          centerY - centralRadius * 0.25,
          centralRadius * 0.6
        );
        highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
        highlightGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
        highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        
        ctx.fillStyle = highlightGradient;
        ctx.fill();
        ctx.restore();

        // CAPA 4: Reflejo tipo vidrio (parte superior)
        ctx.save();
        ctx.beginPath();
        // Crear un arco en la mitad superior para simular reflejo
        ctx.arc(centerX, centerY, centralRadius * 0.85, Math.PI, 2 * Math.PI);
        ctx.closePath();
        
        const glassGradient = ctx.createLinearGradient(
          centerX,
          centerY - centralRadius * 0.85,
          centerX,
          centerY
        );
        glassGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
        glassGradient.addColorStop(0.6, "rgba(255, 255, 255, 0.1)");
        glassGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        
        ctx.fillStyle = glassGradient;
        ctx.fill();
        ctx.restore();

        // CAPA 5: Borde brillante tecnológico multicapa
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, centralRadius, 0, 2 * Math.PI);
        
        // Borde exterior brillante
        ctx.strokeStyle = "#5ACCC1"; // Verde-salud brillante
        ctx.lineWidth = isMobile ? 4 : 6;
        ctx.shadowColor = "#5ACCC1";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.stroke();
        ctx.restore();

        // CAPA 6: Borde interior metálico
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, centralRadius - (isMobile ? 2 : 3), 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = isMobile ? 2 : 3;
        ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();


      },
      [wheelSegments, anglePerSegment, highlightedSegment, isMobile, isDOMReady, isSpinning, winnerGlowIntensity]
    );

    // Ajuste de tamaño del canvas optimizado para TV 4K
    const handleResize = useCallback(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Siempre el tamaño máximo cuadrado posible dentro del contenedor
      let size = Math.min(containerWidth, containerHeight);

      // Ajuste mínimos optimizados para TV 65" 4K (3840x2160) - tamaños más grandes
      if (isMobile) {
        size = Math.max(300, Math.min(size, 500));
      } else if (isTablet) {
        size = Math.max(450, Math.min(size, 700));
      } else {
        // Para desktop/TV: tamaños mucho más grandes para 4K, especialmente para 55vh
        size = Math.max(800, Math.min(size, 2200)); // Aumentado de 1000 a 2200 para soportar 55vh
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

    // [NUEVO] Efecto para mantener el glow pulsante del puntero cuando no está girando
    useEffect(() => {
      if (!isSpinning && numSegments > 0 && isDOMReady) {
        let animationId: number;
        
        const pulsePointer = () => {
          drawRoulette(currentAngle);
          animationId = requestAnimationFrame(pulsePointer);
        };
        
        // Iniciar el pulso solo si no hay animación activa
        const timeoutId = setTimeout(() => {
          animationId = requestAnimationFrame(pulsePointer);
        }, 100);
        
        return () => {
          clearTimeout(timeoutId);
          if (animationId) {
            cancelAnimationFrame(animationId);
          }
        };
      }
    }, [isSpinning, numSegments, isDOMReady, currentAngle, drawRoulette]);

    // [NUEVO] Efecto para animación suave del segmento ganador - MÁS LENTO Y FLUIDO
    useEffect(() => {
      if (highlightedSegment !== null && !isSpinning) {
        let animationId: number;
        let startTime: number | null = null;
        
        const animateWinnerGlow = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          
          // Tiempo transcurrido en segundos - MUCHO MÁS LENTO para suavidad
          const elapsed = (timestamp - startTime) * 0.0008; // Reducido de 0.003 a 0.0008 para 4x más lento
          
          // Función sinusoidal suave para el glow - MÁS FLUIDA
          const glowValue = 0.5 + 0.5 * Math.sin(elapsed);
          
          // Aplicar curva de easing para transiciones ultra suaves
          const easedGlow = 0.3 + 0.7 * (Math.sin(glowValue * Math.PI - Math.PI/2) + 1) / 2;
          
          setWinnerGlowIntensity(easedGlow);
          
          // Redibujar el canvas con la nueva intensidad
          drawRoulette(currentAngle);
          
          animationId = requestAnimationFrame(animateWinnerGlow);
        };
        
        animationId = requestAnimationFrame(animateWinnerGlow);
        
        return () => {
          if (animationId) {
            cancelAnimationFrame(animationId);
          }
        };
      } else {
        // Resetear la intensidad cuando no hay segmento ganador
        setWinnerGlowIntensity(0);
      }
    }, [highlightedSegment, isSpinning, currentAngle, drawRoulette]);

    // Spin - OPTIMIZADO para mayor fluidez: sin rebote del puntero, easing mejorado, duración variable
    const spin = useCallback(() => {
      if (isSpinning || numSegments === 0 || !isDOMReady) return;
      setIsSpinning(true);
      setHighlightedSegment(null);
      
      // Reproducir audio sincronizado
      if (audioRef.current && canUseDOM) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      
      const randomSpins = Math.floor(Math.random() * 5) + 8;
      const randomStopSegment = Math.floor(Math.random() * numSegments);
      const stopAngleOnWheel = randomStopSegment * anglePerSegment;
      
      // Duración optimizada para mayor fluidez y realismo - ligera variabilidad para naturalidad
      // Aumentada ligeramente para permitir una desaceleración más suave y realista
      const BASE_DURATION_MS = 2800; // Duración base más larga para mayor fluidez
      const DURATION_VARIATION = 400; // Variación aleatoria para mayor realismo
      const finalDuration = BASE_DURATION_MS + (Math.random() * DURATION_VARIATION - DURATION_VARIATION / 2);
      
      animationConfigRef.current = {
        startTime: performance.now(),
        duration: finalDuration, // Duración optimizada para mayor fluidez
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
          const winningSegmentIndex =
            Math.floor(winningAngle / anglePerSegment) % numSegments;
          setHighlightedSegment(winningSegmentIndex);
          
          if (canUseDOM && "vibrate" in navigator) {
            try {
              navigator.vibrate(200);
            } catch {}
          }
          
          setTimeout(() => {
            // Seleccionar una pregunta aleatoria del segmento ganador
            const winningSegment = wheelSegments[winningSegmentIndex];
            if (winningSegment && winningSegment.questions.length > 0) {
              const randomQuestionIndex = Math.floor(Math.random() * winningSegment.questions.length);
              const selectedQuestion = winningSegment.questions[randomQuestionIndex];
              
              // Encontrar el índice de esta pregunta en el array original de preguntas
              const questionIndex = questions?.findIndex(q => q.id === selectedQuestion.id) ?? -1;
              
              tvLogger.game("[RouletteWheel] Segmento ganador:", winningSegment.text);
              tvLogger.game("[RouletteWheel] Pregunta seleccionada:", selectedQuestion.category, "ID:", selectedQuestion.id);
              tvLogger.game("[RouletteWheel] Índice de pregunta en array original:", questionIndex);
              
              setLastSpinResultIndex(questionIndex);
            }
          }, 600); // Reducido de 800ms a 600ms para mayor fluidez en la transición
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
    }, [isSpinning, numSegments, isDOMReady, canUseDOM, anglePerSegment, setLastSpinResultIndex, drawRoulette, wheelSegments, questions]);

    // Exponer método spin al padre
    useImperativeHandle(ref, () => ({
      spin: () => {
        if (!isSpinning && numSegments > 0 && isDOMReady) {
          spin();
        }
      },
    }), [isSpinning, numSegments, isDOMReady, spin]);

    // No renderizar hasta que DOM esté listo
    if (!isDOMReady || !canUseDOM) {
      return (
        <div className="flex flex-col items-center justify-center w-full min-h-[400px]">
          <div className="text-white text-lg">Preparando ruleta...</div>
        </div>
      );
    }

    // Render
    return (
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        // maxHeight evita desbordes, minHeight:0 soluciona problemas de flexbox
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
