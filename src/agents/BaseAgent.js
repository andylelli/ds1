var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { MCPServer } from '../core/mcp/server.js';
import { MCP_MESSAGE_TYPES } from '../core/mcp/protocol.js';
import { configService } from '../infra/config/ConfigService.js';
import { logger } from '../infra/logging/LoggerService.js';
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
export class BaseAgent extends MCPServer {
    constructor(name, db, eventBus) {
        super();
        this.mode = 'live'; // Default to live mode
        this.name = name;
        this.capabilities = new Set();
        this.db = db;
        this.eventBus = eventBus;
    }
    /**
     * Set the agent's operating mode (simulation or live or mock)
     */
    setMode(mode) {
        this.mode = mode;
    }
    /**
     * Get the agent's operating mode
     */
    getMode() {
        return this.mode;
    }
    /**
     * Get the database source based on current mode
     */
    getSource() {
        if (this.mode === 'simulation' || this.mode === 'mock')
            return 'sim';
        return 'live';
    }
    log(type, data) {
        return __awaiter(this, void 0, void 0, function* () {
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
                yield this.db.saveLog(this.name, message, level, storageData);
            }
            catch (err) {
                logger.error(`[${this.name}] Failed to save log to DB:`, err.message);
            }
        });
    }
    handleMessage(message) {
        const _super = Object.create(null, {
            handleMessage: { get: () => super.handleMessage }
        });
        return __awaiter(this, void 0, void 0, function* () {
            switch (message.method) {
                case MCP_MESSAGE_TYPES.PLAN_REQUEST:
                    yield this.handlePlanRequest(message);
                    break;
                case MCP_MESSAGE_TYPES.CRITIQUE_REQUEST:
                    yield this.handleCritiqueRequest(message);
                    break;
                default:
                    yield _super.handleMessage.call(this, message);
            }
        });
    }
    handleToolCall(message) {
        const _super = Object.create(null, {
            handleToolCall: { get: () => super.handleToolCall }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const { name, arguments: args } = message.params;
            yield this.log('tool_execution', { tool: name, args });
            yield _super.handleToolCall.call(this, message);
        });
    }
    handlePlanRequest(message) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sendError(message.id, -32601, `Agent ${this.name} does not support planning`);
        });
    }
    handleCritiqueRequest(message) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sendError(message.id, -32601, `Agent ${this.name} does not support critiquing`);
        });
    }
    /**
     * Generic event handler for workflow actions.
     * Override this in specific agents to handle dynamic actions.
     */
    handleEvent(event, action, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.log('warn', `Agent ${this.name} received event '${event}' with action '${action}' but has no specific handler.`);
        });
    }
}
