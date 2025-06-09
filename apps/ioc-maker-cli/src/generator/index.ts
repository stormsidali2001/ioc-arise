import { ClassInfo } from '../types';
import { DependencyResolver } from '../analyser/dependency-resolver';
import { ContainerFileGenerator } from './Container-file-generator';

export function generateContainerFile(classes: ClassInfo[], outputPath: string): void {
  const generator = new ContainerFileGenerator({ classes, outputPath });
  generator.generateContainer();
}

export function detectCircularDependencies(classes: ClassInfo[]): string[][] {
  const resolver = new DependencyResolver(classes);
  return resolver.detectCircularDependencies();
}