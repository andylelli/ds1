import { Product } from '../types/index.js';

export interface ShopPlatformPort {
  createProduct(product: Omit<Product, 'id'>): Promise<Product>;
  listProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
}
