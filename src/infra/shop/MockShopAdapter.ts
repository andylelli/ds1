import { ShopPlatformPort } from '../../core/domain/ports/ShopPlatformPort.js';
import { Product } from '../../core/domain/types/Product.js';

export class MockShopAdapter implements ShopPlatformPort {
  private products: Map<string, Product> = new Map();

  async createProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    const id = `shop_prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newProduct: Product = {
      ...productData,
      id,
      timestamp: new Date().toISOString()
    };
    this.products.set(id, newProduct);
    console.log(`[MockShop] Created product: ${newProduct.name} (${id})`);
    return newProduct;
  }

  async listProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | null> {
    return this.products.get(id) || null;
  }
}
