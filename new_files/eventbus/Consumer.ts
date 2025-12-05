import { EventStore } from "./EventStore";
import { ConsumerOptions, EventHandler, StoredEvent } from "./types";

export class Consumer {
  private running = false;
  private timer: NodeJS.Timeout | null = null;
  private readonly batchSize: number;
  private readonly pollIntervalMs: number;
  private readonly onError?: (error: unknown, event?: StoredEvent<any>) => void;

  constructor(
    private readonly store: EventStore,
    private readonly topic: string,
    private readonly consumerName: string,
    private readonly handler: EventHandler,
    options: ConsumerOptions = {}
  ) {
    this.batchSize = options.batchSize ?? 100;
    this.pollIntervalMs = options.pollIntervalMs ?? 2000;
    this.onError = options.onError;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.scheduleNextPoll(0);
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNextPoll(delay: number): void {
    if (!this.running) return;
    this.timer = setTimeout(() => {
      this.poll().catch((err) => this.handleError(err));
    }, delay);
  }

  private handleError(error: unknown, event?: StoredEvent<any>): void {
    if (this.onError) {
      this.onError(error, event);
    } else {
      console.error(
        `[Consumer ${this.consumerName}/${this.topic}] error`,
        error,
        event ? `for event id=${event.id}` : ""
      );
    }
  }

  private async poll(): Promise<void> {
    if (!this.running) return;

    const lastOffset = await this.store.getOffset(this.consumerName, this.topic);
    const events = await this.store.fetchBatch(this.topic, lastOffset, this.batchSize);

    if (events.length === 0) {
      this.scheduleNextPoll(this.pollIntervalMs);
      return;
    }

    let maxId = lastOffset;

    for (const ev of events) {
      try {
        await this.handler(ev);
        if (ev.id > maxId) {
          maxId = ev.id;
        }
      } catch (err) {
        this.handleError(err, ev);
        break;
      }
    }

    if (maxId !== lastOffset) {
      await this.store.setOffset(this.consumerName, this.topic, maxId);
    }

    this.scheduleNextPoll(0);
  }
}
