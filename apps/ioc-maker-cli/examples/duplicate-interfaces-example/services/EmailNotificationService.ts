import { INotificationService } from './INotificationService';

// First implementation of INotificationService
export class EmailNotificationService implements INotificationService {
  async sendNotification(message: string, recipient: string): Promise<void> {
    console.log(`Sending EMAIL notification to ${recipient}: ${message}`);
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  getServiceName(): string {
    return 'Email Notification Service';
  }
}