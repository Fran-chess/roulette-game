/**
 * Servicio de Audio para el juego
 * Maneja todos los efectos de sonido y música de fondo
 */

/**
 * Tipos de sonido disponibles
 */
export enum SoundType {
  TICK = 'tick',
  SPIN = 'spin',
  WIN = 'win',
  LOSE = 'lose',
  SELECT = 'select',
  COUNTDOWN = 'countdown',
  TIMEOUT = 'timeout',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * Configuración de sonidos
 */
interface SoundConfig {
  frequency: number;
  duration: number;
  volume: number;
  type?: OscillatorType;
  fadeOut?: boolean;
}

/**
 * Configuraciones predefinidas para cada tipo de sonido
 */
const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  [SoundType.TICK]: {
    frequency: 800,
    duration: 20,
    volume: 0.3,
    type: 'sine',
  },
  [SoundType.SPIN]: {
    frequency: 400,
    duration: 100,
    volume: 0.4,
    type: 'triangle',
  },
  [SoundType.WIN]: {
    frequency: 880,
    duration: 500,
    volume: 0.5,
    type: 'sine',
    fadeOut: true,
  },
  [SoundType.LOSE]: {
    frequency: 200,
    duration: 300,
    volume: 0.4,
    type: 'square',
    fadeOut: true,
  },
  [SoundType.SELECT]: {
    frequency: 600,
    duration: 50,
    volume: 0.3,
    type: 'sine',
  },
  [SoundType.COUNTDOWN]: {
    frequency: 1000,
    duration: 100,
    volume: 0.4,
    type: 'sine',
  },
  [SoundType.TIMEOUT]: {
    frequency: 150,
    duration: 800,
    volume: 0.5,
    type: 'sawtooth',
    fadeOut: true,
  },
  [SoundType.SUCCESS]: {
    frequency: 1200,
    duration: 200,
    volume: 0.4,
    type: 'sine',
  },
  [SoundType.ERROR]: {
    frequency: 300,
    duration: 200,
    volume: 0.3,
    type: 'square',
  },
};

/**
 * Clase principal del servicio de audio
 */
export class AudioService {
  private static instance: AudioService | null = null;
  private audioContext: AudioContext | null = null;
  private masterVolume: number = 1;
  private isMuted: boolean = false;
  private activeNodes: Set<AudioNode> = new Set();

  /**
   * Constructor privado para patrón Singleton
   */
  private constructor() {
    this.initializeContext();
  }

  /**
   * Obtiene la instancia única del servicio
   */
  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  /**
   * Inicializa el contexto de audio
   */
  private initializeContext(): void {
    if (typeof window === 'undefined') return;

    const AudioContextClass = window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      this.audioContext = new AudioContextClass();
    } catch (error) {
      console.warn('AudioContext initialization failed:', error);
    }
  }

  /**
   * Resume el contexto de audio si está suspendido
   */
  public async resumeContext(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Failed to resume AudioContext:', error);
      }
    }
  }

  /**
   * Reproduce un sonido predefinido
   */
  public playSound(soundType: SoundType): void {
    if (!this.audioContext || this.isMuted) return;

    const config = SOUND_CONFIGS[soundType];
    this.playCustomSound(config);
  }

  /**
   * Reproduce un sonido personalizado
   */
  public playCustomSound(config: SoundConfig): void {
    if (!this.audioContext || this.isMuted) return;

    try {
      // Resume context if needed
      this.resumeContext();

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Configurar oscilador
      oscillator.type = config.type || 'sine';
      oscillator.frequency.value = config.frequency;

      // Configurar volumen
      const volume = config.volume * this.masterVolume;
      gainNode.gain.value = volume;

      // Aplicar fade out si está configurado
      if (config.fadeOut) {
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          this.audioContext.currentTime + config.duration / 1000
        );
      }

      // Conectar nodos
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Trackear nodos activos
      this.activeNodes.add(oscillator);

      // Iniciar y detener
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + config.duration / 1000);

      // Limpiar después de terminar
      oscillator.onended = () => {
        this.activeNodes.delete(oscillator);
        oscillator.disconnect();
        gainNode.disconnect();
      };
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  /**
   * Reproduce una secuencia de notas (melodía)
   */
  public playMelody(notes: number[], duration: number = 200, delay: number = 50): void {
    if (!this.audioContext || this.isMuted) return;

    notes.forEach((frequency, index) => {
      setTimeout(() => {
        this.playCustomSound({
          frequency,
          duration,
          volume: 0.3,
          type: 'sine',
          fadeOut: true,
        });
      }, index * (duration + delay));
    });
  }

  /**
   * Reproduce sonido de victoria (melodía ascendente)
   */
  public playVictorySound(): void {
    const notes = [523, 659, 784, 1047]; // C, E, G, C (octava superior)
    this.playMelody(notes, 150, 50);
  }

  /**
   * Reproduce sonido de derrota (melodía descendente)
   */
  public playDefeatSound(): void {
    const notes = [440, 415, 392, 349]; // A, G#, G, F
    this.playMelody(notes, 200, 30);
  }

  /**
   * Configura el volumen maestro
   */
  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Obtiene el volumen maestro actual
   */
  public getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Silencia/desilencia todos los sonidos
   */
  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAllSounds();
    }
  }

  /**
   * Obtiene el estado de silencio
   */
  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Detiene todos los sonidos activos
   */
  public stopAllSounds(): void {
    this.activeNodes.forEach(node => {
      try {
        if ('stop' in node && typeof node.stop === 'function') {
          (node as OscillatorNode).stop();
        }
      } catch {
        // El nodo ya pudo haber sido detenido - silenciar error
      }
    });
    this.activeNodes.clear();
  }

  /**
   * Limpia y libera recursos
   */
  public dispose(): void {
    this.stopAllSounds();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    AudioService.instance = null;
  }
}

// Exportar instancia singleton
export const audioService = AudioService.getInstance();