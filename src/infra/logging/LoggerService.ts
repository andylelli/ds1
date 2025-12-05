import { LoggerPort } from '../../core/domain/ports/LoggerPort.js';
import { ConsoleLoggerAdapter } from './ConsoleLoggerAdapter.js';
import { FileLoggerAdapter } from './FileLoggerAdapter.js';
import { configService } from '../config/ConfigService.js';

class LoggerService implements LoggerPort {
  private adapter: LoggerPort;

  constructor() {
    const mode = configService.get('loggingMode');
    if (mode === 'file') {
      this.adapter = new FileLoggerAdapter();
    } else {
      this.adapter = new ConsoleLoggerAdapter();
    }
  }

  debug(message: string, context?: any): void {
    this.adapter.debug(message, context);
  }

  info(message: string, context?: any): void {
    this.adapter.info(message, context);
  }

  warn(message: string, context?: any): void {
    this.adapter.warn(message, context);
  }

  error(message: string, trace?: any): void {
    this.adapter.error(message, trace);
  }
}

export const logger = new LoggerService();
