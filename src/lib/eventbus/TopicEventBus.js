import { Consumer } from "./Consumer.js";

export class TopicEventBus {
  constructor(store) {
    this.store = store;
  }

  async publish(opts) {
    return this.store.publish(opts);
  }

  createConsumer(topic, consumerName, handler, options) {
    return new Consumer(this.store, topic, consumerName, handler, options);
  }
}
