import { EventStore } from "./EventStore";
import { Consumer } from "./Consumer";
import { ConsumerOptions, EventHandler, PublishOptions, StoredEvent } from "./types";

export class TopicEventBus {
  constructor(private readonly store: EventStore) {}

  async publish<TPayload = any>(
    opts: PublishOptions<TPayload>
  ): Promise<StoredEvent<TPayload>> {
    return this.store.publish(opts);
  }

  createConsumer(
    topic: string,
    consumerName: string,
    handler: EventHandler,
    options?: ConsumerOptions
  ): Consumer {
    return new Consumer(this.store, topic, consumerName, handler, options);
  }
}
