import { DependencyResolver } from '../../analyser/dependency-resolver';
import { ModuleDependencyResolver } from '../../analyser/module-dependency-resolver';
import { ClassInfo } from '../../types';
import { ImportGenerator } from '../import-generator';
import { BaseContainerGenerator } from '../base-container-generator';
import { FileWriter } from '../file-writer';
import { ModuleContainerFunctionGenerator } from './module-container-function-generator';
import { ModuleInstantiationGenerator } from './module-instantiation-generator';
import { ContainerAggregator } from './container-aggregator';

/**
 * Generator for modular container structure.
 * Handles module-based dependency injection with inter-module dependencies.
 */
export class ModularContainerGenerator extends BaseContainerGenerator {
  private moduleGroupedClasses: Map<string, ClassInfo[]>;
  private moduleDependencyResolver: ModuleDependencyResolver;
  private moduleContainerFunctionGenerator: ModuleContainerFunctionGenerator;
  private moduleInstantiationGenerator: ModuleInstantiationGenerator;
  private containerAggregator: ContainerAggregator;

  constructor(
    fileWriter: FileWriter,
    moduleGroupedClasses: Map<string, ClassInfo[]>,
    moduleDependencyResolver: ModuleDependencyResolver,
    importGenerator: ImportGenerator,
    moduleContainerFunctionGenerator: ModuleContainerFunctionGenerator,
    moduleInstantiationGenerator: ModuleInstantiationGenerator,
    containerAggregator: ContainerAggregator
  ) {
    super(fileWriter, importGenerator);
    this.moduleGroupedClasses = moduleGroupedClasses;
    this.moduleDependencyResolver = moduleDependencyResolver;
    this.moduleContainerFunctionGenerator = moduleContainerFunctionGenerator;
    this.moduleInstantiationGenerator = moduleInstantiationGenerator;
    this.containerAggregator = containerAggregator;
  }

  generate(): void {
    // First, check for module-level cycles
    const moduleResult = this.moduleDependencyResolver.resolve();

    if (moduleResult.cycles.length > 0) {
      throw new Error(`Circular dependencies detected between modules: ${JSON.stringify(moduleResult.cycles)}`);
    }

    // Then resolve class-level dependencies within each module
    const allClasses = Array.from(this.moduleGroupedClasses.values()).flat();
    const dependencyResolver = new DependencyResolver(allClasses);
    const sortResult = dependencyResolver.resolve();

    if (sortResult.cycles.length > 0) {
      throw new Error(`Circular dependencies detected within classes: ${JSON.stringify(sortResult.cycles)}`);
    }

    const containerCode = this.generateContainerCode(moduleResult.sortedModules, moduleResult.moduleDependencies);
    this.writeContainer(containerCode);
  }

  protected generateContainerCode(sortedModules?: string[], moduleDependencies?: Map<string, Set<string>>): string {
    if (!sortedModules || !moduleDependencies) {
      const moduleResult = this.moduleDependencyResolver.resolve();
      sortedModules = moduleResult.sortedModules;
      moduleDependencies = moduleResult.moduleDependencies;
    }

    const imports = this.importGenerator.generateImports();
    const moduleContainers = this.generateModuleContainers(sortedModules, moduleDependencies);
    const aggregatedContainer = this.containerAggregator.generateAggregatedContainer(sortedModules);
    const typeExport = this.containerAggregator.generateModularTypeExport();

    return `${imports}\n\n${moduleContainers}\n\n${aggregatedContainer}\n\n${typeExport}\n`;
  }

  private generateModuleContainers(sortedModules: string[], moduleDependencies: Map<string, Set<string>>): string {
    const moduleContainerFunctions = this.moduleContainerFunctionGenerator.generateModuleContainerFunctions(sortedModules, moduleDependencies);
    const moduleInstantiations = this.moduleInstantiationGenerator.generateModuleInstantiations(sortedModules, moduleDependencies);
    
    return moduleContainerFunctions.join('\n\n') + '\n\n' + moduleInstantiations.join('\n');
  }




}