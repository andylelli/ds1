export class MockEmailAdapter {
    async sendEmail(to, subject, body) {
        console.log(`[MockEmail] Sending email to ${to}: ${subject}`);
        return true;
    }
    async receiveEmails(filter) {
        console.log(`[MockEmail] Checking inbox...`);
        return [
            { id: 'e1', from: 'customer@example.com', subject: 'Where is my order?', body: 'I ordered 2 days ago.' }
        ];
    }
}
