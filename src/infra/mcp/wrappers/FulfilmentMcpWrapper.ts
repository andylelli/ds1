import { McpToolProvider } from '../../../core/mcp/McpToolProvider.js';
import { FulfilmentPort } from '../../../core/domain/ports/FulfilmentPort.js';
import { ToolDefinition } from '../../../core/domain/ports/AiPort.js';

export class FulfilmentMcpWrapper implements McpToolProvider {
    constructor(private adapter: FulfilmentPort) {}

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'fulfilment_find_suppliers',
                description: 'Find suppliers for a specific product ID.',
                parameters: {
                    type: 'object',
                    properties: {
                        productId: { type: 'string' }
                    },
                    required: ['productId']
                }
            },
            {
                name: 'fulfilment_negotiate_price',
                description: 'Negotiate price with a supplier.',
                parameters: {
                    type: 'object',
                    properties: {
                        supplierId: { type: 'string' },
                        targetPrice: { type: 'number' }
                    },
                    required: ['supplierId', 'targetPrice']
                }
            },
            {
                name: 'fulfilment_place_order',
                description: 'Place an order with a supplier.',
                parameters: {
                    type: 'object',
                    properties: {
                        supplierId: { type: 'string' },
                        productId: { type: 'string' },
                        quantity: { type: 'number' }
                    },
                    required: ['supplierId', 'productId', 'quantity']
                }
            }
        ];
    }

    async executeTool(name: string, args: any): Promise<any> {
        switch (name) {
            case 'fulfilment_find_suppliers':
                return this.adapter.findSuppliers(args.productId);
            case 'fulfilment_negotiate_price':
                return this.adapter.negotiatePrice(args.supplierId, args.targetPrice);
            case 'fulfilment_place_order':
                return this.adapter.placeOrder(args);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
}
