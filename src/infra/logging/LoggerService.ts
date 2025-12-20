import { LoggerPort } from '../../core/domain/ports/LoggerPort.js';
import { ConsoleLoggerAdapter } from './ConsoleLoggerAdapter.js';
import { FileLoggerAdapter } from './FileLoggerAdapter.js';
import { configService } from '../config/ConfigService.js';

class LoggerService implements LoggerPort {
  private activityLogger: LoggerPort;
  private errorLogger: LoggerPort;
  private externalLogger: LoggerPort;

  constructor() {
    const loggingMode = configService.get('loggingMode');
    // Determine system mode (live vs simulation)
    // We can infer this from dbMode or explicitly from a new config. 
    // ConfigService has dbMode: 'live' | 'test'. 'test' usually implies simulation.
    // Or process.env.DS1_MODE.
    // Let's use ConfigService.get('dbMode') mapping: live -> live, test -> simulation.
    const dbMode = configService.get('dbMode');
    const systemMode = dbMode === 'live' ? 'live' : 'simulation';

    if (loggingMode === 'file') {
      this.activityLogger = new FileLoggerAdapter(systemMode, 'activity.log');
      this.errorLogger = new FileLoggerAdapter(systemMode, 'error.log');
      this.externalLogger = new FileLoggerAdapter(systemMode, 'external.log');
    } else {
      // Default to console for all
      const consoleAdapter = new ConsoleLoggerAdapter();
      this.activityLogger = consoleAdapter;
      this.errorLogger = consoleAdapter;
      this.externalLogger = consoleAdapter;
    }
  }

  debug(message: string, context?: any): void {
    // Debug goes to activity log (file only usually, but here just activity stream)
    this.activityLogger.debug(message, context);
  }

  info(message: string, context?: any): void {
    // Info goes to activity log
    this.activityLogger.info(message, context);
  }

  warn(message: string, context?: any): void {
    // Warn goes to activity log
    this.activityLogger.warn(message, context);
  }

  error(message: string, trace?: any): void {
    // Error goes to error log (and potentially activity log if we want a record there too, but plan says error log)
    this.errorLogger.error(message, trace);
  }

  /**
   * Log external API interactions
   */
  external(provider: string, action: string, context?: any): void {
    const message = `[${provider}] ${action}`;
    this.externalLogger.info(message, context);
  }
}

export const logger = new LoggerService();
