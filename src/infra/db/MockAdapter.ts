import fs from 'fs';
import path from 'path';
import { PersistencePort } from '../../core/domain/ports/PersistencePort.js';
import { DomainEvent } from '../../core/domain/events/Registry.js';
import { Product } from '../../core/domain/types/Product.js';
import { Order } from '../../core/domain/types/Order.js';
import { Campaign } from '../../core/domain/types/Campaign.js';
import { ActivityLogEntry } from '../../core/domain/types/ActivityLogEntry.js';
import { OpportunityBrief } from '../../core/domain/types/OpportunityBrief.js';

const DB_FILE = path.resolve(process.cwd(), 'sandbox_db.json');

export class MockAdapter implements PersistencePort {
  private dbId = "DropShipDB";

  constructor() {
    this.ensureDb();
  }

  private ensureDb() {
    if (!fs.existsSync(DB_FILE)) {
      this.writeDb({});
    }
  }

  private readDb(): any {
    try {
      if (!fs.existsSync(DB_FILE)) return {};
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
      return {};
    }
  }

  private writeDb(data: any) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  }

  private async saveItem(containerId: string, item: any): Promise<void> {
    const db = this.readDb();
    if (!db[this.dbId]) db[this.dbId] = {};
    if (!db[this.dbId][containerId]) db[this.dbId][containerId] = [];

    const container = db[this.dbId][containerId];
    const existingIndex = container.findIndex((i: any) => i.id === item.id);

    const storedItem = {
      ...item,
      timestamp: item.timestamp || new Date().toISOString(),
      _ts: Math.floor(Date.now() / 1000)
    };

    if (existingIndex >= 0) {
      container[existingIndex] = storedItem;
    } else {
      container.push(storedItem);
    }

    this.writeDb(db);
  }

  private async getItems(containerId: string): Promise<any[]> {
    const db = this.readDb();
    return db[this.dbId]?.[containerId] || [];
  }

  async saveBrief(brief: OpportunityBrief): Promise<void> {
    await this.saveItem("Briefs", brief);
  }

  async getBriefs(source?: string): Promise<OpportunityBrief[]> {
    return await this.getItems("Briefs");
  }

  async saveProduct(product: Product): Promise<void> {
    await this.saveItem("Products", product);
  }

  async getProducts(source?: string): Promise<Product[]> {
    return await this.getItems("Products");
  }

  async saveOrder(order: Order): Promise<void> {
    await this.saveItem("Orders", order);
  }

  async getOrders(source?: string): Promise<Order[]> {
    return await this.getItems("Orders");
  }

  async saveCampaign(campaign: Campaign): Promise<void> {
    await this.saveItem("Ads", campaign);
  }

  async getCampaigns(source?: string): Promise<Campaign[]> {
    return await this.getItems("Ads");
  }

  async saveLog(agent: string, message: string, level: string, data?: any): Promise<void> {
    await this.saveItem("AgentMemory", {
      agent,
      message,
      level,
      data,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
  }

  async saveActivity(entry: ActivityLogEntry): Promise<void> {
    await this.saveItem("ActivityLog", {
      ...entry,
      id: entry.id || `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
  }

  async getRecentLogs(limit: number, source?: string): Promise<any[]> {
    const logs = await this.getItems("AgentMemory");
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  }

  async saveEvent(event: DomainEvent): Promise<void> {
    await this.saveItem("Events", event);
  }

  async getEvents(topic?: string, source?: string): Promise<DomainEvent[]> {
    const events = await this.getItems("Events");
    if (topic) {
      return events.filter((e: DomainEvent) => e.topic === topic);
    }
    return events as DomainEvent[];
  }

  async getTopics(source?: string): Promise<string[]> {
    const events = await this.getItems("Events");
    const topics = new Set(events.map(e => e.topic));
    return Array.from(topics);
  }

  async clearSimulationData(): Promise<void> {
    console.log('[MockAdapter.clearSimulationData] Clearing simulation data...');
    // In mock adapter, just clear the in-memory collections
    // This won't actually do anything since mock adapter doesn't persist, but we provide the interface
    console.log('[MockAdapter.clearSimulationData] Simulation data cleared (no-op in mock)');
  }

  async clearLogs(source?: string): Promise<void> {
    console.log('[MockAdapter.clearLogs] Clearing logs...');
    // No-op in mock adapter
    console.log('[MockAdapter.clearLogs] Logs cleared (no-op in mock)');
  }
}
