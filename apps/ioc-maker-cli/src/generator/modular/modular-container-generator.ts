import { DependencyResolver } from '../../analyser/dependency-resolver';
import { ModuleDependencyResolver } from '../../analyser/module-dependency-resolver';
import { ClassInfo } from '../../types';
import { ImportGenerator } from '../import-generator';
import { BaseContainerGenerator } from '../base-container-generator';
import { FileWriter } from '../file-writer';
import { ModuleContainerFunctionGenerator } from './module-container-function-generator';
import { ModuleInstantiationGenerator } from './module-instantiation-generator';
import { ContainerAggregator } from './container-aggregator';
import { SplitFileWriter } from './split-file-writer';
import { ErrorFactory } from '../../errors/index.js';

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
      const cycleDescription = moduleResult.cycles.map(cycle => cycle.join(' -> ')).join('; ');
      throw ErrorFactory.circularDependency(
        'modules',
        moduleResult.cycles.flat()
      );
    }

    // Then resolve class-level dependencies within each module
    const allClasses = Array.from(this.moduleGroupedClasses.values()).flat();
    const dependencyResolver = new DependencyResolver(allClasses);
    const sortResult = dependencyResolver.resolve();

    if (sortResult.cycles.length > 0) {
      const firstCycle = sortResult.cycles[0];
      if (firstCycle && firstCycle.length > 0) {
        const className = firstCycle[0] || 'unknown';
        throw ErrorFactory.circularDependency(
          className,
          firstCycle
        );
      } else {
        throw ErrorFactory.generationFailed(
          'Circular dependencies detected but cycle information is incomplete'
        );
      }
    }

    // Check if we need to split files (more than 2 modules)
    if (moduleResult.sortedModules.length >= 2) {
      this.generateSplitFiles(moduleResult.sortedModules, moduleResult.moduleDependencies);
    } else {
      const containerCode = this.generateContainerCode(moduleResult.sortedModules, moduleResult.moduleDependencies);
      this.writeContainer(containerCode);
    }
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

  /**
   * Generates split files when there are more than 3 modules.
   * Each module gets its own file, plus a main aggregator file.
   */
  private generateSplitFiles(sortedModules: string[], moduleDependencies: Map<string, Set<string>>): void {
    const splitFileWriter = new SplitFileWriter(this.fileWriter.getOutputPath());
    
    splitFileWriter.writeSplitModules(
      this.moduleGroupedClasses,
      sortedModules,
      moduleDependencies,
      this.moduleContainerFunctionGenerator,
      this.moduleInstantiationGenerator,
      this.importGenerator
    );
  }
}