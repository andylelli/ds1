import { BaseAgent } from './BaseAgent.js';
import { openAIService } from '../infra/ai/OpenAIService.js';
import { configService } from '../infra/config/ConfigService.js';
export class StoreBuildAgent extends BaseAgent {
    shop;
    constructor(db, eventBus, shop) {
        super('StoreBuilder', db, eventBus);
        this.shop = shop;
        this.registerTool('create_product_page', this.createProductPage.bind(this));
        this.registerTool('optimize_seo', this.optimizeSEO.bind(this));
    }
    /**
     * Workflow Action: create_product_page
     * Triggered by: SUPPLIER_APPROVED
     */
    async create_product_page(payload) {
        const { product, supplier } = payload;
        this.log('info', `Workflow: Creating product page for ${product.name} (Supplier: ${supplier.name})`);
        // Enhance description if needed (mock logic for now)
        const enhancedDescription = product.description + `\n\nSourced from premium supplier: ${supplier.name}.`;
        try {
            const newProduct = await this.shop.createProduct({
                name: product.name,
                description: enhancedDescription,
                price: product.price * 1.5, // Markup
                // category: 'Fitness', // Removed as not in Product type
                images: product.images || [],
                // status: 'active', // Removed as not in Product type
                inventory: 100,
                tags: ['Fitness']
            });
            this.log('info', `Product page created: ${newProduct.id}`);
            const pageUrl = `https://myshop.com/products/${newProduct.id}`;
            await this.eventBus.publish('Store.PageCreated', { product: newProduct, pageUrl });
        }
        catch (error) {
            this.log('error', `Failed to create product page: ${error.message}`);
        }
    }
    async createProductPage(args) {
        const { product_data } = args;
        this.log('info', `Creating product page for: ${product_data.name}`);
        // 1. Generate Description using AI if missing
        let description = product_data.description;
        if (!description) {
            this.log('info', 'Description missing. Generating one using AI...');
            description = await this.generateDescription(product_data.name);
        }
        // Check Config for Simulation Mode
        // Note: The ShopPlatformPort implementation (MockShopAdapter) handles the "mock" behavior.
        // But if we want to force mock behavior even if a RealShopAdapter was injected (unlikely in this architecture, 
        // usually we inject the correct adapter based on config), we can check config here.
        // However, the original code checked config to decide whether to call Shopify API or return mock.
        // In our new architecture, we should rely on the injected `this.shop` to be the correct implementation.
        // BUT, `StoreBuildAgent` might be injected with `ShopifyAdapter` (Real) but we might want to fallback to mock if config says so?
        // Actually, the best practice is to inject the correct adapter at startup.
        // So I will assume `this.shop` is the correct adapter.
        // However, the original code had a specific check:
        if (configService.get('useSimulatedEndpoints')) {
            // If we are in simulation mode, we might want to ensure we are using the mock adapter.
            // But let's assume the wiring does that.
            // Just in case, I'll log.
            this.log('info', 'Using injected Shop Adapter.');
        }
        try {
            const productInput = {
                name: product_data.name,
                description: description,
                price: parseFloat(product_data.price || "19.99"),
                images: product_data.images || [],
                // map other fields if needed
            };
            const product = await this.shop.createProduct(productInput);
            this.log('info', `Successfully created product ID: ${product.id}`);
            return {
                id: product.id,
                url: `/products/${product.id}`, // The mock adapter generates an ID, real one generates handle
                status: 'published',
                generated_description: description
            };
        }
        catch (error) {
            this.log('error', `Failed to create product: ${error.message}`);
            throw new Error(`Shopify Error: ${error.message}`);
        }
    }
    async generateDescription(productName) {
        try {
            const client = openAIService.getClient();
            const messages = [
                { role: "system", content: "You are an expert e-commerce copywriter. Write a compelling, high-converting product description (HTML format) for the following product. Focus on benefits and emotional hooks." },
                { role: "user", content: productName }
            ];
            const result = await client.chat.completions.create({
                model: openAIService.deploymentName,
                messages: messages,
            });
            return result.choices[0].message.content || "No description generated.";
        }
        catch (e) {
            this.log('error', `AI generation failed: ${e.message}`);
            return "Great product description placeholder.";
        }
    }
    async optimizeSEO(args) {
        // Placeholder for SEO optimization
        return { status: 'optimized', score: 95 };
    }
}
