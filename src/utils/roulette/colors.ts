/**
 * Gestión de colores para la ruleta de DarSalud
 * Maneja la paleta de colores oficial y el mapeo de categorías
 */

/**
 * Paleta de colores oficial de DarSalud
 * Cada color representa una categoría específica del juego
 */
export const ROULETTE_COLORS = {
  AZUL_INTENSO: "#192A6E",    // Exclusivo para "Dar Salud"
  VERDE_SALUD: "#5ACCC1",     // Prevención
  CELESTE_MEDIO: "#40C0EF",   // Criterios clínicos
  AMARILLO_DS: "#F2BD35",     // Cuidado interdisciplinario
  ROSADO_LILA: "#D5A7CD",     // Ética y derechos
} as const;

/**
 * Array de colores disponibles para segmentos sin categoría específica
 * Excluye el azul intenso que es exclusivo de "Dar Salud"
 */
export const AVAILABLE_COLORS = [
  ROULETTE_COLORS.VERDE_SALUD,
  ROULETTE_COLORS.CELESTE_MEDIO,
  ROULETTE_COLORS.AMARILLO_DS,
  ROULETTE_COLORS.ROSADO_LILA,
];

/**
 * Mapeo de categorías específicas a sus colores designados
 */
export const CATEGORY_COLOR_MAP: Record<string, string> = {
  "Dar Salud": ROULETTE_COLORS.AZUL_INTENSO,
  "Prevención": ROULETTE_COLORS.VERDE_SALUD,
  "Criterios clínicos": ROULETTE_COLORS.CELESTE_MEDIO,
  "Cuidado interdisciplinario": ROULETTE_COLORS.AMARILLO_DS,
  "Ética y derechos": ROULETTE_COLORS.ROSADO_LILA,
};

/**
 * Calcula el color de contraste óptimo (blanco o negro) basado en la luminosidad
 * @param hexColor - Color en formato hexadecimal
 * @returns Color de contraste para texto (#FFFFFF o #1E1E1E)
 */
export function getContrastColor(hexColor: string): string {
  // Remover el símbolo # si existe
  const color = hexColor.replace("#", "");

  // Convertir hex a RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  // Calcular luminosidad usando la fórmula YIQ
  const luminosity = (r * 299 + g * 587 + b * 114) / 1000;

  // Retornar color de contraste basado en el umbral
  return luminosity >= 135 ? "#1E1E1E" : "#FFFFFF";
}

/**
 * Normaliza el nombre de una categoría para el mapeo de colores
 * @param category - Nombre de la categoría
 * @returns Categoría normalizada
 */
export function normalizeCategory(category: string): string {
  // "Dar Salud II" se mapea a "Dar Salud" para mantener el mismo color
  return category === "Dar Salud II" ? "Dar Salud" : category;
}

/**
 * Obtiene el color asignado para una categoría específica
 * @param category - Nombre de la categoría
 * @returns Color hexadecimal o undefined si no tiene color específico
 */
export function getCategoryColor(category: string): string | undefined {
  const normalized = normalizeCategory(category);
  return CATEGORY_COLOR_MAP[normalized];
}