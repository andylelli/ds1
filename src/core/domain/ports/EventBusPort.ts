export interface EventBusPort {
  publish(topic: string, eventType: string, payload: any, source?: string): Promise<void>;
  subscribe(topic: string, consumerId: string, handler: (event: any) => Promise<void>): Promise<void>;
  getEvents(topic: string, limit?: number, offset?: number): Promise<any[]>;
}
