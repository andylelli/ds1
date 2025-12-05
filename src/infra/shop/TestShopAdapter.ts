import { ShopPlatformPort } from '../../core/domain/ports/ShopPlatformPort.js';
import { Product } from '../../core/domain/types/Product.js';

export class TestShopAdapter implements ShopPlatformPort {
  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    console.log(`[TestShop] Creating product in SHOPIFY DEV STORE: ${product.name}`);
    // Simulate API call to Shopify Dev Store
    return {
      ...product,
      id: `dev_prod_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  }

  async listProducts(): Promise<Product[]> {
    return [];
  }

  async getProduct(id: string): Promise<Product | null> {
    return null;
  }
}
