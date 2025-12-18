import fs from 'fs';
import path from 'path';
export class FileLoggerAdapter {
    constructor(filename = 'app.log') {
        this.logFile = path.resolve(process.cwd(), 'logs', filename);
        this.ensureLogDirectory();
    }
    ensureLogDirectory() {
        const dir = path.dirname(this.logFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    write(level, message, context) {
        const timestamp = new Date().toISOString();
        const contextStr = context ? JSON.stringify(context) : '';
        const line = `[${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}\n`;
        fs.appendFile(this.logFile, line, (err) => {
            if (err)
                console.error('Failed to write to log file', err);
        });
    }
    debug(message, context) {
        this.write('debug', message, context);
    }
    info(message, context) {
        this.write('info', message, context);
    }
    warn(message, context) {
        this.write('warn', message, context);
    }
    error(message, trace) {
        this.write('error', message, trace);
    }
}
