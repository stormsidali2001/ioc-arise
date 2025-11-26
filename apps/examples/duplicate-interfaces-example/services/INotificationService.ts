export interface INotificationService {
  sendNotification(message: string, recipient: string): Promise<void>;
  getServiceName(): string;
}