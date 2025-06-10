import { IClassB } from '../interfaces/IClassB';
import { IClassA } from '../interfaces/IClassA';

export class ClassB implements IClassB {
  constructor(private classA: IClassA) {}
  
  methodB(): string {
    return 'ClassB calling: ' + this.classA.methodA();
  }
}