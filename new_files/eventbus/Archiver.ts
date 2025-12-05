import { Pool } from "pg";
import { EventStore } from "./EventStore";

export class Archiver {
  constructor(
    private readonly pool: Pool,
    private readonly store: EventStore
  ) {}

  async archiveTopic(topic: string, olderThanMs: number): Promise<void> {
    const minOffset = await this.store.getMinOffsetForTopic(topic);
    if (minOffset == null) {
      return;
    }

    const intervalSeconds = olderThanMs / 1000;

    await this.pool.query(
      `
      WITH to_archive AS (
        SELECT id, topic, type, payload, created_at
        FROM events
        WHERE topic = $1
          AND id <= $2
          AND created_at < NOW() - ($3 || ' seconds')::interval
          AND archived_at IS NULL
      ),
      inserted AS (
        INSERT INTO events_archive (id, topic, type, payload, created_at, archived_at)
        SELECT id, topic, type, payload, created_at, NOW()
        FROM to_archive
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      )
      UPDATE events
      SET archived_at = NOW()
      WHERE id IN (SELECT id FROM inserted);
      `,
      [topic, minOffset, intervalSeconds.toString()]
    );
  }
}
