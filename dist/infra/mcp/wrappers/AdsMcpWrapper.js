export class AdsMcpWrapper {
    adapter;
    constructor(adapter) {
        this.adapter = adapter;
    }
    getTools() {
        return [
            {
                name: 'ads_create_campaign',
                description: 'Create a new ad campaign.',
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        budget: { type: 'number' },
                        platform: { type: 'string' }
                    },
                    required: ['name', 'budget', 'platform']
                }
            },
            {
                name: 'ads_list_campaigns',
                description: 'List all active ad campaigns.',
                parameters: {
                    type: 'object',
                    properties: {},
                    required: []
                }
            },
            {
                name: 'ads_stop_campaign',
                description: 'Stop a running ad campaign.',
                parameters: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }
                    },
                    required: ['id']
                }
            }
        ];
    }
    async executeTool(name, args) {
        switch (name) {
            case 'ads_create_campaign':
                return this.adapter.createCampaign(args);
            case 'ads_list_campaigns':
                return this.adapter.listCampaigns();
            case 'ads_stop_campaign':
                return this.adapter.stopCampaign(args.id);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
}
