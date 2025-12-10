import { McpToolProvider } from '../../../core/mcp/McpToolProvider.js';
import { EmailPort } from '../../../core/domain/ports/EmailPort.js';
import { ToolDefinition } from '../../../core/domain/ports/AiPort.js';

export class EmailMcpWrapper implements McpToolProvider {
    constructor(private adapter: EmailPort) {}

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'email_send',
                description: 'Send an email.',
                parameters: {
                    type: 'object',
                    properties: {
                        to: { type: 'string' },
                        subject: { type: 'string' },
                        body: { type: 'string' }
                    },
                    required: ['to', 'subject', 'body']
                }
            },
            {
                name: 'email_receive',
                description: 'Check for new emails.',
                parameters: {
                    type: 'object',
                    properties: {
                        filter: { type: 'object' }
                    },
                    required: []
                }
            }
        ];
    }

    async executeTool(name: string, args: any): Promise<any> {
        switch (name) {
            case 'email_send':
                return this.adapter.sendEmail(args.to, args.subject, args.body);
            case 'email_receive':
                return this.adapter.receiveEmails(args.filter);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
}
