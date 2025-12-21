import { McpToolProvider } from '../../../core/mcp/McpToolProvider.js';
import { ShopManagementPort } from '../../../core/domain/ports/ShopManagementPort.js';
import { ToolDefinition } from '../../../core/domain/ports/AiPort.js';

export class ShopifyMcpWrapper implements McpToolProvider {
    constructor(private adapter: ShopManagementPort) {}

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'shop_list_products',
                description: 'List all products currently in the store.',
                parameters: {
                    type: 'object',
                    properties: {},
                    required: []
                }
            },
            {
                name: 'shop_create_product',
                description: 'Create a new product in the store.',
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        price: { type: 'number' },
                        category: { type: 'string' }
                    },
                    required: ['name', 'price']
                }
            },
            {
                name: 'shop_get_product',
                description: 'Get details of a specific product.',
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

    async executeTool(name: string, args: any): Promise<any> {
        switch (name) {
            case 'shop_list_products':
                return this.adapter.listProducts();
            case 'shop_create_product':
                return this.adapter.createProduct(args);
            case 'shop_get_product':
                return this.adapter.getProduct(args.id);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
}
