import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.resolve(process.cwd(), 'config.json');

// Default Configuration
const defaults = {
  dbMode: 'mock', // 'mock' or 'live'
  logLevel: 'info', // 'debug', 'info', 'warn', 'error'
  useSimulatedEndpoints: true, // Toggle for 3rd party APIs
  openaiEnabled: true
};

let currentConfig = { ...defaults };

// Load config from disk on startup
if (fs.existsSync(CONFIG_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    currentConfig = { ...defaults, ...saved };
  } catch (e) {
    console.error("Failed to load config.json, using defaults.");
  }
}

// Environment Variable Overrides
if (process.env.DS1_MODE === 'mock') {
  currentConfig.dbMode = 'mock';
  currentConfig.useSimulatedEndpoints = true;
} else if (process.env.DS1_MODE === 'live') {
  currentConfig.dbMode = 'live';
  currentConfig.useSimulatedEndpoints = false;
}

export const config = {
  get: (key) => currentConfig[key],
  getAll: () => ({ ...currentConfig }),
  set: (key, value) => {
    currentConfig[key] = value;
    saveConfig();
  },
  update: (newConfig) => {
    currentConfig = { ...currentConfig, ...newConfig };
    saveConfig();
  }
};

function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(currentConfig, null, 2));
  } catch (e) {
    console.error("Failed to save config.json");
  }
}
