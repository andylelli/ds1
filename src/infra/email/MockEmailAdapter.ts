import { EmailPort } from '../../core/domain/ports/EmailPort.js';

export class MockEmailAdapter implements EmailPort {
  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    console.log(`[MockEmail] Sending email to ${to}: ${subject}`);
    return true;
  }

  async receiveEmails(filter?: any): Promise<any[]> {
    console.log(`[MockEmail] Checking inbox...`);
    return [
      { id: 'e1', from: 'customer@example.com', subject: 'Where is my order?', body: 'I ordered 2 days ago.' }
    ];
  }
}
