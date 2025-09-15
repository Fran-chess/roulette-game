/**
 * Gestión de segmentos de la ruleta
 * Maneja la creación, organización y asignación de colores a los segmentos
 */

import type { Question } from '@/types';
import {
  getCategoryColor,
  normalizeCategory,
  AVAILABLE_COLORS
} from './colors';

/**
 * Interfaz para un segmento de la ruleta
 */
export interface WheelSegment {
  text: string;
  color: string;
  questions: Question[];
}

/**
 * Interfaz para segmento sin color asignado
 */
interface SegmentWithoutColor {
  text: string;
  questions: Question[];
}

/**
 * Asigna colores a los segmentos evitando colores adyacentes repetidos
 * Implementa un algoritmo inteligente de distribución de colores
 *
 * @param segments - Array de segmentos sin color
 * @returns Array de segmentos con colores asignados
 */
export function assignColorsToSegments(segments: SegmentWithoutColor[]): WheelSegment[] {
  if (!segments || segments.length === 0) return [];

  const result: WheelSegment[] = [];
  const usedColors: string[] = [];

  segments.forEach((segment, index) => {
    const categoryColor = getCategoryColor(segment.text);

    // Si la categoría tiene un color específico asignado, usarlo
    if (categoryColor) {
      result.push({
        text: segment.text,
        color: categoryColor,
        questions: segment.questions
      });
      usedColors.push(categoryColor);
      return;
    }

    // Para categorías sin color específico, seleccionar inteligentemente
    const selectedColor = selectOptimalColor(
      index,
      segments,
      usedColors,
      AVAILABLE_COLORS
    );

    result.push({
      text: segment.text,
      color: selectedColor,
      questions: segment.questions
    });
    usedColors.push(selectedColor);
  });

  return result;
}

/**
 * Selecciona el color óptimo para un segmento evitando adyacencias
 *
 * @param currentIndex - Índice del segmento actual
 * @param allSegments - Todos los segmentos
 * @param usedColors - Colores ya utilizados
 * @param availableColors - Colores disponibles para selección
 * @returns Color hexadecimal seleccionado
 */
function selectOptimalColor(
  currentIndex: number,
  allSegments: SegmentWithoutColor[],
  usedColors: string[],
  availableColors: string[]
): string {
  // Obtener colores adyacentes para evitar
  const prevColor = currentIndex > 0 ? usedColors[currentIndex - 1] : null;
  const nextColor = getNextFixedColor(currentIndex, allSegments);

  // Filtrar colores que no sean adyacentes
  let candidateColors = availableColors.filter(color =>
    color !== prevColor && color !== nextColor
  );

  // Si no hay opciones, relajar restricciones
  if (candidateColors.length === 0) {
    candidateColors = availableColors.filter(color => color !== prevColor);
  }

  // Si aún no hay opciones, usar todos los colores disponibles
  if (candidateColors.length === 0) {
    candidateColors = [...availableColors];
  }

  // Seleccionar color usando distribución circular para mejor balance
  const colorIndex = currentIndex % candidateColors.length;
  return candidateColors[colorIndex];
}

/**
 * Obtiene el color fijo del siguiente segmento si existe
 *
 * @param currentIndex - Índice actual
 * @param segments - Array de segmentos
 * @returns Color del siguiente segmento con color fijo o null
 */
function getNextFixedColor(
  currentIndex: number,
  segments: SegmentWithoutColor[]
): string | null {
  const nextSegment = segments[currentIndex + 1];
  if (!nextSegment) return null;

  return getCategoryColor(nextSegment.text) || null;
}

/**
 * Agrupa las preguntas por categoría
 *
 * @param questions - Array de preguntas
 * @returns Objeto con preguntas agrupadas por categoría
 */
export function groupQuestionsByCategory(questions: Question[]): Record<string, Question[]> {
  const grouped: Record<string, Question[]> = {};

  questions.forEach(question => {
    const category = normalizeCategory(question.category);

    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(question);
  });

  return grouped;
}

/**
 * Crea los segmentos de la ruleta distribuyendo las categorías estratégicamente
 * Asegura que "Dar Salud" aparezca dos veces en posiciones no consecutivas
 *
 * @param questions - Array de preguntas del juego
 * @returns Array de segmentos con colores asignados
 */
export function createRouletteSegments(questions: Question[]): WheelSegment[] {
  if (!questions || questions.length === 0) return [];

  const grouped = groupQuestionsByCategory(questions);
  const categories = Object.keys(grouped);
  const segments: SegmentWithoutColor[] = [];

  // Agregar todas las categorías excepto "Dar Salud"
  categories.forEach(category => {
    if (category !== "Dar Salud") {
      segments.push({
        text: category,
        questions: grouped[category]
      });
    }
  });

  // Insertar "Dar Salud" estratégicamente si existe
  if (grouped["Dar Salud"]) {
    insertDarSaludSegments(segments, grouped["Dar Salud"]);
  }

  return assignColorsToSegments(segments);
}

/**
 * Inserta los segmentos de "Dar Salud" en posiciones estratégicas
 *
 * @param segments - Array de segmentos donde insertar
 * @param darSaludQuestions - Preguntas de la categoría "Dar Salud"
 */
function insertDarSaludSegments(
  segments: SegmentWithoutColor[],
  darSaludQuestions: Question[]
): void {
  const totalSegments = segments.length + 2;

  // Calcular posiciones óptimas (aproximadamente 1/3 y 2/3 del círculo)
  const firstPosition = Math.floor(totalSegments / 3);
  const secondPosition = Math.floor((totalSegments * 2) / 3);

  // Insertar primer "Dar Salud"
  segments.splice(firstPosition, 0, {
    text: "Dar Salud",
    questions: darSaludQuestions
  });

  // Insertar segundo "Dar Salud" (ajustando por la inserción previa)
  segments.splice(secondPosition + 1, 0, {
    text: "Dar Salud",
    questions: darSaludQuestions
  });
}

/**
 * Valida si los segmentos están correctamente configurados
 *
 * @param segments - Array de segmentos a validar
 * @returns true si los segmentos son válidos
 */
export function validateSegments(segments: WheelSegment[]): boolean {
  if (!segments || segments.length === 0) return false;

  return segments.every(segment =>
    segment.text &&
    segment.color &&
    segment.questions &&
    segment.questions.length > 0
  );
}