export type EventType =
  | 'simulation.started'
  | 'simulation.completed'
  | 'simulation.step'
  | 'market_event'
  | 'product_found'
  | 'supplier_selected'
  | 'store_created'
  | 'marketing_launched'
  | 'order.created'
  | 'order.fulfilled'
  | 'problem_event.generated'
  | 'analytics.snapshot.generated'
  | 'LOG';

export interface BaseEvent<TType extends EventType = EventType, TPayload = any> {
  topic?: string; // Kafka/EventBus topic
  type: TType;
  payload: TPayload;
  timestamp?: string;
  source?: 'simulation' | 'live' | 'admin';
}
