import { ConsoleLoggerAdapter } from './ConsoleLoggerAdapter.js';
import { FileLoggerAdapter } from './FileLoggerAdapter.js';
import { configService } from '../config/ConfigService.js';
class LoggerService {
    activityLogger;
    errorLogger;
    externalLogger;
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
        }
        else {
            // Default to console for all
            const consoleAdapter = new ConsoleLoggerAdapter();
            this.activityLogger = consoleAdapter;
            this.errorLogger = consoleAdapter;
            this.externalLogger = consoleAdapter;
        }
    }
    debug(message, context) {
        // Debug goes to activity log (file only usually, but here just activity stream)
        this.activityLogger.debug(message, context);
    }
    info(message, context) {
        // Info goes to activity log
        this.activityLogger.info(message, context);
    }
    warn(message, context) {
        // Warn goes to activity log
        this.activityLogger.warn(message, context);
    }
    error(message, trace) {
        // Error goes to error log (and potentially activity log if we want a record there too, but plan says error log)
        this.errorLogger.error(message, trace);
    }
    /**
     * Log external API interactions
     */
    external(provider, action, context) {
        const message = `[${provider}] ${action}`;
        this.externalLogger.info(message, context);
    }
}
export const logger = new LoggerService();
