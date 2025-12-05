import { Product, Order, Campaign } from '../types/index.js';

export interface PersistencePort {
  saveProduct(product: Product): Promise<void>;
  getProducts(): Promise<Product[]>;
  
  saveOrder(order: Order): Promise<void>;
  getOrders(): Promise<Order[]>;
  
  saveCampaign(campaign: Campaign): Promise<void>;
  getCampaigns(): Promise<Campaign[]>;
  
  saveLog(agent: string, message: string, level: string, data?: any): Promise<void>;
  getRecentLogs(limit: number): Promise<any[]>;
}
