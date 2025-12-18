import fs from 'fs';
import path from 'path';
const CONFIG_FILE = path.resolve(process.cwd(), 'config.json');
const defaults = {
    dbMode: process.env.DS1_MODE === 'live' ? 'live' : 'test',
    adsMode: process.env.DS1_MODE === 'live' ? 'live' : 'mock',
    shopMode: process.env.DS1_MODE === 'live' ? 'live' : 'mock',
    trendsMode: process.env.DS1_MODE === 'live' ? 'live' : 'mock',
    researchMode: process.env.DS1_MODE === 'live' ? 'live' : 'mock',
    fulfilmentMode: process.env.DS1_MODE === 'live' ? 'live' : 'mock',
    emailMode: process.env.DS1_MODE === 'live' ? 'live' : 'mock',
    ceoMode: process.env.DS1_MODE === 'live' ? 'live' : 'mock',
    loggingMode: 'console',
    logLevel: 'info',
    useSimulatedEndpoints: process.env.DS1_MODE !== 'live',
    openaiEnabled: true,
    trafficScale: 1.0,
    stagingEnabled: true,
    stagingAutoApproveThreshold: 0,
    stagingAutoRejectThreshold: 0,
    stagingExpiryDays: 7
};
export class ConfigService {
    constructor() {
        this.config = Object.assign({}, defaults);
        this.loadConfig();
        this.loadEnvOverrides();
    }
    loadConfig() {
        if (fs.existsSync(CONFIG_FILE)) {
            try {
                const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
                this.config = Object.assign(Object.assign({}, this.config), saved);
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
        if (process.env.SIMULATOR_DATABASE_URL) {
            this.config.simulatorDatabaseUrl = process.env.SIMULATOR_DATABASE_URL;
        }
    }
    get(key) {
        return this.config[key];
    }
    getAll() {
        return Object.assign({}, this.config);
    }
    set(key, value) {
        this.config[key] = value;
        this.saveConfig();
    }
    update(newConfig) {
        this.config = Object.assign(Object.assign({}, this.config), newConfig);
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
