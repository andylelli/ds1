export interface EmailPort {
  sendEmail(to: string, subject: string, body: string): Promise<boolean>;
  receiveEmails(filter?: any): Promise<any[]>;
}
