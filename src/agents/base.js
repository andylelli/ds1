import { MCPServer } from '../mcp/server.js';
import { MCP_MESSAGE_TYPES } from '../mcp/protocol.js';

export class BaseAgent extends MCPServer {
  constructor(name) {
    super();
    this.name = name;
    this.capabilities = new Set();
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

  async handlePlanRequest(message) {
    this.sendError(message.id, -32601, `Agent ${this.name} does not support planning`);
  }

  async handleCritiqueRequest(message) {
    this.sendError(message.id, -32601, `Agent ${this.name} does not support critiquing`);
  }
}
