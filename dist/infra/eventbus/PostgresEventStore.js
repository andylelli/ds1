import pg from 'pg';
import { configService } from '../config/ConfigService.js';
export class PostgresEventStore {
    pool;
    constructor(liveUrl, simUrl) {
        // Determine which DB to use based on config mode
        const mode = configService.get('dbMode');
        let dbUrl = configService.get('databaseUrl') || "postgresql://postgres:postgres@localhost:5432/dropship";
        if (mode === 'test') {
            dbUrl = simUrl || configService.get('simulatorDatabaseUrl') || "postgresql://postgres:postgres@localhost:5432/dropship_sim";
        }
        else {
            dbUrl = liveUrl || dbUrl;
        }
        this.pool = new pg.Pool({ connectionString: dbUrl });
        this.initSchema();
    }
    async initSchema() {
        const client = await this.pool.connect();
        try {
            await client.query(`
        CREATE TABLE IF NOT EXISTS events (
          id SERIAL PRIMARY KEY,
          topic VARCHAR(255) NOT NULL,
          event_type VARCHAR(255) NOT NULL,
          payload JSONB NOT NULL,
          source VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_events_topic ON events(topic);
        CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
      `);
        }
        catch (e) {
            console.error("Failed to init EventBus schema", e);
        }
        finally {
            client.release();
        }
    }
    async publish(topic, eventType, payload, source = 'system') {
        try {
            await this.pool.query(`INSERT INTO events (topic, event_type, payload, source) VALUES ($1, $2, $3, $4)`, [topic, eventType, JSON.stringify(payload), source]);
        }
        catch (e) {
            console.error(`Failed to publish event to ${topic}:`, e.message);
        }
    }
    async subscribe(topic, consumerId, handler) {
        // In a real implementation, this would likely involve polling or LISTEN/NOTIFY
        // For this simple version, we'll just log that subscription happened.
        // A real worker would poll `getEvents`.
        console.log(`[EventBus] ${consumerId} subscribed to ${topic}`);
    }
    async getEvents(topic, limit = 50, offset = 0) {
        try {
            const res = await this.pool.query(`SELECT * FROM events WHERE topic = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [topic, limit, offset]);
            return res.rows;
        }
        catch (e) {
            console.error(`Failed to get events for ${topic}:`, e.message);
            return [];
        }
    }
}
