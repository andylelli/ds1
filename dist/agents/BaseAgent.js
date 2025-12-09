import { MCPServer } from '../core/mcp/server.js';
import { MCP_MESSAGE_TYPES } from '../core/mcp/protocol.js';
import { configService } from '../infra/config/ConfigService.js';
import { logger } from '../infra/logging/LoggerService.js';
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
export class BaseAgent extends MCPServer {
    name;
    capabilities;
    db;
    mode = 'live'; // Default to live mode
    constructor(name, db) {
        super();
        this.name = name;
        this.capabilities = new Set();
        this.db = db;
    }
    /**
     * Set the agent's operating mode (simulation or live)
     */
    setMode(mode) {
        this.mode = mode;
    }
    /**
     * Get the database source based on current mode
     */
    getSource() {
        return this.mode === 'simulation' ? 'sim' : 'live';
    }
    async log(type, data) {
        const currentLevel = configService.get('logLevel') || 'info';
        let level = 'info';
        if (type === 'error' || type === 'critical')
            level = 'error';
        else if (type === 'warning')
            level = 'warn';
        else if (type === 'debug')
            level = 'debug';
        // Use the new Logger Service
        const logMsg = typeof data === 'string' ? data : JSON.stringify(data);
        const context = { agent: this.name, type };
        if (level === 'error')
            logger.error(logMsg, context);
        else if (level === 'warn')
            logger.warn(logMsg, context);
        else if (level === 'debug')
            logger.debug(logMsg, context);
        else
            logger.info(logMsg, context);
        // Determine message and data for storage
        let message = type;
        let storageData = data;
        // If data is a string, use it as the message for better readability
        if (typeof data === 'string') {
            message = data;
            storageData = { type }; // Keep the original type in data
        }
        try {
            await this.db.saveLog(this.name, message, level, storageData);
        }
        catch (err) {
            logger.error(`[${this.name}] Failed to save log to DB:`, err.message);
        }
    }
    async handleMessage(message) {
        switch (message.method) {
            case MCP_MESSAGE_TYPES.PLAN_REQUEST:
                await this.handlePlanRequest(message);
                break;
            case MCP_MESSAGE_TYPES.CRITIQUE_REQUEST:
                await this.handleCritiqueRequest(message);
                break;
            default:
                await super.handleMessage(message);
        }
    }
    async handleToolCall(message) {
        const { name, arguments: args } = message.params;
        await this.log('tool_execution', { tool: name, args });
        await super.handleToolCall(message);
    }
    async handlePlanRequest(message) {
        this.sendError(message.id, -32601, `Agent ${this.name} does not support planning`);
    }
    async handleCritiqueRequest(message) {
        this.sendError(message.id, -32601, `Agent ${this.name} does not support critiquing`);
    }
}
