import { EventEmitter } from 'events';
import { EventBusPort } from '../../core/domain/ports/EventBusPort.js';
import { EventName, EventPayload, DomainEvent } from '../../core/domain/events/Registry.js';
import { PersistencePort } from '../../core/domain/ports/PersistencePort.js';
import { v4 as uuidv4 } from 'uuid';

export class PostgresEventBus implements EventBusPort {
  private emitter = new EventEmitter();

  constructor(private persistence: PersistencePort) {}

  async publish<K extends EventName>(
    eventName: K,
    payload: EventPayload<K>,
    correlationId?: string,
    source: string = 'System'
  ): Promise<void> {
    const [topic, type] = eventName.split('.');
    const event: DomainEvent<EventPayload<K>> = {
      event_id: uuidv4(),
      correlation_id: correlationId || uuidv4(),
      timestamp: new Date(),
      topic,
      type,
      source,
      payload
    };

    // 1. Persist to Postgres
    try {
      await this.persistence.saveEvent(event);
    } catch (error) {
      console.error(`[PostgresEventBus] Failed to persist event ${eventName}:`, error);
      // Should we throw? For now, log and continue so in-memory still works?
      // But if persistence fails, we lose state. Better to throw or handle gracefully.
    }

    // 2. Emit locally
    this.emitter.emit(eventName, event);
  }

  async subscribe<K extends EventName>(
    eventName: K,
    consumerId: string,
    handler: (event: DomainEvent<EventPayload<K>>) => Promise<void>
  ): Promise<void> {
    this.emitter.on(eventName, async (event) => {
      try {
        await handler(event);
      } catch (err) {
        console.error(`[EventBus] Error in handler for ${eventName} (Consumer: ${consumerId}):`, err);
      }
    });
  }

  async getEvents(topic: string, limit?: number, offset?: number): Promise<DomainEvent[]> {
    return this.persistence.getEvents(topic);
  }
}
