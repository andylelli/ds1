import { Product } from '../types/index.js';
import { ShopCompliancePort } from './ShopCompliancePort.js';

export interface ShopManagementPort extends ShopCompliancePort {
    /**
     * Creates a new product in the store.
     * WRITE operation - Restricted to Store Build Agent.
     */
    createProduct(product: Omit<Product, 'id'>): Promise<Product>;

    /**
     * Lists existing products.
     */
    listProducts(): Promise<Product[]>;

    /**
     * Gets a single product by ID.
     */
    getProduct(id: string): Promise<Product | null>;
}
