import { createInterface } from 'readline';
import { MCP_MESSAGE_TYPES } from './protocol.js';
export class MCPServer {
    tools;
    resources;
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
            if (!line.trim())
                continue;
            try {
                const message = JSON.parse(line);
                await this.handleMessage(message);
            }
            catch (error) {
                this.sendError(null, -32700, 'Parse error');
            }
        }
    }
    async handleMessage(message) {
        // Basic routing
        if (message.method === MCP_MESSAGE_TYPES.TOOL_CALL) {
            await this.handleToolCall(message);
        }
        else if (message.method === MCP_MESSAGE_TYPES.RESOURCE_READ) {
            await this.handleResourceRead(message);
        }
        else {
            // Unknown method
            // In a real server we might return method not found, but here we just ignore or log
        }
    }
    async handleToolCall(message) {
        const { name, arguments: args } = message.params;
        const handler = this.tools.get(name);
        if (handler) {
            try {
                const result = await handler(args);
                this.sendResult(message.id, result);
            }
            catch (e) {
                this.sendError(message.id, -32603, e.message);
            }
        }
        else {
            this.sendError(message.id, -32601, `Tool ${name} not found`);
        }
    }
    async handleResourceRead(message) {
        const { uri } = message.params;
        const handler = this.resources.get(uri);
        if (handler) {
            try {
                const result = await handler(uri);
                this.sendResult(message.id, result);
            }
            catch (e) {
                this.sendError(message.id, -32603, e.message);
            }
        }
        else {
            this.sendError(message.id, -32601, `Resource ${uri} not found`);
        }
    }
    sendResult(id, result) {
        if (id === undefined || id === null)
            return;
        const response = {
            jsonrpc: '2.0',
            id,
            result
        };
        console.log(JSON.stringify(response));
    }
    sendError(id, code, message) {
        if (id === undefined || id === null)
            return;
        const response = {
            jsonrpc: '2.0',
            id,
            error: {
                code,
                message
            }
        };
        console.log(JSON.stringify(response));
    }
}
