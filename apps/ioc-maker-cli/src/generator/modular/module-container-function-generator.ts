import { ClassInfo } from '../../types';
import { TopologicalSorter } from '../../utils/topological-sorter';

/**
 * Responsible for generating module container functions.
 * Handles the creation of container functions for each module.
 */
export class ModuleContainerFunctionGenerator {
  private moduleGroupedClasses: Map<string, ClassInfo[]>;

  constructor(moduleGroupedClasses: Map<string, ClassInfo[]>) {
    this.moduleGroupedClasses = moduleGroupedClasses;
  }

  /**
   * Generates container functions for all modules.
   */
  generateModuleContainerFunctions(sortedModules: string[], moduleDependencies: Map<string, Set<string>>): string[] {
    const moduleContainerFunctions: string[] = [];
    
    for (const moduleName of sortedModules) {
      const moduleClasses = this.moduleGroupedClasses.get(moduleName);
      if (!moduleClasses) continue;
      
      const moduleContainerFunction = this.createModuleContainerFunction(moduleName, moduleClasses, moduleDependencies);
      moduleContainerFunctions.push(moduleContainerFunction);
    }
    
    return moduleContainerFunctions;
  }

  /**
   * Creates a container function for a specific module.
   */
  private createModuleContainerFunction(moduleName: string, moduleClasses: ClassInfo[], moduleDependencies: Map<string, Set<string>>): string {
    const moduleFunctionName = `create${moduleName}Container`;
    const moduleDeps = moduleDependencies.get(moduleName) || new Set();
    
    const functionParams = this.generateFunctionParameters(moduleDeps);
    const functionSignature = this.createFunctionSignature(moduleFunctionName, functionParams);
    const functionBody = this.generateModuleFunctionBody(moduleClasses, moduleDeps);
    
    return `${functionSignature} {\n${functionBody}\n}`;
  }

  /**
   * Generates function parameters for module dependencies.
   */
  private generateFunctionParameters(moduleDeps: Set<string>): string[] {
    const functionParams: string[] = [];
    
    for (const depModule of moduleDeps) {
      const depVarName = this.camelCase(depModule) + 'Container';
      functionParams.push(`${depVarName}: ReturnType<typeof create${depModule}Container>`);
    }
    
    return functionParams;
  }

  /**
   * Creates a function signature with parameters.
   */
  private createFunctionSignature(functionName: string, params: string[]): string {
    return params.length > 0 ? 
      `function ${functionName}(${params.join(', ')})` :
      `function ${functionName}()`;
  }

  /**
   * Generates the function body for a module container.
   */
  private generateModuleFunctionBody(moduleClasses: ClassInfo[], moduleDeps: Set<string>): string {
    const factoryFunctions = this.generateTransientFactories(moduleClasses);
    const lazyInitializations = this.generateSingletonVariables(moduleClasses);
    const lazyGetters = this.generateSingletonGetters(moduleClasses, moduleDeps);
    const moduleExports = this.generateModuleExports(moduleClasses);
    
    const returnObject = moduleExports.length > 0 ? 
      `  return {\n${moduleExports.join(',\n')}\n  };` :
      '  return {};';
    
    return [
      ...factoryFunctions,
      '',
      ...lazyInitializations,
      '',
      ...lazyGetters,
      '',
      returnObject
    ].filter(line => line !== '' || factoryFunctions.length > 0 || lazyInitializations.length > 0 || lazyGetters.length > 0).join('\n');
  }

  /**
   * Generates factory functions for transient classes.
   */
  private generateTransientFactories(moduleClasses: ClassInfo[]): string[] {
    const factoryFunctions: string[] = [];
    
    for (const classInfo of moduleClasses) {
      if (classInfo.scope === 'transient') {
        const instanceName = this.camelCase(classInfo.name);
        const factoryName = `${instanceName}Factory`;
        factoryFunctions.push(`  const ${factoryName} = (): ${classInfo.name} => new ${classInfo.name}();`);
      }
    }
    
    return factoryFunctions;
  }

  /**
   * Generates singleton variable declarations.
   */
  private generateSingletonVariables(moduleClasses: ClassInfo[]): string[] {
    const singletonClasses = moduleClasses.filter(c => c.scope !== 'transient');
    const sortedSingletons = this.sortClassesByDependencies(singletonClasses, moduleClasses);
    const lazyInitializations: string[] = [];
    
    for (const classInfo of sortedSingletons) {
      const instanceName = this.camelCase(classInfo.name);
      lazyInitializations.push(`  let ${instanceName}: ${classInfo.name} | undefined;`);
    }
    
    return lazyInitializations;
  }

  /**
   * Generates getter functions for singleton classes.
   */
  private generateSingletonGetters(moduleClasses: ClassInfo[], moduleDeps: Set<string>): string[] {
    const singletonClasses = moduleClasses.filter(c => c.scope !== 'transient');
    const sortedSingletons = this.sortClassesByDependencies(singletonClasses, moduleClasses);
    const lazyGetters: string[] = [];
    
    for (const classInfo of sortedSingletons) {
      const lazyGetter = this.createSingletonGetter(classInfo, moduleClasses, moduleDeps);
      lazyGetters.push(lazyGetter);
    }
    
    return lazyGetters;
  }

  /**
   * Creates a getter function for a singleton class.
   */
  private createSingletonGetter(classInfo: ClassInfo, moduleClasses: ClassInfo[], moduleDeps: Set<string>): string {
    const instanceName = this.camelCase(classInfo.name);
    const getterName = `get${classInfo.name}`;
    const constructorArgs = this.buildConstructorArguments(classInfo, moduleClasses, moduleDeps);
    
    const instantiation = constructorArgs.length > 0 ?
      `new ${classInfo.name}(${constructorArgs.join(', ')})` :
      `new ${classInfo.name}()`;
    
    return `  const ${getterName} = (): ${classInfo.name} => {\n    if (!${instanceName}) {\n      ${instanceName} = ${instantiation};\n    }\n    return ${instanceName};\n  };`;
  }

  /**
   * Builds constructor arguments for a class.
   */
  private buildConstructorArguments(classInfo: ClassInfo, moduleClasses: ClassInfo[], moduleDeps: Set<string>): string[] {
    const constructorArgs: string[] = [];
    
    for (const dep of classInfo.dependencies) {
      const arg = this.resolveDependencyArgument(dep, moduleClasses, moduleDeps);
      if (arg) {
        constructorArgs.push(arg);
      }
    }
    
    return constructorArgs;
  }

  /**
   * Resolves a dependency argument.
   */
  private resolveDependencyArgument(dependency: string, moduleClasses: ClassInfo[], moduleDeps: Set<string>): string | null {
    // Check if dependency is from another module
    const externalModuleArg = this.findExternalModuleDependency(dependency, moduleDeps);
    if (externalModuleArg) {
      return externalModuleArg;
    }
    
    // Check if dependency is from the same module
    return this.findInternalModuleDependency(dependency, moduleClasses);
  }

  /**
   * Finds a dependency from an external module.
   */
  private findExternalModuleDependency(dependency: string, moduleDeps: Set<string>): string | null {
    for (const depModule of moduleDeps) {
      const depModuleClasses = this.moduleGroupedClasses.get(depModule);
      if (depModuleClasses) {
        const depClass = depModuleClasses.find(c => c.interfaceName === dependency);
        if (depClass) {
          const depModuleVarName = this.camelCase(depModule) + 'Container';
          return `${depModuleVarName}.${dependency}`;
        }
      }
    }
    return null;
  }

  /**
   * Finds a dependency from the same module.
   */
  private findInternalModuleDependency(dependency: string, moduleClasses: ClassInfo[]): string | null {
    const depClass = moduleClasses.find(c => c.interfaceName === dependency);
    if (depClass) {
      if (depClass.scope === 'transient') {
        const depInstanceName = this.camelCase(depClass.name);
        return `${depInstanceName}Factory()`;
      } else {
        const depGetterName = `get${depClass.name}`;
        return `${depGetterName}()`;
      }
    }
    return null;
  }

  /**
   * Generates module exports.
   */
  private generateModuleExports(moduleClasses: ClassInfo[]): string[] {
    const moduleExports: string[] = [];
    
    for (const classInfo of moduleClasses) {
      if (classInfo.interfaceName) {
        const exportGetter = this.createModuleExportGetter(classInfo);
        moduleExports.push(exportGetter);
      }
    }
    
    return moduleExports;
  }

  /**
   * Creates a module export getter.
   */
  private createModuleExportGetter(classInfo: ClassInfo): string {
    const instanceName = this.camelCase(classInfo.name);
    const isTransient = classInfo.scope === 'transient';
    
    if (isTransient) {
      return `    get ${classInfo.interfaceName}(): ${classInfo.name} {\n      return ${instanceName}Factory();\n    }`;
    } else {
      const getterName = `get${classInfo.name}`;
      return `    get ${classInfo.interfaceName}(): ${classInfo.name} {\n      return ${getterName}();\n    }`;
    }
  }

  /**
   * Sorts classes by their dependencies.
   */
  private sortClassesByDependencies(classes: ClassInfo[], allModuleClasses: ClassInfo[]): ClassInfo[] {
    // Build dependency graph for classes within the module
    const dependencyGraph = new Map<string, string[]>();
    
    for (const classInfo of classes) {
      const dependencies: string[] = [];
      
      // Only include dependencies that are within the same module and are singletons
      for (const dep of classInfo.dependencies) {
        const depClass = allModuleClasses.find(c => c.interfaceName === dep && c.scope !== 'transient');
        if (depClass && classes.includes(depClass)) {
          dependencies.push(depClass.name);
        }
      }
      
      dependencyGraph.set(classInfo.name, dependencies);
    }
    
    // Use TopologicalSorter to sort the classes
    const sortResult = TopologicalSorter.sort(dependencyGraph);
    
    // Map sorted class names back to ClassInfo objects
    const classMap = new Map(classes.map(c => [c.name, c]));
    return sortResult.sorted.map(className => classMap.get(className)!).filter(Boolean);
  }

  /**
   * Utility method to convert strings to camelCase.
   */
  private camelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1).replace(/[^a-zA-Z0-9]/g, '');
  }
}