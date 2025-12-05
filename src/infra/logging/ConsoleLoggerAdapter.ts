import { LoggerPort } from '../../core/domain/ports/LoggerPort.js';

export class ConsoleLoggerAdapter implements LoggerPort {
  debug(message: string, context?: any): void {
    console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, context || '');
  }

  info(message: string, context?: any): void {
    console.info(`[INFO] ${new Date().toISOString()} - ${message}`, context || '');
  }

  warn(message: string, context?: any): void {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, context || '');
  }

  error(message: string, trace?: any): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, trace || '');
  }
}
