import pg from 'pg';
const { Pool } = pg;
import { configService } from '../config/ConfigService.js';
export class PostgresAdapter {
    pgPool = null;
    simPool = null;
    constructor() {
        this.initPools();
    }
    initPools() {
        const dbUrl = configService.get('databaseUrl') || "postgresql://postgres:postgres@localhost:5432/dropship";
        const simDbUrl = configService.get('simulatorDatabaseUrl') || "postgresql://postgres:postgres@localhost:5432/dropship_sim";
        try {
            this.pgPool = new Pool({ connectionString: dbUrl });
            this.simPool = new Pool({ connectionString: simDbUrl });
        }
        catch (e) {
            console.error("Failed to initialize Postgres pools", e);
        }
    }
    async saveProduct(product) {
        // Default to Live pool for now, or maybe we need a way to distinguish?
        // For now, we mirror db.js behavior: save to Live pool.
        if (this.pgPool) {
            try {
                await this.pgPool.query(`INSERT INTO products (id, name, description, price, potential, margin, data, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT (id) DO UPDATE SET 
             name = EXCLUDED.name, 
             description = EXCLUDED.description,
             price = EXCLUDED.price,
             data = EXCLUDED.data`, [
                    product.id,
                    product.name,
                    product.description,
                    product.price,
                    product.potential,
                    product.margin,
                    JSON.stringify(product)
                ]);
            }
            catch (e) {
                console.error("Failed to save product to PG:", e.message);
            }
        }
    }
    async getProducts() {
        let items = [];
        // 1. Sim Pool
        if (this.simPool) {
            try {
                const res = await this.simPool.query("SELECT * FROM products ORDER BY created_at DESC");
                items = items.concat(res.rows.map(r => ({ ...r.data, timestamp: r.created_at, _db: 'sim' })));
            }
            catch (e) {
                console.error("SimPool products error:", e.message);
            }
        }
        // 2. Live Pool
        if (this.pgPool) {
            try {
                const res = await this.pgPool.query("SELECT * FROM products ORDER BY created_at DESC");
                items = items.concat(res.rows.map(r => ({ ...r.data, timestamp: r.created_at, _db: 'live' })));
            }
            catch (e) {
                console.error("PgPool products error:", e.message);
            }
        }
        return items;
    }
    async saveOrder(order) {
        if (this.pgPool) {
            try {
                await this.pgPool.query(`INSERT INTO orders (id, product_id, amount, status, source, data, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`, [
                    order.id,
                    order.productId || 'unknown',
                    order.amount,
                    order.status || 'pending',
                    order.source || 'unknown',
                    JSON.stringify(order)
                ]);
            }
            catch (e) {
                console.error("Failed to save order to PG:", e.message);
            }
        }
    }
    async getOrders() {
        let items = [];
        if (this.simPool) {
            try {
                const res = await this.simPool.query("SELECT * FROM orders ORDER BY created_at DESC");
                items = items.concat(res.rows.map(r => ({ ...r.data, timestamp: r.created_at, _db: 'sim' })));
            }
            catch (e) {
                console.error("SimPool orders error:", e.message);
            }
        }
        if (this.pgPool) {
            try {
                const res = await this.pgPool.query("SELECT * FROM orders ORDER BY created_at DESC");
                items = items.concat(res.rows.map(r => ({ ...r.data, timestamp: r.created_at, _db: 'live' })));
            }
            catch (e) {
                console.error("PgPool orders error:", e.message);
            }
        }
        return items;
    }
    async saveCampaign(campaign) {
        if (this.pgPool) {
            try {
                await this.pgPool.query(`INSERT INTO ads (id, platform, product, budget, status, data, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`, [
                    campaign.id,
                    campaign.platform,
                    campaign.product,
                    campaign.budget,
                    campaign.status,
                    JSON.stringify(campaign)
                ]);
            }
            catch (e) {
                console.error("Failed to save ad to PG:", e.message);
            }
        }
    }
    async getCampaigns() {
        let items = [];
        if (this.simPool) {
            try {
                const res = await this.simPool.query("SELECT * FROM ads ORDER BY created_at DESC");
                items = items.concat(res.rows.map(r => ({ ...r.data, timestamp: r.created_at, _db: 'sim' })));
            }
            catch (e) {
                console.error("SimPool ads error:", e.message);
            }
        }
        if (this.pgPool) {
            try {
                const res = await this.pgPool.query("SELECT * FROM ads ORDER BY created_at DESC");
                items = items.concat(res.rows.map(r => ({ ...r.data, timestamp: r.created_at, _db: 'live' })));
            }
            catch (e) {
                console.error("PgPool ads error:", e.message);
            }
        }
        return items;
    }
    async saveLog(agent, message, level, data) {
        // Not implemented for PG yet in db.js, but we can add it or leave empty
        // db.js says "Logs are special... we might just log to console or Cosmos"
        // For now, I'll just console log to be safe
        console.log(`[PG-Log] ${agent}: ${message}`, data);
    }
    async getRecentLogs(limit) {
        // Not implemented for PG in db.js
        return [];
    }
}
