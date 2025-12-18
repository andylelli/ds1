import { EventName, EventPayload, DomainEvent } from '../events/Registry.js';

export interface EventBusPort {
  /**
   * Publish a strictly typed event to the bus.
   * The topic and type are derived from the eventName (e.g., 'Domain.Action').
   */
  publish<K extends EventName>(
    eventName: K, 
    payload: EventPayload<K>, 
    correlationId?: string,
    source?: string
  ): Promise<void>;

  /**
   * Subscribe to a specific event type.
   */
  subscribe<K extends EventName>(
    eventName: K, 
    consumerId: string, 
    handler: (event: DomainEvent<EventPayload<K>>) => Promise<void>
  ): Promise<void>;

  /**
   * Retrieve events for a given topic (domain).
   */
  getEvents(topic: string, limit?: number, offset?: number): Promise<DomainEvent[]>;
}
