import { BaseAgent } from './BaseAgent.js';
import { PersistencePort } from '../core/domain/ports/PersistencePort.js';
import { EmailPort } from '../core/domain/ports/EmailPort.js';

export class CustomerServiceAgent extends BaseAgent {
  private email: EmailPort;

  constructor(db: PersistencePort, email: EmailPort) {
    super('CustomerService', db);
    this.email = email;
    this.registerTool('handle_ticket', this.handleTicket.bind(this));
    this.registerTool('generate_faq', this.generateFAQ.bind(this));
    this.registerTool('check_emails', this.checkEmails.bind(this));
  }

  async checkEmails() {
    const emails = await this.email.receiveEmails();
    this.log('info', `Checked emails, found ${emails.length}`);
    return { emails };
  }

  async handleTicket(args: { ticket_id: string, message: string }) {
    const { ticket_id, message } = args;
    this.log('info', `Processing ticket ${ticket_id}`);
    // Simple sentiment analysis simulation
    const sentiment = message.toLowerCase().includes('angry') ? 'negative' : 'neutral';
    
    const responseText = sentiment === 'negative' ? 'We apologize for the inconvenience.' : 'Thank you for reaching out.';
    
    // Send email response
    await this.email.sendEmail('customer@example.com', `Re: Ticket ${ticket_id}`, responseText);

    return {
      response: responseText,
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
