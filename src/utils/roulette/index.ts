/**
 * Exportaciones centralizadas de utilidades de la ruleta
 */

// Colores
export {
  ROULETTE_COLORS,
  AVAILABLE_COLORS,
  CATEGORY_COLOR_MAP,
  getContrastColor,
  normalizeCategory,
  getCategoryColor,
} from './colors';

// Segmentos
export {
  type WheelSegment,
  assignColorsToSegments,
  groupQuestionsByCategory,
  createRouletteSegments,
  validateSegments,
} from './segments';

// Física
export {
  PHYSICS_CONFIG,
  SOUND_CONFIG,
  type SpinState,
  customEasingFunction,
  calculateInitialVelocity,
  calculateTargetAngle,
  calculateSpinDuration,
  updateSpinState,
  shouldPlayTick,
  calculateWinningSegment,
  triggerVibration,
  createAudioContext,
  playTickSound,
} from './physics';