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
        const mode = configService.get('dbMode');
        const pool = mode === 'mock' ? this.simPool : this.pgPool;
        if (pool) {
            try {
                await pool.query(`INSERT INTO products (id, name, description, price, potential, margin, data, created_at)
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
                console.error(`Failed to save product to PG (${mode}):`, e.message);
            }
        }
    }
    async getProducts(source) {
        let items = [];
        // 1. Sim Pool
        if (this.simPool && (source === 'sim' || source === 'mock' || !source)) {
            try {
                const res = await this.simPool.query("SELECT * FROM products ORDER BY created_at DESC");
                items = items.concat(res.rows.map(r => ({ ...r.data, timestamp: r.created_at, _db: 'sim' })));
            }
            catch (e) {
                console.error("SimPool products error:", e.message);
            }
        }
        // 2. Live Pool
        if (this.pgPool && (source === 'live' || !source)) {
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
        const mode = configService.get('dbMode');
        const pool = mode === 'mock' ? this.simPool : this.pgPool;
        if (pool) {
            try {
                await pool.query(`INSERT INTO orders (id, product_id, amount, status, source, data, created_at)
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
                console.error(`Failed to save order to PG (${mode}):`, e.message);
            }
        }
    }
    async getOrders(source) {
        let items = [];
        if (this.simPool && (source === 'sim' || source === 'mock' || !source)) {
            try {
                const res = await this.simPool.query("SELECT * FROM orders ORDER BY created_at DESC");
                items = items.concat(res.rows.map(r => ({ ...r.data, timestamp: r.created_at, _db: 'sim' })));
            }
            catch (e) {
                console.error("SimPool orders error:", e.message);
            }
        }
        if (this.pgPool && (source === 'live' || !source)) {
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
        const mode = configService.get('dbMode');
        const pool = mode === 'mock' ? this.simPool : this.pgPool;
        if (pool) {
            try {
                await pool.query(`INSERT INTO ads (id, platform, product, budget, status, data, created_at)
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
                console.error(`Failed to save ad to PG (${mode}):`, e.message);
            }
        }
    }
    async getCampaigns(source) {
        let items = [];
        if (this.simPool && (source === 'sim' || source === 'mock' || !source)) {
            try {
                const res = await this.simPool.query("SELECT * FROM ads ORDER BY created_at DESC");
                items = items.concat(res.rows.map(r => ({ ...r.data, timestamp: r.created_at, _db: 'sim' })));
            }
            catch (e) {
                console.error("SimPool ads error:", e.message);
            }
        }
        if (this.pgPool && (source === 'live' || !source)) {
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
    async saveEvent(topic, type, payload) {
        const mode = configService.get('dbMode');
        const pool = mode === 'mock' ? this.simPool : this.pgPool;
        if (pool) {
            try {
                await pool.query(`INSERT INTO events (topic, type, payload, created_at) VALUES ($1, $2, $3, NOW())`, [topic, type, JSON.stringify(payload)]);
            }
            catch (e) {
                console.error(`Failed to save event to PG (${mode}):`, e.message);
            }
        }
    }
    async getEvents(topic, source) {
        let items = [];
        const query = topic
            ? "SELECT * FROM events WHERE topic = $1 ORDER BY created_at DESC"
            : "SELECT * FROM events ORDER BY created_at DESC";
        const params = topic ? [topic] : [];
        if (this.simPool && (source === 'sim' || source === 'mock' || !source)) {
            try {
                const res = await this.simPool.query(query, params);
                items = items.concat(res.rows);
            }
            catch (e) { }
        }
        if (this.pgPool && (source === 'live' || !source)) {
            try {
                const res = await this.pgPool.query(query, params);
                items = items.concat(res.rows);
            }
            catch (e) { }
        }
        return items;
    }
    async getTopics(source) {
        const topics = new Set();
        if (this.simPool && (source === 'sim' || source === 'mock' || !source)) {
            try {
                const res = await this.simPool.query("SELECT DISTINCT topic FROM events");
                res.rows.forEach((r) => topics.add(r.topic));
            }
            catch (e) { }
        }
        if (this.pgPool && (source === 'live' || !source)) {
            try {
                const res = await this.pgPool.query("SELECT DISTINCT topic FROM events");
                res.rows.forEach((r) => topics.add(r.topic));
            }
            catch (e) { }
        }
        return Array.from(topics);
    }
}
