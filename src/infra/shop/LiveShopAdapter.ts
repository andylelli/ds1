import { ShopPlatformPort } from '../../core/domain/ports/ShopPlatformPort.js';
import { Product } from '../../core/domain/types/Product.js';

export class LiveShopAdapter implements ShopPlatformPort {
  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    console.log(`[LiveShop] 🔴 Creating product in LIVE STORE: ${product.name}`);
    // Real Shopify API call would go here
    throw new Error("Shopify Live API credentials missing.");
  }

  async listProducts(): Promise<Product[]> {
    throw new Error("Shopify Live API credentials missing.");
  }

  async getProduct(id: string): Promise<Product | null> {
    throw new Error("Shopify Live API credentials missing.");
  }
}
