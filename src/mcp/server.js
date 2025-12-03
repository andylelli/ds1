/**
 * MCP Server Core
 * 
 * What it does:
 * - Implements the base server logic for the Model Context Protocol.
 * - Handles message parsing, validation, and routing to registered tools/resources.
 * - Manages JSON-RPC error handling and response formatting.
 * 
 * Interacts with:
 * - MCP Protocol definitions (/src/mcp/protocol.js)
 * - Standard Input/Output (stdio) or direct method calls.
 */
import { createInterface } from 'readline';
import { MCP_MESSAGE_TYPES } from './protocol.js';

export class MCPServer {
  constructor() {
    this.tools = new Map();
    this.resources = new Map();
  }

  registerTool(name, handler) {
    this.tools.set(name, handler);
  }

  registerResource(uri, handler) {
    this.resources.set(uri, handler);
  }

  async start() {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    process.stderr.write(`[MCP Server] Started. Listening on stdio...\n`);

    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const message = JSON.parse(line);
        await this.handleMessage(message);
      } catch (error) {
        this.sendError(null, -32700, 'Parse error');
      }
    }
  }

  async handleMessage(message) {
    if (!message.method) return; // Ignore invalid messages

    try {
      switch (message.method) {
        case 'initialize':
          this.sendResult(message.id, {
            protocolVersion: '0.1.0',
            capabilities: {
              tools: {},
              resources: {},
            },
            serverInfo: {
              name: 'ds1-agent',
              version: '1.0.0',
            },
          });
          break;

        case MCP_MESSAGE_TYPES.TASK_REQUEST: // tools/call
          await this.handleToolCall(message);
          break;

        case MCP_MESSAGE_TYPES.RESOURCE_REQUEST: // resources/read
          await this.handleResourceRead(message);
          break;

        default:
          // For now, ignore unknown methods or send method not found
          // this.sendError(message.id, -32601, 'Method not found');
          break;
      }
    } catch (error) {
      this.sendError(message.id, -32603, `Internal error: ${error.message}`);
    }
  }

  async handleToolCall(message) {
    const { name, arguments: args } = message.params;
    const tool = this.tools.get(name);

    if (!tool) {
      this.sendError(message.id, -32601, `Tool '${name}' not found`);
      return;
    }

    try {
      const result = await tool(args);
      this.sendResult(message.id, {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      });
    } catch (error) {
      this.sendError(message.id, -32000, `Tool execution failed: ${error.message}`);
    }
  }

  async handleResourceRead(message) {
    const { uri } = message.params;
    const resource = this.resources.get(uri);

    if (!resource) {
      this.sendError(message.id, -32601, `Resource '${uri}' not found`);
      return;
    }

    try {
      const content = await resource();
      this.sendResult(message.id, {
        contents: [
          {
            uri: uri,
            mimeType: 'application/json',
            text: JSON.stringify(content),
          },
        ],
      });
    } catch (error) {
      this.sendError(message.id, -32000, `Resource read failed: ${error.message}`);
    }
  }

  sendResult(id, result) {
    const response = {
      jsonrpc: '2.0',
      id,
      result,
    };
    process.stdout.write(JSON.stringify(response) + '\n');
  }

  sendError(id, code, message) {
    const response = {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
      },
    };
    process.stdout.write(JSON.stringify(response) + '\n');
  }

  log(level, message) {
    const notification = {
      jsonrpc: '2.0',
      method: 'notifications/message',
      params: {
        level,
        data: message,
      },
    };
    process.stdout.write(JSON.stringify(notification) + '\n');
  }
}
