import { ClassInfo, GeneratorOptions } from './types';
import { DependencyResolver } from './dependency-resolver';
import { CodeGenerator } from './code-generator';
import { FileWriter } from './file-writer';

export class ContainerGenerator {
  private dependencyResolver: DependencyResolver;
  private codeGenerator: CodeGenerator;
  private fileWriter: FileWriter;

  constructor(options: GeneratorOptions) {
    this.dependencyResolver = new DependencyResolver(options.classes);
    this.codeGenerator = new CodeGenerator(options.classes);
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
    const imports = this.codeGenerator.generateImports();
    const instantiations = this.codeGenerator.generateInstantiations(sortedClasses);
    const containerObject = this.codeGenerator.generateContainerObject();
    const typeExport = this.codeGenerator.generateTypeExport();

    return `${imports}\n\n${instantiations}\n\n${containerObject}\n\n${typeExport}\n`;
  }
}

export function generateContainerFile(classes: ClassInfo[], outputPath: string): void {
  const generator = new ContainerGenerator({ classes, outputPath });
  generator.generateContainer();
}

export function detectCircularDependencies(classes: ClassInfo[]): string[][] {
  const resolver = new DependencyResolver(classes);
  return resolver.detectCircularDependencies();
}