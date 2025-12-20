import fs from 'fs';
import path from 'path';
import { LoggerPort } from '../../core/domain/ports/LoggerPort.js';

export class FileLoggerAdapter implements LoggerPort {
  private logFile: string;

  constructor(mode: 'live' | 'simulation' | 'mock', filename: string) {
    // Map 'mock' to 'simulation' folder for simplicity, or keep separate if preferred.
    // The plan said logs/live or logs/simulation.
    const folder = mode === 'live' ? 'live' : 'simulation';
    this.logFile = path.resolve(process.cwd(), 'logs', folder, filename);
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    const dir = path.dirname(this.logFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private write(level: string, message: string, context?: any) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : '';
    const line = `[${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}\n`;
    
    fs.appendFile(this.logFile, line, (err) => {
      if (err) console.error('Failed to write to log file', err);
    });
  }

  debug(message: string, context?: any): void {
    this.write('debug', message, context);
  }

  info(message: string, context?: any): void {
    this.write('info', message, context);
  }

  warn(message: string, context?: any): void {
    this.write('warn', message, context);
  }

  error(message: string, trace?: any): void {
    this.write('error', message, trace);
  }
}
