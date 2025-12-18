import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
export class PostgresEventBus {
    persistence;
    emitter = new EventEmitter();
    constructor(persistence) {
        this.persistence = persistence;
    }
    async publish(eventName, payload, correlationId, source = 'System') {
        const [topic, type] = eventName.split('.');
        const event = {
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
        }
        catch (error) {
            console.error(`[PostgresEventBus] Failed to persist event ${eventName}:`, error);
            // Should we throw? For now, log and continue so in-memory still works?
            // But if persistence fails, we lose state. Better to throw or handle gracefully.
        }
        // 2. Emit locally
        this.emitter.emit(eventName, event);
    }
    async subscribe(eventName, consumerId, handler) {
        this.emitter.on(eventName, async (event) => {
            try {
                await handler(event);
            }
            catch (err) {
                console.error(`[EventBus] Error in handler for ${eventName} (Consumer: ${consumerId}):`, err);
            }
        });
    }
    async getEvents(topic, limit, offset) {
        return this.persistence.getEvents(topic);
    }
}
