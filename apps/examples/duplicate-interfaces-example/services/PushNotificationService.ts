import { INotificationService } from './INotificationService';

// Third implementation of INotificationService - this will also cause a duplicate interface error
export class PushNotificationService implements INotificationService {
  async sendNotification(message: string, recipient: string): Promise<void> {
    console.log(`Sending PUSH notification to ${recipient}: ${message}`);
    // Simulate push notification delay
    await new Promise(resolve => setTimeout(resolve, 25));
  }

  getServiceName(): string {
    return 'Push Notification Service';
  }
}