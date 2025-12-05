export interface StoredEvent<TPayload = any> {
  id: number;
  topic: string;
  type: string;
  payload: TPayload;
  createdAt: Date;
}

export interface PublishOptions<TPayload = any> {
  topic: string;
  type: string;
  payload: TPayload;
}

export type EventHandler<TPayload = any> = (
  event: StoredEvent<TPayload>
) => Promise<void> | void;

export interface ConsumerOptions {
  batchSize?: number;
  pollIntervalMs?: number;
  onError?: (error: unknown, event?: StoredEvent<any>) => void;
}
