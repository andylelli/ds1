import { MCPServer } from '../core/mcp/server.js';
import { MCP_MESSAGE_TYPES } from '../core/mcp/protocol.js';
import { PersistencePort } from '../core/domain/ports/PersistencePort.js';
import { EventBusPort } from '../core/domain/ports/EventBusPort.js';
import { configService } from '../infra/config/ConfigService.js';
import { logger } from '../infra/logging/LoggerService.js';
import { LogActivity } from '../core/utils/decorators/LogActivity.js';

const LOG_LEVELS: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };

export abstract class BaseAgent extends MCPServer {
  protected name: string;
  protected capabilities: Set<string>;
  protected db: PersistencePort;
  protected eventBus: EventBusPort;
  protected mode: 'simulation' | 'live' | 'mock' = 'live'; // Default to live mode

  constructor(name: string, db: PersistencePort, eventBus: EventBusPort) {
    super();
    this.name = name;
    this.capabilities = new Set();
    this.db = db;
    this.eventBus = eventBus;
  }

  /**
   * Set the agent's operating mode (simulation or live or mock)
   */
  setMode(mode: 'simulation' | 'live' | 'mock') {
    this.mode = mode;
  }

  /**
   * Get the agent's operating mode
   */
  getMode(): 'simulation' | 'live' | 'mock' {
    return this.mode;
  }

  /**
   * Get the database source based on current mode
   */
  protected getSource(): string {
    if (this.mode === 'simulation' || this.mode === 'mock') return 'sim';
    return 'live';
  }

  async log(type: string, data: any) {
    const currentLevel = configService.get('logLevel') || 'info';
    
    let level = 'info';
    if (type === 'error' || type === 'critical') level = 'error';
    else if (type === 'warning') level = 'warn';
    else if (type === 'debug') level = 'debug';

    // Use the new Logger Service
    let logMsg = '';
    let context: any = { agent: this.name, type };

    if (typeof data === 'string') {
        logMsg = `[${type}] ${data}`;
    } else {
        logMsg = `[${type}]`;
        context = { ...context, ...data };
    }

    if (level === 'error') logger.error(logMsg, context);
    else if (level === 'warn') logger.warn(logMsg, context);
    else if (level === 'debug') logger.debug(logMsg, context);
    else logger.info(logMsg, context);

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
    } catch (err: any) {
      logger.error(`[${this.name}] Failed to save log to DB:`, err.message);
    }
  }

  @LogActivity()
  async handleMessage(message: any) {
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

  async handleToolCall(message: any) {
    const { name, arguments: args } = message.params;
    await this.log('tool_execution', { tool: name, args });
    await super.handleToolCall(message);
  }

  async handlePlanRequest(message: any) {
    this.sendError(message.id, -32601, `Agent ${this.name} does not support planning`);
  }

  async handleCritiqueRequest(message: any) {
    this.sendError(message.id, -32601, `Agent ${this.name} does not support critiquing`);
  }

  /**
   * Generic event handler for workflow actions.
   * Override this in specific agents to handle dynamic actions.
   */
  async handleEvent(event: string, action: string, payload: any): Promise<void> {
      await this.log('warn', `Agent ${this.name} received event '${event}' with action '${action}' but has no specific handler.`);
  }
}
