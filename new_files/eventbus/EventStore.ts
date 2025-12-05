import { Pool } from "pg";
import { PublishOptions, StoredEvent } from "./types";

export class EventStore {
  constructor(private readonly pool: Pool) {}

  async publish<TPayload = any>(
    opts: PublishOptions<TPayload>
  ): Promise<StoredEvent<TPayload>> {
    const { topic, type, payload } = opts;

    const result = await this.pool.query(
      `
      INSERT INTO events (topic, type, payload)
      VALUES ($1, $2, $3)
      RETURNING id, topic, type, payload, created_at
      `,
      [topic, type, JSON.stringify(payload)]
    );

    const row = result.rows[0];
    return {
      id: Number(row.id),
      topic: row.topic,
      type: row.type,
      payload: row.payload,
      createdAt: row.created_at
    };
  }

  async fetchBatch<TPayload = any>(
    topic: string,
    afterId: number,
    limit: number
  ): Promise<StoredEvent<TPayload>[]> {
    const result = await this.pool.query(
      `
      SELECT id, topic, type, payload, created_at
      FROM events
      WHERE topic = $1
        AND id > $2
        AND archived_at IS NULL
      ORDER BY id ASC
      LIMIT $3
      `,
      [topic, afterId, limit]
    );

    return result.rows.map((row) => ({
      id: Number(row.id),
      topic: row.topic,
      type: row.type,
      payload: row.payload,
      createdAt: row.created_at
    }));
  }

  async getOffset(consumerName: string, topic: string): Promise<number> {
    const result = await this.pool.query(
      `
      SELECT last_event_id
      FROM consumer_offsets
      WHERE consumer_name = $1 AND topic = $2
      `,
      [consumerName, topic]
    );
    if (result.rowCount === 0) return 0;
    return Number(result.rows[0].last_event_id);
  }

  async setOffset(
    consumerName: string,
    topic: string,
    lastEventId: number
  ): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO consumer_offsets (consumer_name, topic, last_event_id, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (consumer_name, topic)
      DO UPDATE SET last_event_id = EXCLUDED.last_event_id,
                    updated_at    = NOW()
      `,
      [consumerName, topic, lastEventId]
    );
  }

  async getMinOffsetForTopic(topic: string): Promise<number | null> {
    const result = await this.pool.query(
      `
      SELECT MIN(last_event_id) AS min_offset
      FROM consumer_offsets
      WHERE topic = $1
      `,
      [topic]
    );

    const value = result.rows[0]?.min_offset;
    if (value === null || value === undefined) return null;
    return Number(value);
  }
}
