export class Consumer {
  constructor(store, topic, consumerName, handler, options = {}) {
    this.store = store;
    this.topic = topic;
    this.consumerName = consumerName;
    this.handler = handler;
    this.batchSize = options.batchSize ?? 100;
    this.pollIntervalMs = options.pollIntervalMs ?? 2000;
    this.onError = options.onError;
    this.running = false;
    this.timer = null;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.scheduleNextPoll(0);
  }

  stop() {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  scheduleNextPoll(delay) {
    if (!this.running) return;
    this.timer = setTimeout(() => {
      this.poll().catch((err) => this.handleError(err));
    }, delay);
  }

  handleError(error, event) {
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

  async poll() {
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
