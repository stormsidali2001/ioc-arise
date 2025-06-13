import { BaseContainerGenerator } from './base-container-generator';
import { ModularContainerGenerator } from './modular/modular-container-generator';
import { ModuleDependencyResolver } from '../analyser/module-dependency-resolver';
import { ImportGenerator } from './import-generator';
import { FileWriter } from './file-writer';
import {  ClassInfo } from '../types';
import { ModuleContainerFunctionGenerator } from './modular/module-container-function-generator';
import { ModuleFunctionSignatureGenerator } from './modular/module-function-signature-generator';
import { ModuleDependencyResolver as ModularModuleDependencyResolver } from './modular/module-dependency-resolver';
import { ModuleFunctionBodyGenerator } from './modular/module-function-body-generator';
import { ModuleInstantiationGenerator } from './modular/module-instantiation-generator';
import { ContainerAggregator } from './modular/container-aggregator';

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
    classesOrModules:  Map<string, ClassInfo[]>, 
    outputPath: string
  ): BaseContainerGenerator {
    // Create FileWriter instance that will be injected into generators
    const fileWriter = new FileWriter(outputPath);

      // Module-based generation - create dependencies and inject in constructor
      const moduleDependencyResolver = new ModuleDependencyResolver(classesOrModules);
      const allClasses = Array.from(classesOrModules.values()).flat();
      const importGenerator = new ImportGenerator(allClasses);
      const moduleFunctionSignatureGenerator = new ModuleFunctionSignatureGenerator();
      const modularModuleDependencyResolver = new ModularModuleDependencyResolver(classesOrModules);
      const moduleFunctionBodyGenerator = new ModuleFunctionBodyGenerator(modularModuleDependencyResolver);
      const moduleContainerFunctionGenerator = new ModuleContainerFunctionGenerator(
        classesOrModules,
        moduleFunctionSignatureGenerator,
        modularModuleDependencyResolver,
        moduleFunctionBodyGenerator,
        importGenerator
      );
      const moduleInstantiationGenerator = new ModuleInstantiationGenerator();
      const containerAggregator = new ContainerAggregator();

      return new ModularContainerGenerator(
        fileWriter,
        classesOrModules,
        moduleDependencyResolver,
        importGenerator,
        moduleContainerFunctionGenerator,
        moduleInstantiationGenerator,
        containerAggregator
      );
  
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
  static getModuleCount(classesOrModules:  Map<string, ClassInfo[]>): number {
      return classesOrModules.size;
  }
}