import { IEmailService } from './IEmailService';

export class EmailService implements IEmailService {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    console.log(`Sending email to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    const subject = 'Welcome!';
    const body = `Hello ${userName}, welcome to our platform!`;
    await this.sendEmail(userEmail, subject, body);
  }
}