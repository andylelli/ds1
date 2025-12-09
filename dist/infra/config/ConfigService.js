import fs from 'fs';
import path from 'path';
const CONFIG_FILE = path.resolve(process.cwd(), 'config.json');
const defaults = {
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
    config;
    constructor() {
        this.config = { ...defaults };
        this.loadConfig();
        this.loadEnvOverrides();
    }
    loadConfig() {
        if (fs.existsSync(CONFIG_FILE)) {
            try {
                const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
                this.config = { ...this.config, ...saved };
            }
            catch (e) {
                console.error("Failed to load config.json, using defaults.");
            }
        }
    }
    loadEnvOverrides() {
        if (process.env.DS1_MODE === 'live') {
            this.config.dbMode = 'live';
            this.config.useSimulatedEndpoints = false;
        }
        else if (process.env.DS1_MODE === 'test') {
            this.config.dbMode = 'test';
            this.config.useSimulatedEndpoints = true;
        }
        if (process.env.DATABASE_URL) {
            this.config.databaseUrl = process.env.DATABASE_URL;
        }
    }
    get(key) {
        return this.config[key];
    }
    getAll() {
        return { ...this.config };
    }
    set(key, value) {
        this.config[key] = value;
        this.saveConfig();
    }
    update(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();
    }
    saveConfig() {
        try {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
        }
        catch (e) {
            console.error("Failed to save config.json", e);
        }
    }
}
export const configService = new ConfigService();
