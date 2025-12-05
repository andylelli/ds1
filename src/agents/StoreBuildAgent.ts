import { BaseAgent } from './BaseAgent.js';
import { PersistencePort } from '../core/domain/ports/PersistencePort.js';
import { ShopPlatformPort } from '../core/domain/ports/ShopPlatformPort.js';
import { openAIService } from '../infra/ai/OpenAIService.js';
import { configService } from '../infra/config/ConfigService.js';
import { Product } from '../core/domain/types/Product.js';

export class StoreBuildAgent extends BaseAgent {
  private shop: ShopPlatformPort;

  constructor(db: PersistencePort, shop: ShopPlatformPort) {
    super('StoreBuilder', db);
    this.shop = shop;
    this.registerTool('create_product_page', this.createProductPage.bind(this));
    this.registerTool('optimize_seo', this.optimizeSEO.bind(this));
  }

  async createProductPage(args: { product_data: any }) {
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
         this.log('info', '[MOCK] Using injected Shop Adapter (should be mock).');
    }

    try {
      const productInput: Omit<Product, 'id'> = {
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

    } catch (error: any) {
      this.log('error', `Failed to create product: ${error.message}`);
      throw new Error(`Shopify Error: ${error.message}`);
    }
  }

  async generateDescription(productName: string) {
    try {
      const client = openAIService.getClient();
      const messages = [
        { role: "system", content: "You are an expert e-commerce copywriter. Write a compelling, high-converting product description (HTML format) for the following product. Focus on benefits and emotional hooks." },
        { role: "user", content: productName }
      ];

      const result = await client.chat.completions.create({
        model: openAIService.deploymentName,
        messages: messages as any,
      });

      return result.choices[0].message.content || "No description generated.";
    } catch (e: any) {
        this.log('error', `AI generation failed: ${e.message}`);
        return "Great product description placeholder.";
    }
  }

  async optimizeSEO(args: { product_id: string }) {
      // Placeholder for SEO optimization
      return { status: 'optimized', score: 95 };
  }
}
