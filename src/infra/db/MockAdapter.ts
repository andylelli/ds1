import fs from 'fs';
import path from 'path';
import { PersistencePort } from '../../core/domain/ports/PersistencePort.js';
import { Product } from '../../core/domain/types/Product.js';
import { Order } from '../../core/domain/types/Order.js';
import { Campaign } from '../../core/domain/types/Campaign.js';

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

  async saveProduct(product: Product): Promise<void> {
    await this.saveItem("Products", product);
  }

  async getProducts(): Promise<Product[]> {
    return await this.getItems("Products");
  }

  async saveOrder(order: Order): Promise<void> {
    await this.saveItem("Orders", order);
  }

  async getOrders(): Promise<Order[]> {
    return await this.getItems("Orders");
  }

  async saveCampaign(campaign: Campaign): Promise<void> {
    await this.saveItem("Ads", campaign);
  }

  async getCampaigns(): Promise<Campaign[]> {
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

  async getRecentLogs(limit: number): Promise<any[]> {
    const logs = await this.getItems("AgentMemory");
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  }
}
