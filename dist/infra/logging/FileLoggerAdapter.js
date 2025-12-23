import fs from 'fs';
import path from 'path';
export class FileLoggerAdapter {
    logFile;
    prettyPrint;
    constructor(mode, filename, prettyPrint = false) {
        // Map 'mock' to 'simulation' folder for simplicity, or keep separate if preferred.
        // The plan said logs/live or logs/simulation.
        const folder = mode === 'live' ? 'live' : 'simulation';
        this.logFile = path.resolve(process.cwd(), 'logs', folder, filename);
        this.prettyPrint = prettyPrint;
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
        let contextStr = '';
        if (context) {
            contextStr = this.prettyPrint
                ? '\n' + JSON.stringify(context, null, 2)
                : JSON.stringify(context);
        }
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
