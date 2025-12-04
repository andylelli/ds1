/**
 * Base Agent Class
 * 
 * What it does:
 * - Extends the generic MCPServer to create an Agent.
 * - Adds handling for agent-specific message types like 'agent/plan' and 'agent/critique'.
 * - Serves as the parent class for all specific agents.
 * 
 * Interacts with:
 * - MCP Server (/src/mcp/server.js)
 * - MCP Protocol (/src/mcp/protocol.js)
 */
import { MCPServer } from '../mcp/server.js';
import { MCP_MESSAGE_TYPES } from '../mcp/protocol.js';
import { saveAgentLog } from '../lib/db.js';
import { config } from '../lib/config.js';

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

export class BaseAgent extends MCPServer {
  constructor(name) {
    super();
    this.name = name;
    this.capabilities = new Set();
  }

  async log(type, data) {
    const currentLevel = config.get('logLevel') || 'info';
    
    // Map 'type' to a level. Default to 'info' if unknown.
    let level = 'info';
    if (type === 'error' || type === 'critical') level = 'error';
    else if (type === 'warning') level = 'warn';
    else if (type === 'debug') level = 'debug';

    if (LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]) {
      console.log(`[${this.name}] ${type}:`, JSON.stringify(data, null, 2));
    }

    // Always save to DB regardless of console log level, 
    // unless we want to filter DB noise too. For now, keep full history in DB.
    try {
      await saveAgentLog(this.name, type, data);
    } catch (err) {
      console.error(`[${this.name}] Failed to save log to DB:`, err.message);
    }
  }

  async handleMessage(message) {
    // Intercept specific agent message types before passing to default handler
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
