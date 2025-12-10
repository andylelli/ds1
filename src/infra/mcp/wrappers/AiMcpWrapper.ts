import { McpToolProvider } from '../../../core/mcp/McpToolProvider.js';
import { AiPort } from '../../../core/domain/ports/AiPort.js';
import { ToolDefinition } from '../../../core/domain/ports/AiPort.js';

export class AiMcpWrapper implements McpToolProvider {
    constructor(private adapter: AiPort) {}

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'ai_chat',
                description: 'Send a message to the AI model.',
                parameters: {
                    type: 'object',
                    properties: {
                        systemPrompt: { type: 'string' },
                        userMessage: { type: 'string' }
                    },
                    required: ['systemPrompt', 'userMessage']
                }
            }
        ];
    }

    async executeTool(name: string, args: any): Promise<any> {
        switch (name) {
            case 'ai_chat':
                // Note: We are not passing tools here to avoid recursion or complexity for now.
                return this.adapter.chat(args.systemPrompt, args.userMessage);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
}
