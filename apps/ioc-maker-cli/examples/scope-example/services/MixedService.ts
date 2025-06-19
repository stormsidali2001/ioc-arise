import { ISingletonService } from './ISingletonService';
import { ITransientService } from './ITransientService';

/**
 * A service that demonstrates how singleton and transient dependencies work together.
 * This service itself is singleton, but it uses both singleton and transient dependencies.
 * 
 * @scope singleton
 */
export class MixedService {
  private readonly instanceId: string;
  private readonly creationTime: Date;
  private operationCount: number = 0;

  constructor(
    private readonly singletonService: ISingletonService,
    private readonly transientService: ITransientService
  ) {
    this.instanceId = `mixed-${Date.now()}`;
    this.creationTime = new Date();
    console.log(`🔀 MixedService created with ID: ${this.instanceId}`);
    console.log(`   - Singleton dependency ID: ${this.singletonService.getInstanceId()}`);
    console.log(`   - Transient dependency ID: ${this.transientService.getInstanceId()}`);
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  performComplexOperation(data: string): string {
    this.operationCount++;
    
    // Log to singleton service (state persists)
    this.singletonService.log(`Complex operation #${this.operationCount} started with data: ${data}`);
    
    // Increment singleton counter (state persists)
    const counter = this.singletonService.incrementCounter();
    
    // Process data with transient service (fresh instance each time this method is called)
    const processedData = this.transientService.processData(data);
    
    // Perform calculation with transient service
    const calculation = this.transientService.performCalculation(this.operationCount, counter);
    
    const result = `Operation ${this.operationCount}: ${processedData} | Calculation: ${calculation.toFixed(2)}`;
    
    console.log(`🎯 MixedService result: ${result}`);
    return result;
  }

  getServiceInfo(): {
    mixedServiceId: string;
    singletonServiceId: string;
    transientServiceId: string;
    operationCount: number;
    singletonCounter: number;
  } {
    return {
      mixedServiceId: this.instanceId,
      singletonServiceId: this.singletonService.getInstanceId(),
      transientServiceId: this.transientService.getInstanceId(),
      operationCount: this.operationCount,
      singletonCounter: this.singletonService.getCounter()
    };
  }

  getCreationTime(): Date {
    return this.creationTime;
  }
}