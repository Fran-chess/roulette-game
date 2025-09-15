/**
 * Servicio de lógica de negocio del juego
 * Centraliza las reglas y mecánicas del juego
 */

import type { Question, AnswerOption } from '@/types';

/**
 * Resultado de una jugada
 */
export interface PlayResult {
  questionId: string;
  answeredCorrectly: boolean;
  selectedOption: AnswerOption | null;
  correctOption: AnswerOption | null;
  timeUp: boolean;
  score: number;
  prizeName: string;
  explanation: string;
}

/**
 * Estadísticas del juego
 */
export interface GameStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeOuts: number;
  totalScore: number;
  accuracy: number;
  averageResponseTime: number;
  streak: number;
  bestStreak: number;
}

/**
 * Configuración del juego
 */
export interface GameConfig {
  /** Tiempo por pregunta en segundos */
  timePerQuestion: number;
  /** Puntos base por respuesta correcta */
  basePoints: number;
  /** Multiplicador de puntos por velocidad */
  speedMultiplier: number;
  /** Puntos de penalización por respuesta incorrecta */
  wrongAnswerPenalty: number;
  /** Puntos de penalización por tiempo agotado */
  timeOutPenalty: number;
  /** Bonus por racha de respuestas correctas */
  streakBonus: number;
}

/**
 * Configuración por defecto del juego
 */
const DEFAULT_CONFIG: GameConfig = {
  timePerQuestion: 30,
  basePoints: 100,
  speedMultiplier: 2,
  wrongAnswerPenalty: 0,
  timeOutPenalty: 0,
  streakBonus: 50,
};

/**
 * Clase principal del servicio de juego
 */
export class GameService {
  private config: GameConfig;
  private stats: GameStats;
  private responseTimes: number[] = [];
  private currentStreak: number = 0;

  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = this.initializeStats();
  }

  /**
   * Inicializa las estadísticas del juego
   */
  private initializeStats(): GameStats {
    return {
      totalQuestions: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      timeOuts: 0,
      totalScore: 0,
      accuracy: 0,
      averageResponseTime: 0,
      streak: 0,
      bestStreak: 0,
    };
  }

  /**
   * Procesa una respuesta del jugador
   */
  public processAnswer(
    question: Question,
    selectedOption: AnswerOption | null,
    responseTime: number,
    timeUp: boolean = false
  ): PlayResult {
    const correctOption = question.options.find(o => o.correct) || null;
    const answeredCorrectly = selectedOption?.correct === true;

    // Actualizar estadísticas
    this.stats.totalQuestions++;

    if (timeUp) {
      this.stats.timeOuts++;
      this.currentStreak = 0;
    } else if (answeredCorrectly) {
      this.stats.correctAnswers++;
      this.currentStreak++;
      this.stats.bestStreak = Math.max(this.stats.bestStreak, this.currentStreak);
    } else {
      this.stats.incorrectAnswers++;
      this.currentStreak = 0;
    }

    // Calcular puntuación
    const score = this.calculateScore(answeredCorrectly, responseTime, timeUp);
    this.stats.totalScore += score;

    // Actualizar tiempos de respuesta
    if (!timeUp) {
      this.responseTimes.push(responseTime);
      this.stats.averageResponseTime = this.calculateAverageResponseTime();
    }

    // Actualizar precisión
    this.stats.accuracy = this.calculateAccuracy();
    this.stats.streak = this.currentStreak;

    // Determinar premio
    const prizeName = answeredCorrectly && question.prize ? question.prize : '';

    // Determinar explicación
    const explanation = !answeredCorrectly ? (question.explanation || '') : '';

    return {
      questionId: question.id,
      answeredCorrectly,
      selectedOption,
      correctOption,
      timeUp,
      score,
      prizeName,
      explanation,
    };
  }

  /**
   * Calcula la puntuación para una respuesta
   */
  private calculateScore(
    correct: boolean,
    responseTime: number,
    timeUp: boolean
  ): number {
    if (timeUp) {
      return -this.config.timeOutPenalty;
    }

    if (!correct) {
      return -this.config.wrongAnswerPenalty;
    }

    // Puntuación base
    let score = this.config.basePoints;

    // Bonus por velocidad (más puntos mientras más rápido)
    const speedBonus = Math.max(
      0,
      Math.floor((this.config.timePerQuestion - responseTime) * this.config.speedMultiplier)
    );
    score += speedBonus;

    // Bonus por racha
    if (this.currentStreak > 0) {
      score += this.currentStreak * this.config.streakBonus;
    }

    return score;
  }

  /**
   * Calcula la precisión del jugador
   */
  private calculateAccuracy(): number {
    const answered = this.stats.correctAnswers + this.stats.incorrectAnswers;
    if (answered === 0) return 0;
    return (this.stats.correctAnswers / answered) * 100;
  }

  /**
   * Calcula el tiempo promedio de respuesta
   */
  private calculateAverageResponseTime(): number {
    if (this.responseTimes.length === 0) return 0;
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return sum / this.responseTimes.length;
  }

  /**
   * Obtiene las estadísticas actuales
   */
  public getStats(): GameStats {
    return { ...this.stats };
  }

  /**
   * Reinicia las estadísticas del juego
   */
  public resetStats(): void {
    this.stats = this.initializeStats();
    this.responseTimes = [];
    this.currentStreak = 0;
  }

  /**
   * Obtiene la configuración actual
   */
  public getConfig(): GameConfig {
    return { ...this.config };
  }

  /**
   * Actualiza la configuración del juego
   */
  public updateConfig(config: Partial<GameConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Valida si una pregunta tiene el formato correcto
   */
  public static validateQuestion(question: unknown): question is Question {
    if (!question || typeof question !== 'object') return false;

    const q = question as Record<string, unknown>;

    return (
      typeof q.id === 'string' &&
      typeof q.text === 'string' &&
      typeof q.category === 'string' &&
      Array.isArray(q.options) &&
      q.options.length > 0 &&
      q.options.every((opt: unknown) => {
        if (!opt || typeof opt !== 'object') return false;
        const option = opt as Record<string, unknown>;
        return (
          typeof option.text === 'string' &&
          typeof option.correct === 'boolean'
        );
      })
    );
  }

  /**
   * Mezcla las opciones de una pregunta
   */
  public static shuffleOptions(options: AnswerOption[]): AnswerOption[] {
    const shuffled = [...options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Selecciona una pregunta aleatoria de una lista
   */
  public static selectRandomQuestion(questions: Question[]): Question | null {
    if (questions.length === 0) return null;
    const index = Math.floor(Math.random() * questions.length);
    return questions[index];
  }

  /**
   * Filtra preguntas por categoría
   */
  public static filterByCategory(questions: Question[], category: string): Question[] {
    return questions.filter(q => q.category === category);
  }

  /**
   * Obtiene todas las categorías únicas
   */
  public static getCategories(questions: Question[]): string[] {
    const categories = new Set(questions.map(q => q.category));
    return Array.from(categories);
  }
}

// Exportar instancia por defecto
export const gameService = new GameService();