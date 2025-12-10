export class AiMcpWrapper {
    adapter;
    constructor(adapter) {
        this.adapter = adapter;
    }
    getTools() {
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
    async executeTool(name, args) {
        switch (name) {
            case 'ai_chat':
                // Note: We are not passing tools here to avoid recursion or complexity for now.
                return this.adapter.chat(args.systemPrompt, args.userMessage);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
}
