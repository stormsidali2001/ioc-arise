import { DependencyResolver } from '../analyser/dependency-resolver';
import { GeneratorOptions, ClassInfo } from '../types';
import { ContainerGenerator as ContainerCodeGenerator } from './container-generator';
import { FileWriter } from './file-writer';
import { ImportGenerator } from './import-generator';
import { InstantiationGenerator } from './instantiation-generator';
import { ModuleContainerGenerator } from './module-container-generator';


export class ContainerFileGenerator {
  private dependencyResolver: DependencyResolver;
  private importGenerator: ImportGenerator;
  private instantiationGenerator: InstantiationGenerator;
  private containerCodeGenerator: ContainerCodeGenerator;
  private fileWriter: FileWriter;
  private moduleGroupedClasses?: Map<string, ClassInfo[]>;
  private moduleContainerGenerator?: ModuleContainerGenerator;

  constructor(options: GeneratorOptions) {
    if (options.classes) {
      // Backward compatibility mode
      this.dependencyResolver = new DependencyResolver(options.classes);
      this.importGenerator = new ImportGenerator(options.classes);
      this.instantiationGenerator = new InstantiationGenerator(options.classes);
      this.containerCodeGenerator = new ContainerCodeGenerator(options.classes);
    } else if (options.moduleGroupedClasses) {
      // Module mode
      this.moduleGroupedClasses = options.moduleGroupedClasses;
      this.moduleContainerGenerator = new ModuleContainerGenerator(options.moduleGroupedClasses);
      // Flatten classes for existing generators (temporary solution)
      const allClasses = Array.from(options.moduleGroupedClasses.values()).flat();
      this.dependencyResolver = new DependencyResolver(allClasses);
      this.importGenerator = new ImportGenerator(allClasses);
      this.instantiationGenerator = new InstantiationGenerator(allClasses);
      this.containerCodeGenerator = new ContainerCodeGenerator(allClasses);
    } else {
      throw new Error('Either classes or moduleGroupedClasses must be provided');
    }
    this.fileWriter = new FileWriter(options.outputPath);
  }

  generateContainer(): void {
    const sortResult = this.dependencyResolver.resolve();

    if (sortResult.cycles.length > 0) {
      throw new Error(`Circular dependencies detected: ${JSON.stringify(sortResult.cycles)}`);
    }

    const containerCode = this.generateContainerCode(sortResult.sorted);
    this.fileWriter.writeContainer(containerCode);
  }

  generateModularContainer(): void {
    if (!this.moduleGroupedClasses) {
      throw new Error('Module grouped classes not available');
    }

    const sortResult = this.dependencyResolver.resolve();

    if (sortResult.cycles.length > 0) {
      throw new Error(`Circular dependencies detected: ${JSON.stringify(sortResult.cycles)}`);
    }

    const containerCode = this.generateModularContainerCode(sortResult.sorted);
    this.fileWriter.writeContainer(containerCode);
  }

  private generateContainerCode(sortedClasses: string[]): string {
    const imports = this.importGenerator.generateImports();
    const instantiations = this.instantiationGenerator.generateInstantiations(sortedClasses);
    const containerObject = this.containerCodeGenerator.generateContainerObject();
    const typeExport = this.containerCodeGenerator.generateTypeExport();

    return `${imports}\n\n${instantiations}\n\n${containerObject}\n\n${typeExport}\n`;
  }

  private generateModularContainerCode(sortedClasses: string[]): string {
    if (!this.moduleContainerGenerator) {
      throw new Error('Module container generator not available');
    }

    const imports = this.importGenerator.generateImports();
    const instantiations = this.instantiationGenerator.generateInstantiations(sortedClasses, this.moduleGroupedClasses);
    const moduleContainers = this.moduleContainerGenerator.generateModuleContainers();
    const aggregatedContainer = this.moduleContainerGenerator.generateAggregatedContainer();
    const typeExport = this.moduleContainerGenerator.generateModularTypeExport();

    return `${imports}\n\n${instantiations}\n\n${moduleContainers}\n\n${aggregatedContainer}\n\n${typeExport}\n`;
  }


}
