import { BaseContainerGenerator } from './base-container-generator';
import { FlatContainerGenerator } from './flat-container-generator';
import { ModularContainerGenerator } from './modular-container-generator';
import { DependencyResolver } from '../analyser/dependency-resolver';
import { ModuleDependencyResolver } from '../analyser/module-dependency-resolver';
import { ImportGenerator } from './import-generator';
import { InstantiationGenerator } from './instantiation-generator';
import { ContainerGenerator as ContainerCodeGenerator } from './container-generator';
import { GeneratorOptions, ClassInfo } from '../types';

/**
 * Factory class for creating the appropriate container generator
 * based on the input type (flat classes or module-grouped classes).
 * Handles dependency injection at the factory level instead of constructor level.
 */
export class ContainerGeneratorFactory {
  /**
   * Creates the appropriate container generator based on the input type.
   * Injects all necessary dependencies in the constructor.
   * 
   * @param classesOrModules - Either a flat array of classes or a Map of module-grouped classes
   * @param outputPath - The output path for the generated container file
   * @returns The appropriate container generator instance with dependencies injected
   */
  static create(
    classesOrModules: ClassInfo[] | Map<string, ClassInfo[]>, 
    outputPath: string
  ): BaseContainerGenerator {
    if (classesOrModules instanceof Map) {
      // Module-based generation - create dependencies and inject in constructor
      const moduleDependencyResolver = new ModuleDependencyResolver(classesOrModules);
      const allClasses = Array.from(classesOrModules.values()).flat();
      const importGenerator = new ImportGenerator(allClasses);

      return new ModularContainerGenerator(
        outputPath,
        classesOrModules,
        moduleDependencyResolver,
        importGenerator
      );
    } else {
      // Backward compatibility: flat classes array - create dependencies and inject in constructor
      const dependencyResolver = new DependencyResolver(classesOrModules);
      const importGenerator = new ImportGenerator(classesOrModules);
      const instantiationGenerator = new InstantiationGenerator(classesOrModules);
      const containerCodeGenerator = new ContainerCodeGenerator(classesOrModules);

      return new FlatContainerGenerator(
        outputPath,
        classesOrModules,
        dependencyResolver,
        importGenerator,
        instantiationGenerator,
        containerCodeGenerator
      );
    }
  }

  /**
   * Determines if the input represents a modular structure.
   * 
   * @param classesOrModules - The input to check
   * @returns true if the input is a Map (modular), false if it's an array (flat)
   */
  static isModular(classesOrModules: ClassInfo[] | Map<string, ClassInfo[]>): boolean {
    return classesOrModules instanceof Map;
  }

  /**
   * Gets the total number of classes from either flat or modular input.
   * 
   * @param classesOrModules - The input to count classes from
   * @returns The total number of classes
   */
  static getClassCount(classesOrModules: ClassInfo[] | Map<string, ClassInfo[]>): number {
    if (classesOrModules instanceof Map) {
      return Array.from(classesOrModules.values()).flat().length;
    } else {
      return classesOrModules.length;
    }
  }

  /**
   * Gets the number of modules from modular input.
   * 
   * @param classesOrModules - The input to count modules from
   * @returns The number of modules, or 1 for flat structure
   */
  static getModuleCount(classesOrModules: ClassInfo[] | Map<string, ClassInfo[]>): number {
    if (classesOrModules instanceof Map) {
      return classesOrModules.size;
    } else {
      return 1; // Flat structure is considered as one implicit module
    }
  }
}