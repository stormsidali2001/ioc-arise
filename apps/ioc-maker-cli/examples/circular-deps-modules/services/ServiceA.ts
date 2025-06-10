import { IServiceA } from '../interfaces/IServiceA';
import { IServiceB } from '../interfaces/IServiceB';

export class ServiceA implements IServiceA {
  constructor(private serviceB: IServiceB) {}
  
  doSomething(): string {
    return 'A: ' + this.serviceB.doSomething();
  }
}