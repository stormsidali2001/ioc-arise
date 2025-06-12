import { DependencyResolver } from '../analyser/dependency-resolver';
import { ModuleDependencyResolver } from '../analyser/module-dependency-resolver';
import { ClassInfo } from '../types';
import { ImportGenerator } from './import-generator';
import { BaseContainerGenerator } from './base-container-generator';

/**
 * Generator for modular container structure.
 * Handles module-based dependency injection with inter-module dependencies.
 */
export class ModularContainerGenerator extends BaseContainerGenerator {
  private moduleGroupedClasses: Map<string, ClassInfo[]>;
  private moduleDependencyResolver: ModuleDependencyResolver;

  constructor(
    outputPath: string,
    moduleGroupedClasses: Map<string, ClassInfo[]>,
    moduleDependencyResolver: ModuleDependencyResolver,
    importGenerator: ImportGenerator
  ) {
    super(outputPath, importGenerator);
    this.moduleGroupedClasses = moduleGroupedClasses;
    this.moduleDependencyResolver = moduleDependencyResolver;
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
    const aggregatedContainer = this.generateAggregatedContainer(sortedModules);
    const typeExport = this.generateModularTypeExport();

    return `${imports}\n\n${moduleContainers}\n\n${aggregatedContainer}\n\n${typeExport}\n`;
  }

  private generateModuleContainers(sortedModules: string[], moduleDependencies: Map<string, Set<string>>): string {
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
            const depModuleClasses = this.moduleGroupedClasses.get(depModule);
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