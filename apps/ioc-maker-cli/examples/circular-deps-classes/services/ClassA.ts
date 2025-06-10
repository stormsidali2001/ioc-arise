import { IClassA } from '../interfaces/IClassA';
import { IClassB } from '../interfaces/IClassB';

export class ClassA implements IClassA {
  constructor(private classB: IClassB) {}
  
  methodA(): string {
    return 'ClassA calling: ' + this.classB.methodB();
  }
}