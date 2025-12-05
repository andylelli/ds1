import { Product, Order, Campaign } from '../types/index.js';

export interface PersistencePort {
  saveProduct(product: Product): Promise<void>;
  getProducts(source?: string): Promise<Product[]>;
  
  saveOrder(order: Order): Promise<void>;
  getOrders(source?: string): Promise<Order[]>;
  
  saveCampaign(campaign: Campaign): Promise<void>;
  getCampaigns(source?: string): Promise<Campaign[]>;
  
  saveLog(agent: string, message: string, level: string, data?: any): Promise<void>;
  getRecentLogs(limit: number): Promise<any[]>;

  // Generic Event Sourcing / Inspection
  saveEvent(topic: string, type: string, payload: any): Promise<void>;
  getEvents(topic?: string, source?: string): Promise<any[]>;
  getTopics(source?: string): Promise<string[]>;
}
