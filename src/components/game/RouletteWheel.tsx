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
  memo,
} from "react";
import { useGameStore } from "@/store/gameStore";
import type { RouletteWheelProps, Question } from "@/types";
import { motion } from "framer-motion";
import React from "react";
import { useDOMSafe } from "@/lib/hooks/useSSRSafe";
import { tvLogger } from "@/utils/tvLogger";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

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
  "Dar Salud": "#192A6E",              // azul-intenso (EXCLUSIVO para Dar Salud)
  "Prevención": "#5ACCC1",             // verde-salud
  "Criterios clínicos": "#40C0EF",     // celeste-medio
  "Cuidado interdisciplinario": "#F2BD35", // amarillo-ds
  "Ética y derechos": "#D5A7CD",       // rosado-lila
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

// --- Componente principal (con React.memo) ---
const RouletteWheel = memo(forwardRef<{ spin: () => void }, RouletteWheelProps>(
  ({ questions, onSpinStateChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { isDOMReady, canUseDOM } = useDOMSafe();
    
    const setLastSpinResultIndex = useGameStore(
      (state) => state.setLastSpinResultIndex
    );
    // [NUEVO] Hooks para sistema de memoria de giros
    const addRecentSpinSegment = useGameStore(
      (state) => state.addRecentSpinSegment
    );
    const recentSpinSegments = useGameStore(
      (state) => state.recentSpinSegments
    );

    // Device detection centralizado
    const device = useDeviceDetection();
    
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
      plannedSegment: 0,
    });

    const wheelSegments = useMemo(() => {
      if (!questions || questions.length === 0) {
        return [];
      }
      const segments = createRouletteSegments(questions);
      return segments;
    }, [questions]);

    // Memoizar valores derivados pesados
    const memoizedValues = useMemo(() => ({
      numSegments: wheelSegments.length,
      anglePerSegment: wheelSegments.length > 0 ? (2 * Math.PI) / wheelSegments.length : 0
    }), [wheelSegments.length]);
    
    const { numSegments, anglePerSegment } = memoizedValues;
    


    useEffect(() => {
      if (!canUseDOM) return;
      
      let audio: HTMLAudioElement | null = null;
      const handleAudioError = () => {
        const mediaError = audio?.error;
        tvLogger.warn(
          "AUDIO: No se pudo cargar el audio de giro:",
          mediaError
            ? `${mediaError.code} - ${mediaError.message}`
            : "Unknown error"
        );
      };
      
      try {
        audio = new Audio("/sounds/wheel-spin.mp3");
        audio.preload = "auto";
        audio.addEventListener("error", handleAudioError);
        audioRef.current = audio;
      } catch (error) {
        tvLogger.warn("AUDIO: Error al inicializar el objeto Audio:", error);
      }
      
      return () => {
        if (audio) {
          audio.removeEventListener("error", handleAudioError);
        }
      };
    }, [canUseDOM]);

    // Dibujo de ruleta con borde casino y LEDs animados
    const drawRoulette = useCallback(
      (rotationAngle = 0, canvasSize?: number) => {
        const canvas = canvasRef.current;
        if (!canvas || !isDOMReady) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const size = canvasSize || Math.min(canvas.width, canvas.height);
        // Radio balanceado: grande pero con espacio para el borde
        const radius = size * 0.45; // Aumentado de 0.42 a 0.45 para más presencia
        
        // [RESTORED] Centrado óptimo como estaba funcionando bien
        const pointerExtension = radius * 0.12;
        const centerX = canvas.width / 2; // Centrado horizontal
        const centerY = (canvas.height + pointerExtension) / 2; // Centrado considerando espacio del puntero

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // [MEJORADO] Fuente base significativamente aumentada y proporcional
        let baseFontSize;
        if (device.isTabletPortrait) {
          // Tablets verticales: fuente mucho más grande y proporcional
          baseFontSize = Math.max(24, Math.min(radius * 0.20, device.dimensions.width * 0.055));
        } else if (device.type === 'tablet' && !device.isTabletPortrait) {
          // Tablets horizontales: fuente optimizada y aumentada
          baseFontSize = Math.max(28, Math.min(radius * 0.16, device.dimensions.width * 0.04));
        } else if (device.type === 'mobile') {
          // Móviles: fuente proporcional al radio
          baseFontSize = Math.max(22, radius * 0.12);
        } else {
          // Desktop/TV: fuente mucho más grande y proporcional
          baseFontSize = Math.max(32, radius * 0.16);
        }
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
                          const shadowBlurIntensity = device.isTabletPortrait ? 15 + winnerGlowIntensity * 10 : 20 + winnerGlowIntensity * 15; // [NUEVO] Ajuste para tablets verticales
            
            // Glow exterior dorado brillante con animación suave
            ctx.save();
            ctx.shadowColor = `rgba(255, 215, 0, ${glowAlpha})`;
            ctx.shadowBlur = shadowBlurIntensity;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.fillStyle = segment.color;
            ctx.fill();
            
            // Borde exterior grueso y blanco como aureola con intensidad variable
                          ctx.lineWidth = device.isTabletPortrait ? 4 + winnerGlowIntensity * 2 : 6 + winnerGlowIntensity * 4; // [NUEVO] Grosor ajustado para tablets verticales
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

          // Renderizado de texto simple y funcional
          ctx.save();
          const textAngle = startAngle + anglePerSegment / 2;
          ctx.rotate(textAngle);

          // Posición de texto centrada en el segmento
          let textX;
          if (device.isTabletPortrait) {
            textX = radius * 0.60;
          } else if (device.type === 'tablet' && !device.isTabletPortrait) {
            textX = radius * 0.58;
          } else if (device.type === 'mobile') {
            textX = radius * 0.52;
          } else {
            textX = radius * 0.62;
          }

          // Capitaliza cada palabra
          const displayText = segment.text
            .split(" ")
            .map(
              (word: string) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");

          // [CORREGIDO] Función de salto de línea inteligente mejorada
          const wrapText = (text: string, maxWidth: number): string[] => {
            const words = text.split(' ');
            
            // Si es texto muy corto (1 palabra), no hacer salto de línea
            if (words.length === 1) return [text];
            
            // Para textos de 2 palabras, solo dividir si es realmente necesario
            if (words.length === 2) {
              const fullTextWidth = ctx.measureText(text).width;
              // Si está muy cerca del límite (más del 85%), dividir
              if (fullTextWidth > maxWidth * 0.85) {
                return words; // Cada palabra en su línea
              } else {
                return [text]; // Mantener en una línea
              }
            }
            
            // Para textos de 3+ palabras, aplicar lógica más agresiva
            const fullTextWidth = ctx.measureText(text).width;
            
            // Si el texto ocupa más del 75% del ancho disponible, dividir
            if (fullTextWidth > maxWidth * 0.75) {
              const lines: string[] = [];
              let currentLine = '';
              
              for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const testWidth = ctx.measureText(testLine).width;
                
                if (testWidth <= maxWidth || currentLine === '') {
                  currentLine = testLine;
                } else {
                  lines.push(currentLine);
                  currentLine = word;
                }
              }
              
              if (currentLine) {
                lines.push(currentLine);
              }
              
              return lines;
            }
            
            // Si no necesita división, mantener en una línea  
            return [text];
          };

          // [MEJORADO] Función para renderizar texto con letter-spacing
          const drawTextWithLetterSpacing = (text: string, x: number, y: number, spacing: number = 0.5) => {
            if (spacing <= 0) {
              ctx.fillText(text, x, y);
              return;
            }
            
            const chars = text.split('');
            const totalWidth = chars.reduce((width, char, index) => {
              return width + ctx.measureText(char).width + (index < chars.length - 1 ? spacing : 0);
            }, 0);
            
            let currentX = x - totalWidth / 2; // Centrar el texto
            
            chars.forEach((char) => {
              ctx.fillText(char, currentX + ctx.measureText(char).width / 2, y);
              currentX += ctx.measureText(char).width + spacing;
            });
          };

          // Sistema de fuente mejorado
          let fontSizeLocal = baseFontSize;
          ctx.font = `500 ${fontSizeLocal}px "Marine-Regular", Arial, sans-serif`;
          ctx.textBaseline = "middle";
          ctx.textAlign = "center";
          
          // Tamaños mínimos
          const minFontSize = device.isTabletPortrait ? 16 : device.type === 'tablet' ? 14 : device.type === 'mobile' ? 12 : 18;
          const maxTextWidth = radius * 0.65; // [CORREGIDO] Más reducido para evitar texto pegado al borde
          
          // Obtener líneas de texto
          let textLines = wrapText(displayText, maxTextWidth);
          
          // Ajustar tamaño de fuente si es necesario
          while (textLines.some(line => ctx.measureText(line).width > maxTextWidth) && fontSizeLocal > minFontSize) {
            fontSizeLocal -= 1;
            ctx.font = `500 ${fontSizeLocal}px "Marine-Regular", Arial, sans-serif`;
            textLines = wrapText(displayText, maxTextWidth);
          }

          // [MEJORADO] Renderizado de texto multilinea centrado
          const lineHeight = fontSizeLocal * 1.1; // Espaciado entre líneas
          const totalTextHeight = (textLines.length - 1) * lineHeight;
          const startY = -totalTextHeight / 2; // Centrar verticalmente
          
          textLines.forEach((line, lineIndex) => {
            const yPosition = startY + (lineIndex * lineHeight);
            
            if (highlightedSegment === i) {
              // Texto ganador con efecto de brillo
              const textGlowAlpha = 0.6 + winnerGlowIntensity * 0.4;
              const textBlurIntensity = device.isTabletPortrait ? 12 + winnerGlowIntensity * 8 : 15 + winnerGlowIntensity * 10;
              
              ctx.fillStyle = "#FFFFFF";
              
              // Glow dorado exterior
              ctx.shadowColor = `rgba(255, 215, 0, ${textGlowAlpha})`;
              ctx.shadowBlur = textBlurIntensity;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;
              drawTextWithLetterSpacing(line, textX, yPosition, 1);
              
              // Glow blanco interior
              ctx.shadowColor = `rgba(255, 255, 255, ${textGlowAlpha * 0.8})`;
              ctx.shadowBlur = textBlurIntensity * 0.6;
              drawTextWithLetterSpacing(line, textX, yPosition, 1);
              
              // Texto final brillante
              ctx.shadowColor = `rgba(255, 255, 153, ${textGlowAlpha * 0.7})`;
              ctx.shadowBlur = textBlurIntensity * 0.3;
              ctx.fillStyle = "#FFFFFF";
              drawTextWithLetterSpacing(line, textX, yPosition, 1);
            } else {
              // Texto normal con letter-spacing sutil
              ctx.fillStyle = getContrastYIQ(segment.color);
              ctx.shadowColor = "rgba(0,0,0,0.5)";
              ctx.shadowBlur = device.isTabletPortrait ? 6 : 8;
              ctx.shadowOffsetX = device.isTabletPortrait ? 1 : 2;
              ctx.shadowOffsetY = device.isTabletPortrait ? 1 : 2;
              drawTextWithLetterSpacing(line, textX, yPosition, 0.5);
            }
          });
          
          ctx.restore();
        });
        ctx.restore();


        // [MEJORADO] Círculo central proporcionalmente más grande
        const centralRadius = radius * (device.isTabletPortrait ? 0.14 : device.type === 'mobile' ? 0.14 : 0.16);
        
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
        ctx.lineWidth = device.isTabletPortrait ? 4 : 6;
        ctx.shadowColor = "#5ACCC1";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.stroke();
        ctx.restore();

        // CAPA 6: Borde interior metálico
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, centralRadius - (device.isTabletPortrait ? 2 : 3), 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = device.isTabletPortrait ? 2 : 3;
        ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();

        // BORDE EXTERIOR DE LA RULETA - Ajustado para que quepa perfectamente
        ctx.save();
        
        // Calcular el grosor del borde más conservador para evitar clipping
        const borderThickness = device.isTabletPortrait ? 8 : device.type === 'mobile' ? 6 : 10;
        const outerRadius = radius + (borderThickness / 2); // Sin padding extra para evitar clipping
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
        
        // Borde exterior gris metálico con efecto 3D
        const outerGradient = ctx.createLinearGradient(
          centerX - outerRadius, centerY - outerRadius,
          centerX + outerRadius, centerY + outerRadius
        );
        outerGradient.addColorStop(0, "#A0A0A0"); // Gris claro (iluminado)
        outerGradient.addColorStop(0.3, "#808080"); // Gris medio
        outerGradient.addColorStop(0.7, "#606060"); // Gris oscuro
        outerGradient.addColorStop(1, "#404040"); // Gris muy oscuro (sombra)
        
        ctx.strokeStyle = outerGradient;
        ctx.lineWidth = borderThickness;
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        ctx.stroke();
        
        // Borde interior del marco exterior (más claro)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 1, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(200, 200, 200, 0.8)";
        ctx.lineWidth = device.isTabletPortrait ? 2 : device.type === 'mobile' ? 1 : 3;
        ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = -1;
        ctx.stroke();
        
        ctx.restore();

        // [PUNTERO] Dibujado AL FINAL para que se vea por encima del borde exterior
        ctx.save();
        // [MEJORADO] Flecha más pequeña y delgada - reducida 20-30px
        const pointerBaseHalfHeight = radius * (device.isTabletPortrait ? 0.06 : device.type === 'mobile' ? 0.07 : 0.08); // Reducido de 0.11-0.14 a 0.06-0.08
        // [FIX] Posicionar el puntero correctamente en la parte superior
        const pointerTipX = centerX;
        const pointerTipY = centerY - radius - 2; // Punta justo tocando el borde de la ruleta
        const pointerBaseY = pointerTipY - pointerExtension; // Base a distancia completa del puntero
        
        // [NUEVO] Glow pulsante adicional cuando no está girando
        if (!isSpinning) {
          const pulseIntensity = 0.5 + 0.3 * Math.sin(Date.now() * 0.0015);
          
          // Glow exterior pulsante para flecha vertical
          ctx.shadowColor = "#FFD700";
          ctx.shadowBlur = device.isTabletPortrait ? 25 + pulseIntensity * 10 : 35 + pulseIntensity * 15;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.beginPath();
          ctx.moveTo(pointerTipX - pointerBaseHalfHeight, pointerBaseY);
          ctx.lineTo(pointerTipX, pointerTipY);
          ctx.lineTo(pointerTipX + pointerBaseHalfHeight, pointerBaseY);
          ctx.closePath();
          ctx.fillStyle = `rgba(255, 215, 0, ${0.2 + pulseIntensity * 0.3})`;
          ctx.fill();
        }
        
        // CAPA 1: Glow exterior ultra brillante para flecha vertical
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = device.isTabletPortrait ? 18 : 25;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.beginPath();
        ctx.moveTo(pointerTipX - pointerBaseHalfHeight, pointerBaseY);
        ctx.lineTo(pointerTipX, pointerTipY);
        ctx.lineTo(pointerTipX + pointerBaseHalfHeight, pointerBaseY);
        ctx.closePath();
        // [MEJORADO] Color blanco brillante en lugar de azul oscuro
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        
        // CAPA 2: Sombra profunda debajo del puntero (ajustada para posición vertical)
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = device.isTabletPortrait ? 10 : 15;
        ctx.shadowOffsetX = device.isTabletPortrait ? 2 : 3;
        ctx.shadowOffsetY = device.isTabletPortrait ? 5 : 8; // Sombra hacia abajo para flecha vertical
        ctx.beginPath();
        ctx.moveTo(pointerTipX - pointerBaseHalfHeight, pointerBaseY);
        ctx.lineTo(pointerTipX, pointerTipY);
        ctx.lineTo(pointerTipX + pointerBaseHalfHeight, pointerBaseY);
        ctx.closePath();
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        
        // CAPA 3: Puntero principal con gradiente (ajustado para flecha vertical)
        ctx.shadowColor = "rgba(0, 0, 0, 0)";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // [MEJORADO] Gradiente lineal para el puntero vertical con colores amarillo vibrante
        const pointerGradient = ctx.createLinearGradient(
          pointerTipX, pointerTipY,
          pointerTipX, pointerBaseY
        );
        pointerGradient.addColorStop(0, "#FFD700"); // amarillo vibrante en la punta
        pointerGradient.addColorStop(0.5, "#FFA500"); // naranja-amarillo en el medio  
        pointerGradient.addColorStop(1, "#FF8C00"); // naranja oscuro en la base
        
        ctx.beginPath();
        ctx.moveTo(pointerTipX - pointerBaseHalfHeight, pointerBaseY);
        ctx.lineTo(pointerTipX, pointerTipY);
        ctx.lineTo(pointerTipX + pointerBaseHalfHeight, pointerBaseY);
        ctx.closePath();
        ctx.fillStyle = pointerGradient;
        ctx.fill();
        
        // CAPA 4: Borde brillante con glow (mejorado - borde oscuro)
        ctx.strokeStyle = "#2C2C2C"; // [MEJORADO] Borde oscuro para mejor contraste
        ctx.lineWidth = device.isTabletPortrait ? 2 : device.type === 'mobile' ? 3 : 4; // Más delgado
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = device.isTabletPortrait ? 4 : 6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.stroke();
        
        // CAPA 5: Borde interior dorado brillante para efecto 3D
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = device.isTabletPortrait ? 1 : device.type === 'mobile' ? 1 : 2;
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = device.isTabletPortrait ? 6 : 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.stroke();
        
        // CAPA 6: Punto de luz en la punta del puntero (mejorado)
        ctx.beginPath();
        ctx.arc(pointerTipX, pointerTipY, radius * (device.isTabletPortrait ? 0.008 : 0.010), 0, 2 * Math.PI); // Más pequeño
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = device.isTabletPortrait ? 10 : 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fill();
        
        ctx.restore();

      },
      [wheelSegments, anglePerSegment, highlightedSegment, isDOMReady, isSpinning, winnerGlowIntensity, device]
    );

    // [GAMING ULTIMATE] Cálculo de tamaño basado en altura disponible real
    const handleResize = useCallback(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      

      // Márgenes más conservadores para evitar clipping
      const minPadding = 8; // Aumentado de 2 a 8
      const pointerSpace = 20; // Aumentado de 15 a 20
      const bottomPadding = 12; // Nuevo padding específico para el borde inferior
      
      // Espacio disponible con márgenes conservadores
      const availableWidth = containerWidth - (minPadding * 2);
      const availableHeight = containerHeight - pointerSpace - minPadding - bottomPadding;
      
      // Tamaño de la ruleta: más conservador para evitar clipping
      let wheelSize = Math.min(availableWidth, availableHeight);
      
      // Usar el 94% del espacio disponible para garantizar que quepa completamente
      wheelSize = Math.min(availableWidth * 0.94, availableHeight * 0.94);
      
      // Para TV, forzar un mínimo mucho más alto
      if (device.type === 'tv' || containerWidth > 500) {
        wheelSize = Math.max(wheelSize, Math.min(containerWidth * 0.8, containerHeight * 0.8));
      }

      // [FIX] Canvas con dimensiones exactas para el contenido
      
      // Canvas que usa todo el espacio disponible
      const canvasWidth = containerWidth;
      const canvasHeight = containerHeight;
      
      // Asignar tamaño del canvas incluyendo espacio para el puntero
      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
      }
      
      // Dibuja sólo si no está girando
      if (!isSpinning && numSegments > 0) {
        drawRoulette(currentAngle, wheelSize);
      }
    }, [currentAngle, numSegments, isSpinning, device, drawRoulette]);

    useEffect(() => {
      if (!isDOMReady || !canUseDOM) return;
      
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [
      isDOMReady,
      canUseDOM,
      handleResize,
      device,
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
          
          setWinnerGlowIntensity(glowValue);
          
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
      
      // [NUEVO] Sistema de memoria: evitar últimos segmentos
      const getRandomSegmentWithMemory = (totalSegments: number, recentSegments: number[]): number => {
        const maxAttempts = 50; // Evitar bucle infinito
        let attempts = 0;
        
        // Si hay muy pocos segmentos o demasiados segmentos recientes, permitir cualquiera
        if (totalSegments <= 3 || recentSegments.length >= totalSegments - 1) {
          return Math.floor(Math.random() * totalSegments);
        }
        
        let randomSegment;
        do {
          randomSegment = Math.floor(Math.random() * totalSegments);
          attempts++;
          
          // Si no encontramos un segmento nuevo después de muchos intentos, permitir cualquiera
          if (attempts >= maxAttempts) {
            break;
          }
        } while (recentSegments.includes(randomSegment));
        
        return randomSegment;
      };
      
      const randomStopSegment = getRandomSegmentWithMemory(numSegments, recentSpinSegments);
      
      // [FIXED] Cálculo correcto para alinear con el puntero a las 12 en punto
      // El puntero está a -Math.PI/2 (-90°, las 12 en punto, arriba)
      // Necesitamos que el centro del segmento elegido termine exactamente ahí
      const segmentCenterAngle = (randomStopSegment + 0.5) * anglePerSegment;
      const targetAngle = -Math.PI / 2; // Las 12 en punto (arriba, donde está el puntero)
      const stopAngleOnWheel = targetAngle - segmentCenterAngle;
      
      
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
        plannedSegment: randomStopSegment, // Agregar para debug
      };
      
      const spinAnimation = (timestamp: number) => {
        const config = animationConfigRef.current;
        const elapsedTime = timestamp - config.startTime;
        if (elapsedTime >= config.duration) {
          const finalEffectiveAngle = config.targetAngle % (2 * Math.PI);
          setCurrentAngle(finalEffectiveAngle);
          
          // [FIXED] Cálculo directo y universal - NO necesitamos calcular nada
          // Si planifiqué que el segmento X termine arriba, entonces el ganador ES el segmento X
          const winningSegmentIndex = config.plannedSegment;
          
          
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
              
              // [NUEVO] Agregar segmento al historial de memoria
              addRecentSpinSegment(config.plannedSegment);
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
    }, [isSpinning, numSegments, isDOMReady, canUseDOM, anglePerSegment, setLastSpinResultIndex, addRecentSpinSegment, recentSpinSegments, drawRoulette, wheelSegments, questions]);

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
        <div className="flex flex-col items-center justify-center w-full text-white text-lg" style={{ minHeight: '400px' }}>
          <div>Preparando ruleta mejorada...</div>
        </div>
      );
    }

    // [GAMING ADVANCED] Ya no necesitamos calcular pointerExtension aquí ya que se maneja en handleResize

    // Render
    const canvasClasses = "w-full h-full block object-contain touch-manipulation m-0 p-0 border-none outline-none";

    return (
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
        className="w-full h-full flex items-center justify-center"
        style={{ 
          width: '100%', 
          height: '100%', 
          minWidth: '500px', 
          minHeight: '500px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div 
          className="relative flex items-center justify-center w-full h-full flex-1"
          style={{ 
            width: '100%', 
            height: '100%', 
            minWidth: '500px', 
            minHeight: '500px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <canvas
            ref={canvasRef}
            className={canvasClasses}
            aria-label="Ruleta de selección de categoría"
            role="img"
          />
        </div>
      </motion.div>
    );
  }
));
RouletteWheel.displayName = "RouletteWheel";
export default RouletteWheel;
