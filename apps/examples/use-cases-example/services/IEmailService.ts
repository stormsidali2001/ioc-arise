export interface IEmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  sendWelcomeEmail(userEmail: string, userName: string): Promise<void>;
}