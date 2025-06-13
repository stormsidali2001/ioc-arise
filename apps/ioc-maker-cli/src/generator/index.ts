import { ClassInfo } from '../types';
import { DependencyResolver } from '../analyser/dependency-resolver';
import { ContainerGeneratorFactory } from './container-generator-factory';

/**
 * Generates a container file from either flat classes or module-grouped classes.
 * 
 * @param classesOrModules - Either a flat array of classes or a Map of module-grouped classes
 * @param outputPath - The output path for the generated container file
 */
export function generateContainerFile(classesOrModules: Map<string, ClassInfo[]>, outputPath: string): void {
  const generator = ContainerGeneratorFactory.create(classesOrModules, outputPath);
  generator.generate();
}

/**
 * Detects circular dependencies in a flat array of classes.
 * 
 * @param classes - The classes to check for circular dependencies
 * @returns An array of circular dependency chains
 */
export function detectCircularDependencies(classes: ClassInfo[]): string[][] {
  const resolver = new DependencyResolver(classes);
  return resolver.detectCircularDependencies();
}

// Re-export the factory for advanced usage
export { ContainerGeneratorFactory } from './container-generator-factory';
export { BaseContainerGenerator } from './base-container-generator';
export { ModularContainerGenerator } from './modular/modular-container-generator';