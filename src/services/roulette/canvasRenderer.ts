/**
 * Servicio de renderizado del canvas para la ruleta
 * Maneja todo el dibujo y renderizado visual de la ruleta
 */

import type { WheelSegment } from '@/utils/roulette/segments';
import { getContrastColor } from '@/utils/roulette/colors';

/**
 * Configuración visual de la ruleta
 */
export const VISUAL_CONFIG = {
  /** Radio del círculo central como porcentaje del radio total */
  CENTER_CIRCLE_RATIO: 0.15,
  /** Grosor del borde exterior */
  OUTER_BORDER_WIDTH: 8,
  /** Grosor del borde del círculo central */
  CENTER_BORDER_WIDTH: 4,
  /** Tamaño de la flecha indicadora */
  ARROW_SIZE: 25,
  /** Desplazamiento de la flecha desde el borde */
  ARROW_OFFSET: 5,
  /** Radio de esquinas redondeadas para el texto */
  TEXT_BORDER_RADIUS: 5,
  /** Padding del texto */
  TEXT_PADDING: 10,
  /** Tamaño base de la fuente (se ajusta según el tamaño) */
  BASE_FONT_SIZE: 16,
  /** Factor de escala para el texto según el radio */
  FONT_SCALE_FACTOR: 0.08,
  /** Opacidad del highlight */
  HIGHLIGHT_OPACITY: 0.3,
  /** Intensidad del glow del ganador */
  WINNER_GLOW_INTENSITY: 0.6,
} as const;

/**
 * Colores del tema
 */
export const THEME_COLORS = {
  BACKGROUND: 'transparent',
  OUTER_BORDER: '#2C3E50',
  CENTER_CIRCLE: '#FFFFFF',
  CENTER_BORDER: '#34495E',
  CENTER_TEXT: '#2C3E50',
  ARROW: '#E74C3C',
  ARROW_SHADOW: 'rgba(231, 76, 60, 0.5)',
  SEGMENT_BORDER: '#FFFFFF',
  HIGHLIGHT: 'rgba(255, 255, 255, 0.3)',
  WINNER_GLOW: 'rgba(255, 215, 0, 0.6)',
} as const;

/**
 * Contexto de renderizado con todas las propiedades necesarias
 */
export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  centerX: number;
  centerY: number;
  radius: number;
  currentAngle: number;
  segments: WheelSegment[];
  highlightedSegment: number | null;
  winnerGlowIntensity: number;
  isSpinning: boolean;
}

/**
 * Limpia el canvas y prepara para el siguiente frame
 */
export function clearCanvas(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Dibuja un segmento individual de la ruleta
 */
export function drawSegment(
  ctx: CanvasRenderingContext2D,
  segment: WheelSegment,
  startAngle: number,
  endAngle: number,
  centerX: number,
  centerY: number,
  radius: number,
  isHighlighted: boolean = false,
  glowIntensity: number = 0
): void {
  // Dibujar el segmento principal
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.closePath();

  // Aplicar color del segmento
  ctx.fillStyle = segment.color;
  ctx.fill();

  // Aplicar highlight si está activo
  if (isHighlighted) {
    ctx.fillStyle = THEME_COLORS.HIGHLIGHT;
    ctx.fill();
  }

  // Aplicar glow del ganador si existe
  if (glowIntensity > 0) {
    ctx.save();
    ctx.globalAlpha = glowIntensity;
    ctx.fillStyle = THEME_COLORS.WINNER_GLOW;
    ctx.fill();
    ctx.restore();
  }

  // Dibujar borde del segmento
  ctx.strokeStyle = THEME_COLORS.SEGMENT_BORDER;
  ctx.lineWidth = 2;
  ctx.stroke();
}

/**
 * Dibuja el texto radialmente desde el centro hacia afuera
 * Exactamente como en la imagen de referencia
 */
export function drawSegmentText(
  ctx: CanvasRenderingContext2D,
  text: string,
  startAngle: number,
  endAngle: number,
  centerX: number,
  centerY: number,
  radius: number,
  segmentColor: string
): void {
  ctx.save();

  // Calcular el ángulo medio del segmento
  const middleAngle = (startAngle + endAngle) / 2;

  // Configurar estilo del texto
  const fontSize = Math.min(22, Math.max(16, radius * 0.09));
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = getContrastColor(segmentColor);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // Sombra para mejor legibilidad
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  // Dividir el texto en líneas apropiadamente
  const words = text.split(' ');
  let lines: string[] = [];

  // División específica para cada categoría
  if (text === "Prevención") {
    lines = ["Prevención"];
  } else if (text === "Criterios clínicos") {
    lines = ["Criterios", "clínicos"];
  } else if (text === "Dar Salud") {
    lines = ["Dar Salud"];  // Una sola línea
  } else if (text === "Ética y derechos") {
    lines = ["Ética y", "derechos"];
  } else if (text === "Cuidado interdisciplinario") {
    lines = ["Cuidado", "interdisciplinario"];
  } else {
    // Por defecto, cada palabra en su línea si hay 2 palabras
    if (words.length === 2) {
      lines = words;
    } else if (words.length === 3) {
      lines = [words[0], words.slice(1).join(' ')];
    } else {
      lines = [text];
    }
  }

  // Trasladar al centro
  ctx.translate(centerX, centerY);

  // Rotar al ángulo del segmento
  ctx.rotate(middleAngle);

  // Determinar si necesitamos invertir el texto (mitad izquierda)
  const angleInDegrees = (middleAngle * 180 / Math.PI) % 360;
  const normalizedAngle = angleInDegrees < 0 ? angleInDegrees + 360 : angleInDegrees;
  const needsFlip = normalizedAngle > 90 && normalizedAngle < 270;

  // Posición inicial del texto y espaciado
  const lineHeight = fontSize * 1.1;
  const totalHeight = lines.length * lineHeight;

  if (needsFlip) {
    // Para la mitad izquierda, rotar 180 grados
    ctx.rotate(Math.PI);

    // Posicionar desde el borde hacia el centro
    const startX = -radius * 0.75;
    const startY = -totalHeight / 2 + lineHeight / 2;

    lines.forEach((line, index) => {
      const y = startY + index * lineHeight;
      ctx.fillText(line, startX, y);
    });
  } else {
    // Para la mitad derecha, texto normal
    // Ajustar posición específica para "Cuidado interdisciplinario"
    let startX = radius * 0.35;
    if (text === "Cuidado interdisciplinario") {
      startX = radius * 0.42; // Más alejado del centro
    }

    const startY = -totalHeight / 2 + lineHeight / 2;

    lines.forEach((line, index) => {
      const y = startY + index * lineHeight;
      ctx.fillText(line, startX, y);
    });
  }

  ctx.restore();
}

/**
 * Dibuja el círculo central de la ruleta
 */
export function drawCenterCircle(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
): void {
  const centerRadius = radius * VISUAL_CONFIG.CENTER_CIRCLE_RATIO;

  // Sombra para el bot\u00f3n
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  // Gradiente para el bot\u00f3n
  const gradient = ctx.createLinearGradient(
    centerX - centerRadius,
    centerY - centerRadius,
    centerX + centerRadius,
    centerY + centerRadius
  );
  gradient.addColorStop(0, '#0652D4');
  gradient.addColorStop(0.5, '#0435A3');
  gradient.addColorStop(1, '#032B7A');

  // Dibujar c\u00edrculo central con gradiente
  ctx.beginPath();
  ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Borde del c\u00edrculo central
  ctx.strokeStyle = '#08C3FC';
  ctx.lineWidth = VISUAL_CONFIG.CENTER_BORDER_WIDTH + 1;
  ctx.stroke();

  ctx.restore();

  // Texto "GIRAR" en el centro
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${centerRadius * 0.45}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillText('GIRAR', centerX, centerY);
}

/**
 * Dibuja la flecha indicadora
 */
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
): void {
  const arrowSize = VISUAL_CONFIG.ARROW_SIZE;
  const arrowY = centerY - radius - VISUAL_CONFIG.ARROW_OFFSET;

  ctx.save();

  // Sombra de la flecha
  ctx.shadowColor = THEME_COLORS.ARROW_SHADOW;
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;

  // Dibujar triángulo (flecha)
  ctx.beginPath();
  ctx.moveTo(centerX, arrowY);
  ctx.lineTo(centerX - arrowSize / 2, arrowY - arrowSize);
  ctx.lineTo(centerX + arrowSize / 2, arrowY - arrowSize);
  ctx.closePath();

  ctx.fillStyle = THEME_COLORS.ARROW;
  ctx.fill();

  // Borde de la flecha
  ctx.strokeStyle = THEME_COLORS.SEGMENT_BORDER;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

/**
 * Dibuja el borde exterior de la ruleta
 */
export function drawOuterBorder(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = THEME_COLORS.OUTER_BORDER;
  ctx.lineWidth = VISUAL_CONFIG.OUTER_BORDER_WIDTH;
  ctx.stroke();
}

/**
 * Renderiza la ruleta completa
 */
export function renderRoulette(context: RenderContext): void {
  const {
    canvas,
    ctx,
    centerX,
    centerY,
    radius,
    currentAngle,
    segments,
    highlightedSegment,
    winnerGlowIntensity,
    isSpinning
  } = context;

  // Limpiar canvas
  clearCanvas(ctx, canvas);

  // Guardar estado del contexto
  ctx.save();

  // Aplicar rotación global
  ctx.translate(centerX, centerY);
  ctx.rotate((currentAngle * Math.PI) / 180);
  ctx.translate(-centerX, -centerY);

  // Dibujar segmentos
  const anglePerSegment = (2 * Math.PI) / segments.length;
  segments.forEach((segment, index) => {
    const startAngle = index * anglePerSegment - Math.PI / 2;
    const endAngle = startAngle + anglePerSegment;

    const isHighlighted = index === highlightedSegment;
    const glowIntensity = index === highlightedSegment ? winnerGlowIntensity : 0;

    // Dibujar segmento
    drawSegment(
      ctx,
      segment,
      startAngle,
      endAngle,
      centerX,
      centerY,
      radius,
      isHighlighted && !isSpinning,
      glowIntensity
    );

    // Dibujar texto del segmento
    drawSegmentText(
      ctx,
      segment.text,
      startAngle,
      endAngle,
      centerX,
      centerY,
      radius,
      segment.color
    );
  });

  // Restaurar contexto antes de dibujar elementos estáticos
  ctx.restore();

  // Dibujar elementos estáticos (no rotan)
  drawOuterBorder(ctx, centerX, centerY, radius);
  drawCenterCircle(ctx, centerX, centerY, radius);
  drawArrow(ctx, centerX, centerY, radius);
}

/**
 * Ajusta el tamaño del canvas según el contenedor
 */
export function resizeCanvas(
  canvas: HTMLCanvasElement,
  container: HTMLElement
): { width: number; height: number; radius: number } {
  const rect = container.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height);

  // Configurar resolución del canvas para pantallas de alta densidad
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  // Escalar el contexto para que coincida con el device pixel ratio
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
  }

  const radius = size * 0.44; // Radio al 44% del tamaño - moderadamente más grande

  return {
    width: size,
    height: size,
    radius
  };
}

/**
 * Calcula qué segmento está bajo el puntero
 */
export function getSegmentAtPointer(
  mouseX: number,
  mouseY: number,
  centerX: number,
  centerY: number,
  currentAngle: number,
  numSegments: number
): number | null {
  // Calcular distancia desde el centro
  const dx = mouseX - centerX;
  const dy = mouseY - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Verificar si está dentro del radio de la ruleta
  const maxRadius = Math.min(centerX, centerY) * 0.8;
  if (distance > maxRadius) return null;

  // Calcular ángulo del puntero
  let angle = Math.atan2(dy, dx);
  angle = angle < 0 ? angle + 2 * Math.PI : angle;

  // Ajustar por la rotación actual
  const adjustedAngle = (angle - (currentAngle * Math.PI) / 180 + Math.PI / 2) % (2 * Math.PI);
  const positiveAngle = adjustedAngle < 0 ? adjustedAngle + 2 * Math.PI : adjustedAngle;

  // Calcular segmento
  const segmentAngle = (2 * Math.PI) / numSegments;
  return Math.floor(positiveAngle / segmentAngle) % numSegments;
}