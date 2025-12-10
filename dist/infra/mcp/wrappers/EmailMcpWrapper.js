export class EmailMcpWrapper {
    adapter;
    constructor(adapter) {
        this.adapter = adapter;
    }
    getTools() {
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
    async executeTool(name, args) {
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
