/**
 * Sistema de logging optimizado para TV
 * Controla la verbosidad según el ambiente y permite filtrar logs en producción
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface TVLoggerConfig {
  enabled: boolean;
  level: LogLevel;
  showTimestamp: boolean;
  prefix: string;
}

class TVLogger {
  private config: TVLoggerConfig;
  
  constructor(config: Partial<TVLoggerConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
      showTimestamp: true,
      prefix: '📺 TV',
      ...config
    };
  }

  private getLevelPriority(level: LogLevel): number {
    const priorities = { debug: 0, info: 1, warn: 2, error: 3 };
    return priorities[level];
  }

  private shouldLog(level: LogLevel): boolean {
    return this.config.enabled && 
           this.getLevelPriority(level) >= this.getLevelPriority(this.config.level);
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = this.config.showTimestamp 
      ? `[${new Date().toISOString().substr(11, 12)}] ` 
      : '';
    
    return `${timestamp}${this.config.prefix}-${level.toUpperCase()}: ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), ...args);
    }
  }

  // Métodos especializados para diferentes aspectos de la TV
  realtime(message: string, ...args: unknown[]): void {
    this.debug(`REALTIME: ${message}`, ...args);
  }

  session(message: string, ...args: unknown[]): void {
    this.debug(`SESSION: ${message}`, ...args);
  }

  participant(message: string, ...args: unknown[]): void {
    this.debug(`PARTICIPANT: ${message}`, ...args);
  }

  game(message: string, ...args: unknown[]): void {
    this.debug(`GAME: ${message}`, ...args);
  }

  performance(message: string, ...args: unknown[]): void {
    this.info(`PERFORMANCE: ${message}`, ...args);
  }
}

// Instancia principal para la TV
export const tvLogger = new TVLogger();

// Instancia con solo errores para producción crítica
export const tvProdLogger = new TVLogger({
  enabled: true,
  level: 'error',
  showTimestamp: true,
  prefix: '📺 TV-PROD'
});

export default tvLogger; 