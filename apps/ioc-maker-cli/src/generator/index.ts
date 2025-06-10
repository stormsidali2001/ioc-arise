import { ClassInfo } from '../types';
import { DependencyResolver } from '../analyser/dependency-resolver';
import { ContainerFileGenerator as Wrapped } from './container-file-generator';
import { wrappedClass } from '@notjustcoders/one-logger-client-sdk';
const ContainerFileGenerator = wrappedClass("ContainerFileGenerator", Wrapped,(name,...args)=>({name,args}))

export function generateContainerFile(classesOrModules: ClassInfo[] | Map<string, ClassInfo[]>, outputPath: string): void {
  if (classesOrModules instanceof Map) {
    // Module-based generation
    const generator = new ContainerFileGenerator({ moduleGroupedClasses: classesOrModules, outputPath });
    generator.generateModularContainer();
  } else {
    // Backward compatibility: flat classes array
    const generator = new ContainerFileGenerator({ classes: classesOrModules, outputPath });
    generator.generateContainer();
  }
}

export function detectCircularDependencies(classes: ClassInfo[]): string[][] {
  const resolver = new DependencyResolver(classes);
  return resolver.detectCircularDependencies();
}