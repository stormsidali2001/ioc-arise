import { DependencyResolver } from '../analyser/dependency-resolver';
import { GeneratorOptions, ClassInfo } from '../types';
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
  private moduleGroupedClasses?: Map<string, ClassInfo[]>;

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

    console.log("sort order",sortResult)

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
    const imports = this.importGenerator.generateImports();
    const instantiations = this.instantiationGenerator.generateInstantiations(sortedClasses);
    const moduleContainers = this.generateModuleContainers();
    const aggregatedContainer = this.generateAggregatedContainer();
    const typeExport = this.generateModularTypeExport();

    return `${imports}\n\n${instantiations}\n\n${moduleContainers}\n\n${aggregatedContainer}\n\n${typeExport}\n`;
  }

  private generateModuleContainers(): string {
    if (!this.moduleGroupedClasses) return '';

    const moduleContainerCodes: string[] = [];
    
    for (const [moduleName, moduleClasses] of this.moduleGroupedClasses) {
      const moduleVarName = this.camelCase(moduleName) + 'Container';
      const moduleExports: string[] = [];
      
      for (const classInfo of moduleClasses) {
        if (classInfo.interfaceName) {
          const instanceName = this.camelCase(classInfo.name);
          // Check if this is a transient dependency (has factory)
          const isTransient = classInfo.scope === 'transient';
          const exportValue = isTransient ? 
            `get ${classInfo.interfaceName}(): ${classInfo.name} {\n    return ${instanceName}Factory();\n  }` :
            `${classInfo.interfaceName}: ${instanceName}`;
          
          if (isTransient) {
            moduleExports.push(`  ${exportValue}`);
          } else {
            moduleExports.push(`  ${exportValue}`);
          }
        }
      }
      
      const moduleContainerCode = `const ${moduleVarName} = {\n${moduleExports.join(',\n')}\n};`;
      moduleContainerCodes.push(moduleContainerCode);
    }
    
    return moduleContainerCodes.join('\n\n');
  }

  private generateAggregatedContainer(): string {
    if (!this.moduleGroupedClasses) return '';

    const moduleExports: string[] = [];
    
    for (const [moduleName] of this.moduleGroupedClasses) {
      const moduleVarName = this.camelCase(moduleName) + 'Container';
      const moduleKey = this.camelCase(moduleName);
      moduleExports.push(`  ${moduleKey}: ${moduleVarName}`);
    }
    
    return `export const container = {\n${moduleExports.join(',\n')}\n};`;
  }

  private generateModularTypeExport(): string {
    return 'export type Container = typeof container;';
  }

  private camelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1).replace(/[^a-zA-Z0-9]/g, '');
  }
}
