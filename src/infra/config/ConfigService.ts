import fs from 'fs';
import path from 'path';

export interface AppConfig {
  dbMode: 'live' | 'test';
  adsMode: 'mock' | 'test' | 'live';
  shopMode: 'mock' | 'test' | 'live';
  trendsMode: 'mock' | 'live';
  researchMode: 'mock' | 'live';
  fulfilmentMode: 'mock' | 'live';
  emailMode: 'mock' | 'live';
  ceoMode: 'mock' | 'live';
  loggingMode: 'console' | 'file';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  useSimulatedEndpoints: boolean;
  openaiEnabled: boolean;
  databaseUrl?: string;
  simulatorDatabaseUrl?: string;
  trafficScale?: number;
}

const CONFIG_FILE = path.resolve(process.cwd(), 'config.json');

const defaults: AppConfig = {
  dbMode: 'test',
  adsMode: 'mock',
  shopMode: 'mock',
  trendsMode: 'mock',
  researchMode: 'mock',
  fulfilmentMode: 'mock',
  emailMode: 'mock',
  ceoMode: 'live',
  loggingMode: 'console',
  logLevel: 'info',
  useSimulatedEndpoints: true,
  openaiEnabled: true,
  trafficScale: 1.0
};

export class ConfigService {
  private config: AppConfig;

  constructor() {
    this.config = { ...defaults };
    this.loadConfig();
    this.loadEnvOverrides();
  }

  private loadConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
      try {
        const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        this.config = { ...this.config, ...saved };
      } catch (e) {
        console.error("Failed to load config.json, using defaults.");
      }
    }
  }

  private loadEnvOverrides() {
    if (process.env.DS1_MODE === 'live') {
      this.config.dbMode = 'live';
      this.config.useSimulatedEndpoints = false;
    } else if (process.env.DS1_MODE === 'test') {
      this.config.dbMode = 'test';
      this.config.useSimulatedEndpoints = true;
    }
    
    if (process.env.DATABASE_URL) {
        this.config.databaseUrl = process.env.DATABASE_URL;
    }
  }

  public get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  public getAll(): AppConfig {
    return { ...this.config };
  }

  public set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.config[key] = value;
    this.saveConfig();
  }

  public update(newConfig: Partial<AppConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  private saveConfig() {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
    } catch (e) {
      console.error("Failed to save config.json", e);
    }
  }
}

export const configService = new ConfigService();
