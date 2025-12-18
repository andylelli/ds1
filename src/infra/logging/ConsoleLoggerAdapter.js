export class ConsoleLoggerAdapter {
    debug(message, context) {
        console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, context || '');
    }
    info(message, context) {
        console.info(`[INFO] ${new Date().toISOString()} - ${message}`, context || '');
    }
    warn(message, context) {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, context || '');
    }
    error(message, trace) {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, trace || '');
    }
}
