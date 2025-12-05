import { ConsoleLoggerAdapter } from './ConsoleLoggerAdapter.js';
import { FileLoggerAdapter } from './FileLoggerAdapter.js';
import { configService } from '../config/ConfigService.js';
class LoggerService {
    adapter;
    constructor() {
        const mode = configService.get('loggingMode');
        if (mode === 'file') {
            this.adapter = new FileLoggerAdapter();
        }
        else {
            this.adapter = new ConsoleLoggerAdapter();
        }
    }
    debug(message, context) {
        this.adapter.debug(message, context);
    }
    info(message, context) {
        this.adapter.info(message, context);
    }
    warn(message, context) {
        this.adapter.warn(message, context);
    }
    error(message, trace) {
        this.adapter.error(message, trace);
    }
}
export const logger = new LoggerService();
