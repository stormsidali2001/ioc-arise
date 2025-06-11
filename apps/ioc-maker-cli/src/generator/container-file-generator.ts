import { DependencyResolver } from '../analyser/dependency-resolver';
import { ModuleDependencyResolver } from '../analyser/module-dependency-resolver';
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
      throw new Error('Module grouped classes not provided for modular container generation');
    }

    // First, check for module-level cycles
    const moduleDependencyResolver = new ModuleDependencyResolver(this.moduleGroupedClasses);
    const moduleResult = moduleDependencyResolver.resolve();

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

    const containerCode = this.generateModularContainerCode(sortResult.sorted, moduleResult.sortedModules, moduleResult.moduleDependencies);
    this.fileWriter.writeContainer(containerCode);
  }

  private generateContainerCode(sortedClasses: string[]): string {
    const imports = this.importGenerator.generateImports();
    const instantiations = this.instantiationGenerator.generateInstantiations(sortedClasses);
    const containerObject = this.containerCodeGenerator.generateContainerObject();
    const typeExport = this.containerCodeGenerator.generateTypeExport();

    return `${imports}\n\n${instantiations}\n\n${containerObject}\n\n${typeExport}\n`;
  }

  private generateModularContainerCode(sortedClasses: string[], sortedModules: string[], moduleDependencies: Map<string, Set<string>>): string {
    console.log("sorted modules",sortedModules)
    const imports = this.importGenerator.generateImports();
    const moduleContainers = this.generateModuleContainers(sortedModules, moduleDependencies);
    const aggregatedContainer = this.generateAggregatedContainer(sortedModules);
    const typeExport = this.generateModularTypeExport();

    return `${imports}\n\n${moduleContainers}\n\n${aggregatedContainer}\n\n${typeExport}\n`;
  }

  private generateModuleContainers(sortedModules: string[], moduleDependencies: Map<string, Set<string>>): string {
    if (!this.moduleGroupedClasses) return '';

    const moduleContainerCodes: string[] = [];
    const moduleContainerFunctions: string[] = [];
    
    // Generate module container functions in dependency order
    for (const moduleName of sortedModules) {
      const moduleClasses = this.moduleGroupedClasses.get(moduleName);
      if (!moduleClasses) continue;
      
      const moduleFunctionName = `create${moduleName}Container`;
      const moduleExports: string[] = [];
      const moduleDeps = moduleDependencies.get(moduleName) || new Set();
      
      // Generate function parameters for dependent modules
      const functionParams: string[] = [];
      
      for (const depModule of moduleDeps) {
        const depVarName = this.camelCase(depModule) + 'Container';
        functionParams.push(`${depVarName}: ReturnType<typeof create${depModule}Container>`);
      }
      
      // Generate lazy initialization variables and factory functions
      const lazyInitializations: string[] = [];
      const factoryFunctions: string[] = [];
      
      // First, create factory functions for transient dependencies
      for (const classInfo of moduleClasses) {
        if (classInfo.scope === 'transient') {
          const instanceName = this.camelCase(classInfo.name);
          const factoryName = `${instanceName}Factory`;
          factoryFunctions.push(`  const ${factoryName} = (): ${classInfo.name} => new ${classInfo.name}();`);
        }
      }
      
      // Sort singleton classes by their dependencies within the module
      const singletonClasses = moduleClasses.filter(c => c.scope !== 'transient');
      const sortedSingletons = this.sortClassesByDependencies(singletonClasses, moduleClasses);
      
      // Generate lazy initialization variables for singletons
      for (const classInfo of sortedSingletons) {
        const instanceName = this.camelCase(classInfo.name);
        lazyInitializations.push(`  let ${instanceName}: ${classInfo.name} | undefined;`);
      }
      
      // Generate lazy getter functions for singletons
      const lazyGetters: string[] = [];
      for (const classInfo of sortedSingletons) {
        const instanceName = this.camelCase(classInfo.name);
        const getterName = `get${classInfo.name}`;
        const constructorArgs: string[] = [];
        
        // Build constructor arguments
        for (const dep of classInfo.dependencies) {
          // Check if dependency is from another module
          let foundInOtherModule = false;
          for (const depModule of moduleDeps) {
            const depModuleClasses = this.moduleGroupedClasses!.get(depModule);
            if (depModuleClasses) {
              const depClass = depModuleClasses.find(c => c.interfaceName === dep);
              if (depClass) {
                const depModuleVarName = this.camelCase(depModule) + 'Container';
                constructorArgs.push(`${depModuleVarName}.${dep}`);
                foundInOtherModule = true;
                break;
              }
            }
          }
          
          // If not found in other modules, it's from the same module
          if (!foundInOtherModule) {
            const depClass = moduleClasses.find(c => c.interfaceName === dep);
            if (depClass) {
              if (depClass.scope === 'transient') {
                const depInstanceName = this.camelCase(depClass.name);
                constructorArgs.push(`${depInstanceName}Factory()`);
              } else {
                const depGetterName = `get${depClass.name}`;
                constructorArgs.push(`${depGetterName}()`);
              }
            }
          }
        }
        
        const instantiation = constructorArgs.length > 0 ?
          `new ${classInfo.name}(${constructorArgs.join(', ')})` :
          `new ${classInfo.name}()`;
        
        const lazyGetter = `  const ${getterName} = (): ${classInfo.name} => {\n    if (!${instanceName}) {\n      ${instanceName} = ${instantiation};\n    }\n    return ${instanceName};\n  };`;
        
        lazyGetters.push(lazyGetter);
      }
      
      // Generate module exports
      for (const classInfo of moduleClasses) {
        if (classInfo.interfaceName) {
          const instanceName = this.camelCase(classInfo.name);
          const isTransient = classInfo.scope === 'transient';
          
          if (isTransient) {
            moduleExports.push(`    get ${classInfo.interfaceName}(): ${classInfo.name} {\n      return ${instanceName}Factory();\n    }`);
          } else {
            const getterName = `get${classInfo.name}`;
            moduleExports.push(`    get ${classInfo.interfaceName}(): ${classInfo.name} {\n      return ${getterName}();\n    }`);
          }
        }
      }
      
      const functionSignature = functionParams.length > 0 ? 
        `function ${moduleFunctionName}(${functionParams.join(', ')})` :
        `function ${moduleFunctionName}()`;
      
      const returnObject = moduleExports.length > 0 ? 
        `  return {\n${moduleExports.join(',\n')}\n  };` :
        '  return {};';
      
      const functionBody = [
        ...factoryFunctions,
        '',
        ...lazyInitializations,
        '',
        ...lazyGetters,
        '',
        returnObject
      ].filter(line => line !== '' || factoryFunctions.length > 0 || lazyInitializations.length > 0 || lazyGetters.length > 0).join('\n');
      
      const moduleContainerFunction = `${functionSignature} {\n${functionBody}\n}`;
      moduleContainerFunctions.push(moduleContainerFunction);
    }
    
    // Sort modules by dependencies and generate instantiations
    for (const moduleName of sortedModules) {
      const moduleVarName = this.camelCase(moduleName) + 'Container';
      const moduleFunctionName = `create${moduleName}Container`;
      const moduleDeps = moduleDependencies.get(moduleName) || new Set();
      
      const functionArgs: string[] = [];
      for (const depModule of moduleDeps) {
        const depVarName = this.camelCase(depModule) + 'Container';
        functionArgs.push(depVarName);
      }
      
      const moduleInstantiation = functionArgs.length > 0 ?
        `const ${moduleVarName} = ${moduleFunctionName}(${functionArgs.join(', ')});` :
        `const ${moduleVarName} = ${moduleFunctionName}();`;
      
      moduleContainerCodes.push(moduleInstantiation);
    }
    
    return moduleContainerFunctions.join('\n\n') + '\n\n' + moduleContainerCodes.join('\n');
  }

  private generateAggregatedContainer(sortedModules: string[]): string {
    if (!this.moduleGroupedClasses) return '';

    const moduleExports: string[] = [];
    
    for (const moduleName of sortedModules) {
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

  private sortClassesByDependencies(classes: ClassInfo[], allModuleClasses: ClassInfo[]): ClassInfo[] {
    const sorted: ClassInfo[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (classInfo: ClassInfo) => {
      if (visiting.has(classInfo.name)) {
        // Circular dependency detected, just add it
        return;
      }
      if (visited.has(classInfo.name)) {
        return;
      }

      visiting.add(classInfo.name);

      // Visit dependencies first (only within the same module)
      for (const dep of classInfo.dependencies) {
        const depClass = allModuleClasses.find(c => c.interfaceName === dep && c.scope !== 'transient');
        if (depClass && classes.includes(depClass)) {
          visit(depClass);
        }
      }

      visiting.delete(classInfo.name);
      visited.add(classInfo.name);
      sorted.push(classInfo);
    };

    for (const classInfo of classes) {
      visit(classInfo);
    }

    return sorted;
  }


}
