import { ClassInfo } from '../types';
import { DependencyResolver } from '../analyser/dependency-resolver';
import { ContainerFileGenerator as Wrapped } from './container-file-generator';
import { wrappedClass } from '@notjustcoders/one-logger-client-sdk';
const ContainerFileGenerator = wrappedClass("ContainerFileGenerator", Wrapped,(name,...args)=>({name,args}))

export function generateContainerFile(classes: ClassInfo[], outputPath: string): void {
  const generator = new ContainerFileGenerator({ classes, outputPath });
  generator.generateContainer();

}

export function detectCircularDependencies(classes: ClassInfo[]): string[][] {
  const resolver = new DependencyResolver(classes);
  return resolver.detectCircularDependencies();
}