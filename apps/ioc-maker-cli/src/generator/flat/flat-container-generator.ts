import { ClassInfo } from '../../types';
import { DependencyResolver } from '../../analyser/dependency-resolver';
import { ContainerGenerator as ContainerCodeGenerator } from './container-generator';
import { InstantiationGenerator } from './instantiation-generator';
import { BaseContainerGenerator } from '../base-container-generator';
import { ImportGenerator } from '../import-generator';
import { FileWriter } from '../file-writer';

/**
 * Generator for flat (non-modular) container structure.
 * Handles the traditional single-container approach.
 */
export class FlatContainerGenerator extends BaseContainerGenerator {
  private dependencyResolver: DependencyResolver;
  private instantiationGenerator: InstantiationGenerator;
  private containerCodeGenerator: ContainerCodeGenerator;
  private classes: ClassInfo[];

  constructor(
    fileWriter: FileWriter,
    classes: ClassInfo[],
    dependencyResolver: DependencyResolver,
    importGenerator: ImportGenerator,
    instantiationGenerator: InstantiationGenerator,
    containerCodeGenerator: ContainerCodeGenerator
  ) {
    super(fileWriter, importGenerator);
    this.classes = classes;
    this.dependencyResolver = dependencyResolver;
    this.instantiationGenerator = instantiationGenerator;
    this.containerCodeGenerator = containerCodeGenerator;
  }

  generate(): void {
    const sortResult = this.dependencyResolver.resolve();

    if (sortResult.cycles.length > 0) {
      throw new Error(`Circular dependencies detected: ${JSON.stringify(sortResult.cycles)}`);
    }

    const containerCode = this.generateContainerCode(sortResult.sorted);
    this.writeContainer(containerCode);
  }

  protected generateContainerCode(sortedClasses?: string[]): string {
    if (!sortedClasses) {
      const sortResult = this.dependencyResolver.resolve();
      sortedClasses = sortResult.sorted;
    }

    const imports = this.importGenerator.generateImports();
    const instantiations = this.instantiationGenerator.generateInstantiations(sortedClasses);
    const containerObject = this.containerCodeGenerator.generateContainerObject();
    const typeExport = this.containerCodeGenerator.generateTypeExport();

    return `${imports}\n\n${instantiations}\n\n${containerObject}\n\n${typeExport}\n`;
  }

  /**
   * Get the classes managed by this generator.
   */
  getClasses(): ClassInfo[] {
    return this.classes;
  }
}