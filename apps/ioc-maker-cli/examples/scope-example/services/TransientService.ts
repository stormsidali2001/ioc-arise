import { ITransientService } from './ITransientService';

/**
 * A transient service that is created fresh for each request.
 * This service doesn't maintain state between different usages.
 * 
 * @scope transient
 */
export class TransientService implements ITransientService {
  private readonly instanceId: string;
  private readonly creationTime: Date;

  constructor() {
    this.instanceId = `transient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.creationTime = new Date();
    console.log(`⚡ TransientService created with ID: ${this.instanceId} at ${this.creationTime.toISOString()}`);
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  processData(data: string): string {
    const processed = `Processed by ${this.instanceId}: ${data.toUpperCase()}`;
    console.log(`🔄 Transient processing: ${processed}`);
    return processed;
  }

  getCreationTime(): Date {
    return this.creationTime;
  }

  performCalculation(a: number, b: number): number {
    const result = a * b + Math.random() * 100;
    console.log(`🧮 Transient calculation by ${this.instanceId}: ${a} * ${b} + random = ${result.toFixed(2)}`);
    return result;
  }
}