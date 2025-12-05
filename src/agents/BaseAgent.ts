import { MCPServer } from '../core/mcp/server.js';
import { MCP_MESSAGE_TYPES } from '../core/mcp/protocol.js';
import { PersistencePort } from '../core/domain/ports/PersistencePort.js';
import { configService } from '../infra/config/ConfigService.js';

const LOG_LEVELS: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };

export abstract class BaseAgent extends MCPServer {
  protected name: string;
  protected capabilities: Set<string>;
  protected db: PersistencePort;

  constructor(name: string, db: PersistencePort) {
    super();
    this.name = name;
    this.capabilities = new Set();
    this.db = db;
  }

  async log(type: string, data: any) {
    const currentLevel = configService.get('logLevel') || 'info';
    
    let level = 'info';
    if (type === 'error' || type === 'critical') level = 'error';
    else if (type === 'warning') level = 'warn';
    else if (type === 'debug') level = 'debug';

    if (LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]) {
      console.log(`[${this.name}] ${type}:`, JSON.stringify(data, null, 2));
    }

    try {
      // Map 'type' to message and 'level' to level
      // The original code passed 'type' as the message type (e.g. 'tool_execution')
      // and inferred level.
      // PersistencePort.saveLog(agent, message, level, data)
      await this.db.saveLog(this.name, type, level, data);
    } catch (err: any) {
      console.error(`[${this.name}] Failed to save log to DB:`, err.message);
    }
  }

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
}
