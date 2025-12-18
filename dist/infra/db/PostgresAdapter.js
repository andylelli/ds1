import pg from 'pg';
const { Pool } = pg;
import { configService } from '../config/ConfigService.js';
export class PostgresAdapter {
    pgPool = null;
    simPool = null;
    liveUrl;
    simUrl;
    constructor(liveUrl, simUrl) {
        this.liveUrl = liveUrl;
        this.simUrl = simUrl;
        this.initPools();
    }
    // Expose pool for services that need direct database access
    getPool() {
        const mode = configService.get('dbMode');
        const pool = (mode === 'test') ? this.simPool : this.pgPool;
        if (!pool) {
            throw new Error('Database pool not initialized');
        }
        return pool;
    }
    initPools() {
        const dbUrl = this.liveUrl || configService.get('databaseUrl') || "postgresql://postgres:postgres@localhost:5432/dropship";
        const simDbUrl = this.simUrl || configService.get('simulatorDatabaseUrl') || "postgresql://postgres:postgres@localhost:5432/dropship_sim";
        try {
            this.pgPool = new Pool({ connectionString: dbUrl });
            this.simPool = new Pool({ connectionString: simDbUrl });
        }
        catch (e) {
            console.error("Failed to initialize Postgres pools", e);
        }
    }
    async saveBrief(brief) {
        const mode = configService.get('dbMode');
        const pool = mode === 'test' ? this.simPool : this.pgPool;
        if (!pool)
            return;
        try {
            await pool.query(`INSERT INTO opportunity_briefs (id, theme_name, score, phase, status, data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (id) DO UPDATE SET
           theme_name = EXCLUDED.theme_name,
           score = EXCLUDED.score,
           phase = EXCLUDED.phase,
           status = EXCLUDED.status,
           data = EXCLUDED.data`, [
                brief.id,
                brief.opportunity_definition.theme_name,
                Math.round((brief.certainty_score || 0) * 100),
                brief.market_evidence?.trend_phase || 'Unknown',
                brief.meta.status,
                JSON.stringify(brief)
            ]);
        }
        catch (e) {
            console.error(`Failed to save brief to PG (${mode}):`, e.message);
        }
    }
    async getBriefs(source) {
        const mode = configService.get('dbMode');
        const pool = mode === 'test' ? this.simPool : this.pgPool;
        if (!pool)
            return [];
        try {
            const res = await pool.query("SELECT data FROM opportunity_briefs ORDER BY created_at DESC");
            return res.rows.map(r => r.data);
        }
        catch (e) {
            console.error(`Failed to get briefs from PG (${mode}):`, e.message);
            return [];
        }
    }
    async saveProduct(product) {
        const mode = configService.get('dbMode');
        const pool = (mode === 'test') ? this.simPool : this.pgPool;
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
        const mode = configService.get('dbMode');
        let items = [];
        // Determine which pool to use based on mode (unless source is explicitly specified)
        const useSimPool = source === 'sim' || (!source && mode === 'test');
        const useLivePool = source === 'live' || (!source && mode === 'live');
        if (this.simPool && useSimPool) {
            try {
                const res = await this.simPool.query("SELECT * FROM products ORDER BY created_at DESC");
                items = items.concat(res.rows.map(r => ({ ...r.data, timestamp: r.created_at, _db: 'sim' })));
            }
            catch (e) {
                console.error("SimPool products error:", e.message);
            }
        }
        if (this.pgPool && useLivePool) {
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
        const pool = (mode === 'test') ? this.simPool : this.pgPool;
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
        const mode = configService.get('dbMode');
        let items = [];
        const useSimPool = source === 'sim' || source === 'mock' || (!source && mode === 'test');
        const useLivePool = source === 'live' || (!source && mode === 'live');
        if (this.simPool && useSimPool) {
            try {
                const res = await this.simPool.query("SELECT * FROM orders ORDER BY created_at DESC");
                items = items.concat(res.rows.map(r => ({ ...r.data, timestamp: r.created_at, _db: 'sim' })));
            }
            catch (e) {
                console.error("SimPool orders error:", e.message);
            }
        }
        if (this.pgPool && useLivePool) {
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
        const pool = mode === 'test' ? this.simPool : this.pgPool;
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
        const mode = configService.get('dbMode');
        let items = [];
        const useSimPool = source === 'sim' || source === 'mock' || (!source && mode === 'test');
        const useLivePool = source === 'live' || (!source && mode === 'live');
        if (this.simPool && useSimPool) {
            try {
                const res = await this.simPool.query("SELECT * FROM ads ORDER BY created_at DESC");
                items = items.concat(res.rows.map(r => ({ ...r.data, timestamp: r.created_at, _db: 'sim' })));
            }
            catch (e) {
                console.error("SimPool ads error:", e.message);
            }
        }
        if (this.pgPool && useLivePool) {
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
        const mode = configService.get('dbMode');
        const pool = mode === 'test' ? this.simPool : this.pgPool;
        if (!pool)
            return;
        try {
            await pool.query(`INSERT INTO events (topic, type, payload, created_at) VALUES ($1, $2, $3, NOW())`, [agent, message, JSON.stringify(data || {})]);
        }
        catch (e) {
            console.error(`Failed to save log to PG (${mode}):`, e.message);
        }
    }
    async saveActivity(entry) {
        const mode = configService.get('dbMode');
        const pool = mode === 'test' ? this.simPool : this.pgPool;
        if (!pool)
            return;
        const query = `
      INSERT INTO activity_log (agent, action, category, status, entity_type, entity_id, details, message, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
        try {
            await pool.query(query, [
                entry.agent,
                entry.action,
                entry.category,
                entry.status || 'completed',
                entry.entityType || null,
                entry.entityId || null,
                entry.details ? JSON.stringify(entry.details) : null,
                entry.message,
                entry.metadata ? JSON.stringify(entry.metadata) : null
            ]);
        }
        catch (e) {
            console.error(`Failed to save activity to PG (${mode}):`, e.message);
        }
    }
    async getErrorLogs(limit, source) {
        const mode = configService.get('dbMode');
        const useSimPool = source === 'sim' || (!source && mode === 'test');
        const pool = useSimPool ? this.simPool : this.pgPool;
        if (!pool) {
            return [];
        }
        try {
            const result = await pool.query(`SELECT agent, action, category, status, message, details, timestamp as created_at 
         FROM activity_log 
         WHERE status IN ('failed', 'warning')
         ORDER BY timestamp DESC 
         LIMIT $1`, [limit]);
            return result.rows.map(row => {
                let parsedDetails = row.details;
                if (typeof row.details === 'string') {
                    try {
                        parsedDetails = JSON.parse(row.details);
                    }
                    catch (e) {
                        parsedDetails = { raw_content: row.details, parse_error: 'Invalid JSON' };
                    }
                }
                return {
                    agent: row.agent,
                    action: row.action,
                    category: row.category,
                    status: row.status,
                    message: row.message,
                    details: parsedDetails,
                    timestamp: row.created_at
                };
            });
        }
        catch (e) {
            console.error(`Failed to fetch error logs from PG:`, e.message);
            return [];
        }
    }
    async getRecentLogs(limit, source) {
        const mode = configService.get('dbMode');
        const useSimPool = source === 'sim' || (!source && mode === 'test');
        const pool = useSimPool ? this.simPool : this.pgPool;
        if (!pool) {
            return [];
        }
        try {
            const result = await pool.query(`SELECT agent, message, data, created_at FROM (
           SELECT topic as agent, type as message, payload as data, created_at 
           FROM events 
           UNION ALL
           SELECT agent, message, details as data, timestamp as created_at 
           FROM activity_log
         ) as combined_logs
         ORDER BY created_at DESC 
         LIMIT $1`, [limit]);
            return result.rows.map(row => {
                let parsedData = row.data;
                if (typeof row.data === 'string') {
                    try {
                        parsedData = JSON.parse(row.data);
                    }
                    catch (e) {
                        // If parsing fails, return the raw string wrapped in an object so the UI can still show it
                        parsedData = { raw_content: row.data, parse_error: 'Invalid JSON' };
                    }
                }
                return {
                    agent: row.agent,
                    message: row.message,
                    data: parsedData,
                    timestamp: row.created_at
                };
            });
        }
        catch (e) {
            console.error(`Failed to fetch logs from PG (${useSimPool ? 'sim' : 'live'}):`, e.message || e);
            console.error('Full error:', e);
            return [];
        }
    }
    async saveEvent(event) {
        const mode = configService.get('dbMode');
        const pool = mode === 'test' ? this.simPool : this.pgPool;
        if (pool) {
            try {
                await pool.query(`INSERT INTO events (event_id, correlation_id, source, topic, type, payload, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                    event.event_id,
                    event.correlation_id,
                    event.source,
                    event.topic,
                    event.type,
                    JSON.stringify(event.payload),
                    event.timestamp || new Date()
                ]);
            }
            catch (e) {
                console.error(`Failed to save event to PG (${mode}):`, e.message);
            }
        }
    }
    async getEvents(topic, source) {
        const mode = configService.get('dbMode');
        let items = [];
        const query = topic
            ? "SELECT * FROM events WHERE topic = $1 ORDER BY created_at DESC"
            : "SELECT * FROM events ORDER BY created_at DESC";
        const params = topic ? [topic] : [];
        const useSimPool = source === 'sim' || source === 'mock' || (!source && mode === 'test');
        const useLivePool = source === 'live' || (!source && mode === 'live');
        const mapRow = (row) => ({
            event_id: row.event_id,
            correlation_id: row.correlation_id,
            source: row.source,
            topic: row.topic,
            type: row.type,
            payload: row.payload,
            timestamp: row.created_at
        });
        if (this.simPool && useSimPool) {
            try {
                const res = await this.simPool.query(query, params);
                items = items.concat(res.rows.map(mapRow));
            }
            catch (e) { }
        }
        if (this.pgPool && useLivePool) {
            try {
                const res = await this.pgPool.query(query, params);
                items = items.concat(res.rows.map(mapRow));
            }
            catch (e) { }
        }
        return items;
    }
    async getTopics(source) {
        const mode = configService.get('dbMode');
        const topics = new Set();
        const useSimPool = source === 'sim' || source === 'mock' || (!source && mode === 'test');
        const useLivePool = source === 'live' || (!source && mode === 'live');
        if (this.simPool && useSimPool) {
            try {
                const res = await this.simPool.query("SELECT DISTINCT topic FROM events");
                res.rows.forEach((r) => topics.add(r.topic));
            }
            catch (e) { }
        }
        if (this.pgPool && useLivePool) {
            try {
                const res = await this.pgPool.query("SELECT DISTINCT topic FROM events");
                res.rows.forEach((r) => topics.add(r.topic));
            }
            catch (e) { }
        }
        return Array.from(topics);
    }
    async clearLogs(source) {
        const mode = configService.get('dbMode');
        const pool = mode === 'test' ? this.simPool : this.pgPool;
        if (!pool) {
            console.log('[PostgresAdapter.clearLogs] Pool is null');
            return;
        }
        try {
            if (source) {
                await pool.query("DELETE FROM events WHERE topic = $1 OR payload::text LIKE $2", [source, `%${source}%`]);
                await pool.query("DELETE FROM activity_log WHERE agent = $1", [source]);
                console.log(`[PostgresAdapter.clearLogs] Cleared logs for source: ${source}`);
            }
            else {
                await pool.query("DELETE FROM events");
                await pool.query("DELETE FROM activity_log");
                console.log('[PostgresAdapter.clearLogs] Cleared all logs');
            }
        }
        catch (e) {
            console.error(`[PostgresAdapter] Failed to clear logs:`, e.message);
        }
    }
    async clearSimulationData() {
        console.log('[PostgresAdapter.clearSimulationData] Clearing SIMULATION pool only');
        // Order matters for foreign keys: delete children first
        const tables = [
            'research_staging',
            'research_sessions',
            'consumer_offsets',
            'events_archive',
            'events',
            'orders',
            'ads',
            'products'
        ];
        if (!this.simPool) {
            console.log('[PostgresAdapter.clearSimulationData] simPool is null, nothing to clear');
            return;
        }
        try {
            for (const table of tables) {
                await this.simPool.query(`DELETE FROM ${table}`);
            }
            console.log(`[PostgresAdapter] Cleared simulation pool tables: ${tables.join(', ')}`);
        }
        catch (e) {
            console.error(`[PostgresAdapter] Failed to clear simulation pool:`, e.message);
            throw e;
        }
    }
}
