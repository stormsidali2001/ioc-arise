import { ISingletonService } from './ISingletonService';

/**
 * A singleton service that maintains state across the application lifecycle.
 * This service is created once and reused for all subsequent requests.
 * 
 * @scope singleton
 */
export class SingletonService implements ISingletonService {
  private readonly instanceId: string;
  private counter: number = 0;
  private readonly creationTime: Date;
  private logs: string[] = [];

  constructor() {
    this.instanceId = `singleton-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.creationTime = new Date();
    console.log(`🔧 SingletonService created with ID: ${this.instanceId} at ${this.creationTime.toISOString()}`);
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  incrementCounter(): number {
    this.counter++;
    console.log(`📊 Singleton counter incremented to: ${this.counter}`);
    return this.counter;
  }

  getCounter(): number {
    return this.counter;
  }

  log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    console.log(`📝 Singleton logged: ${logEntry}`);
  }

  getCreationTime(): Date {
    return this.creationTime;
  }

  getLogs(): string[] {
    return [...this.logs];
  }
}