import { DependencyResolver } from '../analyser/dependency-resolver';
import { GeneratorOptions } from '../types';
import { ContainerGenerator as ContainerCodeGenerator } from './container-generator';
import { FileWriter } from './file-writer';
import { ImportGenerator } from './import-generator';
import { InstantiationGenerator } from './instantiation-generator';


export class ContainerFileGenerator {
  private dependencyResolver: DependencyResolver;
  private importGenerator: ImportGenerator;
  private instantiationGenerator: InstantiationGenerator;
  private containerCodeGenerator: ContainerCodeGenerator;
  private fileWriter: FileWriter;

  constructor(options: GeneratorOptions) {
    this.dependencyResolver = new DependencyResolver(options.classes);
    this.importGenerator = new ImportGenerator(options.classes);
    this.instantiationGenerator = new InstantiationGenerator(options.classes);
    this.containerCodeGenerator = new ContainerCodeGenerator(options.classes);
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

  private generateContainerCode(sortedClasses: string[]): string {
    const imports = this.importGenerator.generateImports();
    const instantiations = this.instantiationGenerator.generateInstantiations(sortedClasses);
    const containerObject = this.containerCodeGenerator.generateContainerObject();
    const typeExport = this.containerCodeGenerator.generateTypeExport();

    return `${imports}\n\n${instantiations}\n\n${containerObject}\n\n${typeExport}\n`;
  }
}
