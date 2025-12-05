import pg from 'pg';
import { EventBusPort } from '../../core/domain/ports/EventBusPort.js';
import { configService } from '../config/ConfigService.js';

export class PostgresEventStore implements EventBusPort {
  private pool: pg.Pool;

  constructor() {
    const dbUrl = configService.get('databaseUrl') || "postgresql://postgres:postgres@localhost:5432/dropship";
    this.pool = new pg.Pool({ connectionString: dbUrl });
    this.initSchema();
  }

  private async initSchema() {
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
    } catch (e) {
      console.error("Failed to init EventBus schema", e);
    } finally {
      client.release();
    }
  }

  async publish(topic: string, eventType: string, payload: any, source: string = 'system'): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO events (topic, event_type, payload, source) VALUES ($1, $2, $3, $4)`,
        [topic, eventType, JSON.stringify(payload), source]
      );
    } catch (e: any) {
      console.error(`Failed to publish event to ${topic}:`, e.message);
    }
  }

  async subscribe(topic: string, consumerId: string, handler: (event: any) => Promise<void>): Promise<void> {
    // In a real implementation, this would likely involve polling or LISTEN/NOTIFY
    // For this simple version, we'll just log that subscription happened.
    // A real worker would poll `getEvents`.
    console.log(`[EventBus] ${consumerId} subscribed to ${topic}`);
  }

  async getEvents(topic: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const res = await this.pool.query(
        `SELECT * FROM events WHERE topic = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [topic, limit, offset]
      );
      return res.rows;
    } catch (e: any) {
      console.error(`Failed to get events for ${topic}:`, e.message);
      return [];
    }
  }
}
