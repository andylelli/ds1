import { ToolDefinition } from '../domain/ports/AiPort.js';

export interface McpToolProvider {
    getTools(): ToolDefinition[];
    executeTool(name: string, args: any): Promise<any>;
}
