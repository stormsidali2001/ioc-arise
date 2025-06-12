import { INotificationService } from './INotificationService';

// Second implementation of INotificationService - this will cause a duplicate interface error
export class SmsNotificationService implements INotificationService {
  async sendNotification(message: string, recipient: string): Promise<void> {
    console.log(`Sending SMS notification to ${recipient}: ${message}`);
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  getServiceName(): string {
    return 'SMS Notification Service';
  }
}