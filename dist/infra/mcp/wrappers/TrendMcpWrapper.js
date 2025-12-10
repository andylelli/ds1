export class TrendMcpWrapper {
    adapter;
    constructor(adapter) {
        this.adapter = adapter;
    }
    getTools() {
        return [
            {
                name: 'trend_analyze',
                description: 'Analyze market trends for a specific category.',
                parameters: {
                    type: 'object',
                    properties: {
                        category: { type: 'string' }
                    },
                    required: ['category']
                }
            },
            {
                name: 'trend_check_saturation',
                description: 'Check market saturation for a specific product.',
                parameters: {
                    type: 'object',
                    properties: {
                        productName: { type: 'string' }
                    },
                    required: ['productName']
                }
            },
            {
                name: 'trend_find_products',
                description: 'Find trending products in a category.',
                parameters: {
                    type: 'object',
                    properties: {
                        category: { type: 'string' }
                    },
                    required: ['category']
                }
            }
        ];
    }
    async executeTool(name, args) {
        switch (name) {
            case 'trend_analyze':
                return this.adapter.analyzeTrend(args.category);
            case 'trend_check_saturation':
                return this.adapter.checkSaturation(args.productName);
            case 'trend_find_products':
                return this.adapter.findProducts(args.category);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
}
