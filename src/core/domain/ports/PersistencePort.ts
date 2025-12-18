import { Product, Order, Campaign } from '../types/index.js';
import { DomainEvent } from '../events/Registry.js';

export interface PersistencePort {
  saveProduct(product: Product): Promise<void>;
  getProducts(source?: string): Promise<Product[]>;
  
  saveOrder(order: Order): Promise<void>;
  getOrders(source?: string): Promise<Order[]>;
  
  saveCampaign(campaign: Campaign): Promise<void>;
  getCampaigns(source?: string): Promise<Campaign[]>;
  
  saveLog(agent: string, message: string, level: string, data?: any): Promise<void>;
  getRecentLogs(limit: number, source?: string): Promise<any[]>;

  // Clear simulation data
  clearSimulationData(): Promise<void>;
  clearLogs(source?: string): Promise<void>;

  // Generic Event Sourcing / Inspection
  saveEvent(event: DomainEvent): Promise<void>;
  getEvents(topic?: string, source?: string): Promise<DomainEvent[]>;
  getTopics(source?: string): Promise<string[]>;
}
