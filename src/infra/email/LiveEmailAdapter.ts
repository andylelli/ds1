import { EmailPort } from '../../core/domain/ports/EmailPort.js';

export class LiveEmailAdapter implements EmailPort {
  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    console.log(`[LiveEmail] Sending real email via SendGrid/SMTP to ${to}`);
    // Implement SendGrid or SMTP here
    throw new Error("Live Email API not implemented yet.");
  }

  async receiveEmails(filter?: any): Promise<any[]> {
    console.log(`[LiveEmail] Fetching real emails via IMAP/POP3`);
    throw new Error("Live Email Fetching not implemented yet.");
  }
}
