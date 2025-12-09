import pg from 'pg';
const { Pool } = pg;
import { PersistencePort } from '../../core/domain/ports/PersistencePort.js';
import { Product } from '../../core/domain/types/Product.js';
import { Order } from '../../core/domain/types/Order.js';
import { Campaign } from '../../core/domain/types/Campaign.js';
import { configService } from '../config/ConfigService.js';

export class PostgresAdapter implements PersistencePort {
  private pgPool: pg.Pool | null = null;
  private simPool: pg.Pool | null = null;

  constructor() {
    this.initPools();
  }

  private initPools() {
    const dbUrl = configService.get('databaseUrl') || "postgresql://postgres:postgres@localhost:5432/dropship";
    const simDbUrl = configService.get('simulatorDatabaseUrl') || "postgresql://postgres:postgres@localhost:5432/dropship_sim";

    try {
      this.pgPool = new Pool({ connectionString: dbUrl });
      this.simPool = new Pool({ connectionString: simDbUrl });
    } catch (e) {
      console.error("Failed to initialize Postgres pools", e);
    }
  }

  async saveProduct(product: Product): Promise<void> {
    const mode = configService.get('dbMode');
    const pool = (mode === 'test') ? this.simPool : this.pgPool;
    const poolName = (mode === 'test') ? 'simPool' : 'pgPool';
    console.log(`[PostgresAdapter.saveProduct] mode=${mode}, using ${poolName}`);

    if (pool) {
      try {
        await pool.query(
          `INSERT INTO products (id, name, description, price, potential, margin, data, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT (id) DO UPDATE SET 
             name = EXCLUDED.name, 
             description = EXCLUDED.description,
             price = EXCLUDED.price,
             data = EXCLUDED.data`,
          [
            product.id, 
            product.name, 
            product.description, 
            product.price, 
            product.potential, 
            product.margin, 
            JSON.stringify(product)
          ]
        );
      } catch (e: any) {
        console.error(`Failed to save product to PG (${mode}):`, e.message);
      }
    }
  }

  async getProducts(source?: string): Promise<Product[]> {
    const mode = configService.get('dbMode');
    let items: Product[] = [];

    // Determine which pool to use based on mode (unless source is explicitly specified)
    const useSimPool = source === 'sim' || (!source && mode === 'test');
    const useLivePool = source === 'live' || (!source && mode === 'live');

    if (this.simPool && useSimPool) {
      try {
        const res = await this.simPool.query("SELECT * FROM products ORDER BY created_at DESC");
        items = items.concat(res.rows.map(r => ({ ...r.data, timestamp: r.created_at, _db: 'sim' })));
      } catch (e: any) { console.error("SimPool products error:", e.message); }
    }

    if (this.pgPool && useLivePool) {
      try {
        const res = await this.pgPool.query("SELECT * FROM products ORDER BY created_at DESC");
        items = items.concat(res.rows.map(r => ({ ...r.data, timestamp: r.created_at, _db: 'live' })));
      } catch (e: any) { console.error("PgPool products error:", e.message); }
    }

    return items;
  }

  async saveOrder(order: Order): Promise<void> {
    const mode = configService.get('dbMode');
    const pool = (mode === 'test') ? this.simPool : this.pgPool;
    const poolName = (mode === 'test') ? 'simPool' : 'pgPool';
    console.log(`[PostgresAdapter.saveOrder] mode=${mode}, using ${poolName}`);

    if (pool) {
      try {
        await pool.query(
          `INSERT INTO orders (id, product_id, amount, status, source, data, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            order.id,
            order.productId || 'unknown',
            order.amount,
            order.status || 'pending',
            order.source || 'unknown',
            JSON.stringify(order)
          ]
        );
      } catch (e: any) {
        console.error(`Failed to save order to PG (${mode}):`, e.message);
      }
    }
  }

  async getOrders(source?: string): Promise<Order[]> {
    const mode = configService.get('dbMode');
    let items: Order[] = [];

    const useSimPool = source === 'sim' || source === 'mock' || (!source && mode === 'test');
    const useLivePool = source === 'live' || (!source && mode === 'live');

    if (this.simPool && useSimPool) {
      try {
        const res = await this.simPool.query("SELECT * FROM orders ORDER BY created_at DESC");
        items = items.concat(res.rows.map(r => ({ ...r.data, timestamp: r.created_at, _db: 'sim' })));
      } catch (e: any) { console.error("SimPool orders error:", e.message); }
    }

    if (this.pgPool && useLivePool) {
      try {
        const res = await this.pgPool.query("SELECT * FROM orders ORDER BY created_at DESC");
        items = items.concat(res.rows.map(r => ({ ...r.data, timestamp: r.created_at, _db: 'live' })));
      } catch (e: any) { console.error("PgPool orders error:", e.message); }
    }

    return items;
  }

  async saveCampaign(campaign: Campaign): Promise<void> {
    const mode = configService.get('dbMode');
    const pool = mode === 'test' ? this.simPool : this.pgPool;
    const poolName = (mode === 'test') ? 'simPool' : 'pgPool';
    console.log(`[PostgresAdapter.saveCampaign] mode=${mode}, using ${poolName}`);

    if (pool) {
      try {
        await pool.query(
          `INSERT INTO ads (id, platform, product, budget, status, data, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            campaign.id,
            campaign.platform,
            campaign.product,
            campaign.budget,
            campaign.status,
            JSON.stringify(campaign)
          ]
        );
      } catch (e: any) {
        console.error(`Failed to save ad to PG (${mode}):`, e.message);
      }
    }
  }

  async getCampaigns(source?: string): Promise<Campaign[]> {
    const mode = configService.get('dbMode');
    let items: Campaign[] = [];

    const useSimPool = source === 'sim' || source === 'mock' || (!source && mode === 'test');
    const useLivePool = source === 'live' || (!source && mode === 'live');

    if (this.simPool && useSimPool) {
      try {
        const res = await this.simPool.query("SELECT * FROM ads ORDER BY created_at DESC");
        items = items.concat(res.rows.map(r => ({ ...r.data, timestamp: r.created_at, _db: 'sim' })));
      } catch (e: any) { console.error("SimPool ads error:", e.message); }
    }

    if (this.pgPool && useLivePool) {
      try {
        const res = await this.pgPool.query("SELECT * FROM ads ORDER BY created_at DESC");
        items = items.concat(res.rows.map(r => ({ ...r.data, timestamp: r.created_at, _db: 'live' })));
      } catch (e: any) { console.error("PgPool ads error:", e.message); }
    }

    return items;
  }

  async saveLog(agent: string, message: string, level: string, data?: any): Promise<void> {
    const mode = configService.get('dbMode');
    const pool = mode === 'test' ? this.simPool : this.pgPool;

    console.log(`[PG-Log] ${agent}: ${message}`, data);

    if (!pool) return;

    try {
      await pool.query(
        `INSERT INTO events (topic, type, payload, created_at) VALUES ($1, $2, $3, NOW())`,
        [agent, message, JSON.stringify(data || {})]
      );
    } catch (e: any) {
      console.error(`Failed to save log to PG (${mode}):`, e.message);
    }
  }

  async getRecentLogs(limit: number): Promise<any[]> {
    const mode = configService.get('dbMode');
    const pool = mode === 'test' ? this.simPool : this.pgPool;

    console.log(`[PostgresAdapter.getRecentLogs] mode=${mode}, pool=${pool ? 'exists' : 'null'}`);

    if (!pool) {
      console.log('[PostgresAdapter.getRecentLogs] Pool is null, returning empty array');
      return [];
    }

    try {
      const result = await pool.query(
        `SELECT topic, type, payload, created_at 
         FROM events 
         ORDER BY created_at DESC 
         LIMIT $1`,
        [limit]
      );
      
      console.log(`[PostgresAdapter.getRecentLogs] Found ${result.rows.length} logs in database (mode: ${mode})`);
      
      return result.rows.map(row => ({
        agent: row.topic,
        message: row.type,
        data: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
        timestamp: row.created_at
      }));
    } catch (e: any) {
      console.error(`Failed to fetch logs from PG (${mode}):`, e.message || e);
      console.error('Full error:', e);
      return [];
    }
  }

  async saveEvent(topic: string, type: string, payload: any): Promise<void> {
    const mode = configService.get('dbMode');
    const pool = mode === 'test' ? this.simPool : this.pgPool;

    if (pool) {
      try {
        await pool.query(
          `INSERT INTO events (topic, type, payload, created_at) VALUES ($1, $2, $3, NOW())`,
          [topic, type, JSON.stringify(payload)]
        );
      } catch (e: any) {
        console.error(`Failed to save event to PG (${mode}):`, e.message);
      }
    }
  }

  async getEvents(topic?: string, source?: string): Promise<any[]> {
    const mode = configService.get('dbMode');
    let items: any[] = [];
    const query = topic 
      ? "SELECT * FROM events WHERE topic = $1 ORDER BY created_at DESC" 
      : "SELECT * FROM events ORDER BY created_at DESC";
    const params = topic ? [topic] : [];

    const useSimPool = source === 'sim' || source === 'mock' || (!source && mode === 'test');
    const useLivePool = source === 'live' || (!source && mode === 'live');

    if (this.simPool && useSimPool) {
      try {
        const res = await this.simPool.query(query, params);
        items = items.concat(res.rows);
      } catch (e) {}
    }
    if (this.pgPool && useLivePool) {
      try {
        const res = await this.pgPool.query(query, params);
        items = items.concat(res.rows);
      } catch (e) {}
    }
    return items;
  }

  async getTopics(source?: string): Promise<string[]> {
    const mode = configService.get('dbMode');
    const topics = new Set<string>();

    const useSimPool = source === 'sim' || source === 'mock' || (!source && mode === 'test');
    const useLivePool = source === 'live' || (!source && mode === 'live');

    if (this.simPool && useSimPool) {
      try {
        const res = await this.simPool.query("SELECT DISTINCT topic FROM events");
        res.rows.forEach((r: any) => topics.add(r.topic));
      } catch (e) {}
    }
    if (this.pgPool && useLivePool) {
      try {
        const res = await this.pgPool.query("SELECT DISTINCT topic FROM events");
        res.rows.forEach((r: any) => topics.add(r.topic));
      } catch (e) {}
    }
    return Array.from(topics);
  }

  async clearSimulationData(): Promise<void> {
    console.log('[PostgresAdapter.clearSimulationData] Clearing SIMULATION pool only');
    
    const tables = ['consumer_offsets', 'events_archive', 'events', 'orders', 'ads', 'products'];
    
    if (!this.simPool) {
        console.log('[PostgresAdapter.clearSimulationData] simPool is null, nothing to clear');
        return;
    }
    
    try {
        for (const table of tables) {
            await this.simPool.query(`DELETE FROM ${table}`);
        }
        console.log(`[PostgresAdapter] Cleared simulation pool tables: ${tables.join(', ')}`);
    } catch (e: any) {
        console.error(`[PostgresAdapter] Failed to clear simulation pool:`, e.message);
        throw e;
    }
  }

  async clearLogs(source?: string): Promise<void> {
    const mode = configService.get('dbMode');
    const pool = mode === 'test' ? this.simPool : this.pgPool;
    if (!pool) {
      console.log('[PostgresAdapter.clearLogs] Pool is null');
      return;
    }

    try {
      if (source) {
        await pool.query("DELETE FROM events WHERE topic = $1 OR payload::text LIKE $2", [source, `%${source}%`]);
        console.log(`[PostgresAdapter.clearLogs] Cleared logs for source: ${source}`);
      } else {
        await pool.query("DELETE FROM events");
        console.log('[PostgresAdapter.clearLogs] Cleared all logs');
      }
    } catch (error) {
      console.error('[PostgresAdapter.clearLogs] Error:', error);
      throw error;
    }
  }
}
