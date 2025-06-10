import { IServiceB } from '../interfaces/IServiceB';
import { IServiceA } from '../interfaces/IServiceA';

export class ServiceB implements IServiceB {
  constructor(private serviceA: IServiceA) {}
  
  doSomething(): string {
    return 'B: ' + this.serviceA.doSomething();
  }
}