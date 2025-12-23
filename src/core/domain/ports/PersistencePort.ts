import { Product, Order, Campaign, ActivityLogEntry, OpportunityBrief } from '../types/index.js';
import { DomainEvent } from '../events/Registry.js';

export interface PersistencePort {
  saveBrief(brief: OpportunityBrief): Promise<void>;
  getBriefs(source?: string): Promise<OpportunityBrief[]>;

  saveProduct(product: Product): Promise<void>;
  getProducts(source?: string): Promise<Product[]>;
  findProductByName(name: string): Promise<Product | null>;
  getRequestIdForProduct(productId: string): Promise<string | null>;
  
  saveOrder(order: Order): Promise<void>;
  getOrders(source?: string): Promise<Order[]>;
  
  saveCampaign(campaign: Campaign): Promise<void>;
  getCampaigns(source?: string): Promise<Campaign[]>;
  
  saveLog(agent: string, message: string, level: string, data?: any): Promise<void>;
  saveActivity(entry: ActivityLogEntry): Promise<void>;
  getRecentLogs(limit: number, source?: string): Promise<any[]>;
  getActivity(filter: any): Promise<ActivityLogEntry[]>;

  // Clear simulation data
  clearSimulationData(): Promise<void>;
  clearLogs(source?: string): Promise<void>;

  // Generic Event Sourcing / Inspection
  saveEvent(event: DomainEvent): Promise<void>;
  getEvents(topic?: string, source?: string): Promise<DomainEvent[]>;
  getTopics(source?: string): Promise<string[]>;
}
