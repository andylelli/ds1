import { BaseAgent } from './BaseAgent.js';
import { PersistencePort } from '../core/domain/ports/PersistencePort.js';

export class CustomerServiceAgent extends BaseAgent {
  constructor(db: PersistencePort) {
    super('CustomerService', db);
    this.registerTool('handle_ticket', this.handleTicket.bind(this));
    this.registerTool('generate_faq', this.generateFAQ.bind(this));
  }

  async handleTicket(args: { ticket_id: string, message: string }) {
    const { ticket_id, message } = args;
    this.log('info', `Processing ticket ${ticket_id}`);
    // Simple sentiment analysis simulation
    const sentiment = message.toLowerCase().includes('angry') ? 'negative' : 'neutral';
    return {
      response: sentiment === 'negative' ? 'We apologize for the inconvenience.' : 'Thank you for reaching out.',
      action: sentiment === 'negative' ? 'escalate' : 'resolve'
    };
  }

  async generateFAQ(args: { product: string }) {
    const { product } = args;
    return {
      faqs: [
        { q: `How long does shipping take for ${product}?`, a: '7-14 business days.' },
        { q: 'Do you offer refunds?', a: 'Yes, within 30 days.' }
      ]
    };
  }
}
