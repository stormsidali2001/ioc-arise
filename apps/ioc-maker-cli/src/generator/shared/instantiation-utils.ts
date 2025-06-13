import { ClassInfo, ConstructorParameter } from '../../types';
import { TopologicalSorter } from '../../utils/topological-sorter';

/**
 * Shared utility class for instantiation-related functionality used by both
 * flat and modular container generators.
 */
export class InstantiationUtils {
  // ========== Core String Utilities ==========
  
  /**
   * Converts a string to camelCase (first letter lowercase).
   */
  static toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Generates a factory function name from a class name.
   */
  static generateFactoryName(className: string): string {
    return `${this.toCamelCase(className)}Factory`;
  }

  /**
   * Generates a getter function name from a class name.
   */
  static generateGetterName(className: string): string {
    return `get${className}`;
  }

  /**
   * Generates an instance variable name from a class name.
   */
  static generateInstanceName(className: string): string {
    return this.toCamelCase(className);
  }

  /**
   * Gets the interface name or falls back to class name.
   */
  static getInterfaceOrClassName(classInfo: ClassInfo): string {
    return classInfo.interfaceName || classInfo.name;
  }

  // ========== Dependency Resolution Utilities ==========

  /**
   * Creates a map of interface names to their implementing class names.
   */
  static createInterfaceToClassMap(classes: ClassInfo[]): Map<string, string> {
    const interfaceToClassMap = new Map<string, string>();
    for (const classInfo of classes) {
      if (classInfo.interfaceName) {
        interfaceToClassMap.set(classInfo.interfaceName, classInfo.name);
      }
    }
    return interfaceToClassMap;
  }

  /**
   * Gets default value for a type when no implementation is found.
   */
  static getDefaultValueForType(type: string, isOptional: boolean): string {
    if (isOptional) {
      return 'undefined';
    }
    
    // Handle primitive types
    switch (type.toLowerCase()) {
      case 'string':
        return '"default"';
      case 'number':
        return '0';
      case 'boolean':
        return 'false';
      case 'date':
        return 'new Date()';
      default:
        // For class types, create a simple instance
        return `new ${type}()`;
    }
  }

  /**
   * Generates constructor arguments for unmanaged dependencies.
   */
  static generateConstructorArgs(params: ConstructorParameter[]): string {
    return params.map(param => this.getDefaultValueForType(param.type, param.isOptional)).join(', ');
  }

  /**
   * Creates an instance of an unmanaged dependency.
   */
  static createUnmanagedDependencyInstance(className: string, classInfo?: ClassInfo): string {
    if (!classInfo || !classInfo.constructorParams.length) {
      return `new ${className}()`;
    }
    
    const args = this.generateConstructorArgs(classInfo.constructorParams);
    return `new ${className}(${args})`;
  }

  /**
   * Finds a class by its interface name in a collection of classes.
   */
  static findClassByInterface(interfaceName: string, classes: ClassInfo[]): ClassInfo | undefined {
    return classes.find(c => c.interfaceName === interfaceName);
  }

  /**
   * Creates a dependency call for managed dependencies based on scope.
   */
  static createDependencyCall(className: string, scope: string): string {
    if (scope === 'transient') {
      return `${this.toCamelCase(className)}Factory()`;
    }
    return this.toCamelCase(className);
  }

  // ========== Code Generation Utilities ==========

  /**
   * Applies indentation to a string, handling multi-line content.
   */
  static applyIndentation(content: string, indentation: string): string {
    return indentation ? 
      `${indentation}${content.replace(/\n/g, `\n${indentation}`)}` : 
      content;
  }

  /**
   * Generates a constructor instantiation expression.
   */
  static generateConstructorCall(className: string, constructorArgs?: string): string {
    return constructorArgs
      ? `new ${className}(${constructorArgs})`
      : `new ${className}()`;
  }

  /**
   * Generates a function call expression with optional arguments.
   */
  static generateFunctionCall(functionName: string, args?: string[]): string {
    const argsStr = args && args.length > 0 ? args.join(', ') : '';
    return `${functionName}(${argsStr})`;
  }

  /**
   * Generates a getter property with return statement.
   */
  static generateGetterProperty(propertyName: string, returnType: string, returnExpression: string, indentation: string = '  '): string {
    return `${indentation}get ${propertyName}(): ${returnType} {\n${indentation}  return ${returnExpression};\n${indentation}}`;
  }

  /**
   * Helper method to generate object exports with consistent formatting.
   */
  private static generateObjectExport(objectName: string, properties: string[], separator: string = ''): string {
    const joinSeparator = separator || '\n';
    return `export const ${objectName} = {\n${properties.join(joinSeparator)}\n};`;
  }

  /**
   * Helper method to generate a container property with consistent formatting.
   */
  private static generateContainerProperty(propertyName: string, returnType: string, returnExpression: string): string {
    return `  get ${propertyName}(): ${returnType} {\n    return ${returnExpression};\n  },`;
  }

  /**
   * Generic helper for generating code sections with consistent indentation handling.
   */
  private static generateCodeSection<T>(
    items: T[], 
    generator: (item: T) => string, 
    indentation: string = '',
    isMultiline: boolean = false
  ): string[] {
    const results: string[] = [];
    
    for (const item of items) {
      const code = generator(item);
      const indentedCode = isMultiline ? 
        this.applyIndentation(code, indentation) : 
        `${indentation}${code}`;
      results.push(indentedCode);
    }
    
    return results;
  }

  // ========== Class Filtering and Sorting Utilities ==========

  /**
   * Filters classes to get only singletons.
   */
  static getSingletonClasses(classes: ClassInfo[]): ClassInfo[] {
    return classes.filter(c => c.scope !== 'transient');
  }

  /**
   * Filters classes to get only transients.
   */
  static getTransientClasses(classes: ClassInfo[]): ClassInfo[] {
    return classes.filter(c => c.scope === 'transient');
  }

  /**
   * Checks if a class is transient.
   */
  static isTransient(classInfo: ClassInfo): boolean {
    return classInfo.scope === 'transient';
  }

  /**
   * Checks if a class is singleton.
   */
  static isSingleton(classInfo: ClassInfo): boolean {
    return classInfo.scope === 'singleton';
  }

  // ========== Core Code Generation Methods ==========

  /**
   * Generates factory functions for transient classes.
   */
  static generateTransientFactory(classInfo: ClassInfo, constructorArgs?: string): string {
    const factoryName = this.generateFactoryName(classInfo.name);
    const constructorCall = this.generateConstructorCall(classInfo.name, constructorArgs);
    
    return `const ${factoryName} = (): ${classInfo.name} => ${constructorCall};`;
  }

  /**
   * Generates a singleton variable declaration.
   */
  static generateSingletonVariable(classInfo: ClassInfo): string {
    const instanceName = this.generateInstanceName(classInfo.name);
    return `let ${instanceName}: ${classInfo.name} | undefined;`;
  }

  /**
   * Generates a singleton getter function.
   */
  static generateSingletonGetter(classInfo: ClassInfo, constructorArgs?: string): string {
    const instanceName = this.generateInstanceName(classInfo.name);
    const getterName = this.generateGetterName(classInfo.name);
    const instantiation = this.generateConstructorCall(classInfo.name, constructorArgs);
    
    return `const ${getterName} = (): ${classInfo.name} => {\n  if (!${instanceName}) {\n    ${instanceName} = ${instantiation};\n  }\n  return ${instanceName};\n};`;
  }

  /**
   * Filters classes by scope.
   */
  static filterClassesByScope(classes: ClassInfo[]): { singletonClasses: ClassInfo[], transientClasses: ClassInfo[] } {
    return {
      singletonClasses: this.getSingletonClasses(classes),
      transientClasses: this.getTransientClasses(classes)
    };
  }

  /**
   * Creates a managed dependency call based on class scope.
   */
  static createManagedDependencyCall(classInfo: ClassInfo, implementingClass: string): string {
    if (this.isTransient(classInfo)) {
      const factoryName = this.generateFactoryName(implementingClass);
      return this.generateFunctionCall(factoryName);
    }
    const getterName = this.generateGetterName(implementingClass);
    return this.generateFunctionCall(getterName);
  }

  /**
   * Creates a function signature with parameters.
   */
  static createFunctionSignature(functionName: string, params: string[]): string {
    return params.length > 0 ? 
      `function ${functionName}(${params.join(', ')})` :
      `function ${functionName}()`;
  }

  /**
   * Creates a module export getter.
   */
  static createModuleExportGetter(classInfo: ClassInfo): string {
    const interfaceName = this.getInterfaceOrClassName(classInfo);
    
    if (this.isTransient(classInfo)) {
      const factoryCall = this.generateFunctionCall(this.generateFactoryName(classInfo.name));
      return this.generateGetterProperty(interfaceName, classInfo.name, factoryCall, '    ');
    } else {
      const getterCall = this.generateFunctionCall(this.generateGetterName(classInfo.name));
      return this.generateGetterProperty(interfaceName, classInfo.name, getterCall, '    ');
    }
  }

  /**
   * Sorts classes by their dependencies using topological sorting.
   */
  static sortClassesByDependencies(classes: ClassInfo[], allModuleClasses: ClassInfo[]): ClassInfo[] {
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
   * Resolves a basic dependency by finding the implementing class and creating the appropriate call.
   * This is the common pattern used by both flat and modular generators.
   */
  static resolveBasicDependency(
    dependency: string, 
    availableClasses: ClassInfo[], 
    interfaceToClassMap?: Map<string, string>
  ): string | null {
    // Try to find by interface name first
    const depClass = availableClasses.find(c => c.interfaceName === dependency);
    if (depClass) {
      return this.createManagedDependencyCall(depClass, depClass.name);
    }

    // Try to find by direct class name match
    const directClassMatch = availableClasses.find(c => c.name === dependency);
    if (directClassMatch) {
      return this.createManagedDependencyCall(directClassMatch, directClassMatch.name);
    }

    // Try to find by class name using interface map
    if (interfaceToClassMap) {
      const implementingClass = interfaceToClassMap.get(dependency);
      if (implementingClass) {
        const depClassInfo = availableClasses.find(c => c.name === implementingClass);
        if (depClassInfo) {
          return this.createManagedDependencyCall(depClassInfo, implementingClass);
        }
      }
    }

    return null;
  }

  /**
   * Generates constructor arguments string from an array of argument strings.
   * Common pattern used by both generators.
   */
  static joinConstructorArguments(args: string[]): string {
    return args.length > 0 ? args.join(', ') : '';
  }

  /**
   * Generates a section of transient factory functions with optional indentation.
   * Used by both flat and modular generators.
   */
  static generateTransientFactoriesSection(
    classes: ClassInfo[], 
    constructorArgsResolver: (classInfo: ClassInfo) => string,
    indentation: string = ''
  ): string[] {
    const transientClasses = this.getTransientClasses(classes);
    
    return this.generateCodeSection(transientClasses, 
      (classInfo) => {
        const constructorArgs = constructorArgsResolver(classInfo);
        return this.generateTransientFactory(classInfo, constructorArgs);
      }, 
      indentation
    );
  }

  /**
   * Generates a section of singleton variable declarations with optional indentation.
   * Used by both flat and modular generators.
   */
  static generateSingletonVariablesSection(
    classes: ClassInfo[], 
    indentation: string = ''
  ): string[] {
    const singletonClasses = this.getSingletonClasses(classes);
    const sortedSingletons = this.sortClassesByDependencies(singletonClasses, classes);
    
    return this.generateCodeSection(sortedSingletons, 
      (classInfo) => this.generateSingletonVariable(classInfo), 
      indentation
    );
  }

  /**
   * Generates a section of singleton getter functions with optional indentation.
   * Used by both flat and modular generators.
   */
  static generateSingletonGettersSection(
    classes: ClassInfo[], 
    constructorArgsResolver: (classInfo: ClassInfo) => string,
    indentation: string = ''
  ): string[] {
    const singletonClasses = this.getSingletonClasses(classes);
    const sortedSingletons = this.sortClassesByDependencies(singletonClasses, classes);
    
    return this.generateCodeSection(sortedSingletons, 
      (classInfo) => {
        const constructorArgs = constructorArgsResolver(classInfo);
        return this.generateSingletonGetter(classInfo, constructorArgs);
      }, 
      indentation,
      true // multiline content
    );
  }

  /**
   * Generates a section of module exports with optional indentation.
   * Used by modular generators.
   */
  static generateModuleExportsSection(
    classes: ClassInfo[], 
    indentation: string = ''
  ): string[] {
    const classesWithInterface = classes.filter(c => c.interfaceName);
    
    return this.generateCodeSection(classesWithInterface, 
      (classInfo) => this.createModuleExportGetter(classInfo), 
      indentation,
      true // multiline content
    );
  }

  /**
   * Generates a container property getter for singleton classes.
   * Used by flat container generators.
   */
  static generateSingletonContainerProperty(classInfo: ClassInfo): string {
    const interfaceName = this.getInterfaceOrClassName(classInfo);
    const getterCall = this.generateFunctionCall(this.generateGetterName(classInfo.name));
    
    return this.generateContainerProperty(interfaceName, classInfo.name, getterCall);
  }

  /**
   * Generates a container property getter for transient classes.
   * Used by flat container generators.
   */
  static generateTransientContainerProperty(classInfo: ClassInfo): string {
    const interfaceName = this.getInterfaceOrClassName(classInfo);
    const factoryCall = this.generateFunctionCall(this.generateFactoryName(classInfo.name));
    
    return this.generateContainerProperty(interfaceName, classInfo.name, factoryCall);
  }

  /**
   * Generates the complete container object with all properties.
   * Used by flat container generators.
   */
  static generateContainerObject(classes: ClassInfo[]): string {
    const properties: string[] = [];
    
    for (const classInfo of classes) {
      if (this.isSingleton(classInfo)) {
        properties.push(this.generateSingletonContainerProperty(classInfo));
      } else if (this.isTransient(classInfo)) {
        properties.push(this.generateTransientContainerProperty(classInfo));
      }
    }
    
    return this.generateObjectExport('container', properties);
  }

  /**
   * Generates the container type export.
   * Used by flat container generators.
   */
  static generateContainerTypeExport(): string {
    return 'export type Container = typeof container;';
  }

  /**
   * Generates a module function parameter with proper typing.
   * Used by modular generators for creating function parameters.
   */
  static generateModuleFunctionParameter(moduleName: string): string {
    const depVarName = this.toCamelCase(moduleName) + 'Container';
    return `${depVarName}: ReturnType<typeof create${moduleName}Container>`;
  }

  /**
   * Generates function parameters for module dependencies.
   * Used by modular generators.
   */
  static generateModuleFunctionParameters(moduleDeps: Set<string>): string[] {
    return Array.from(moduleDeps).map(depModule => 
      this.generateModuleFunctionParameter(depModule)
    );
  }

  /**
   * Generates a module container variable name.
   * Used by modular generators.
   */
  static generateModuleContainerVariableName(moduleName: string): string {
    return this.toCamelCase(moduleName) + 'Container';
  }

  /**
   * Generates a module container function name.
   * Used by modular generators.
   */
  static generateModuleContainerFunctionName(moduleName: string): string {
    return `create${moduleName}Container`;
  }

  /**
   * Generates function arguments for module dependencies.
   * Used by modular generators.
   */
  static generateModuleFunctionArguments(moduleDeps: Set<string>): string[] {
    return Array.from(moduleDeps).map(depModule => 
      this.generateModuleContainerVariableName(depModule)
    );
  }

  /**
   * Generates module instantiation code.
   * Used by modular generators.
   */
  static generateModuleInstantiation(moduleName: string, moduleDependencies: Map<string, Set<string>>): string {
    const moduleVarName = this.generateModuleContainerVariableName(moduleName);
    const moduleFunctionName = this.generateModuleContainerFunctionName(moduleName);
    const moduleDeps = moduleDependencies.get(moduleName) || new Set();
    
    const functionArgs = this.generateModuleFunctionArguments(moduleDeps);
    const functionCall = this.generateFunctionCall(moduleFunctionName, functionArgs);
    
    return `const ${moduleVarName} = ${functionCall};`;
  }

  /**
   * Generates a module export entry for the aggregated container.
   * Used by container aggregators.
   */
  static generateModuleExportEntry(moduleName: string): string {
    const moduleVarName = this.generateModuleContainerVariableName(moduleName);
    const moduleKey = this.generateInstanceName(moduleName);
    return `  ${moduleKey}: ${moduleVarName}`;
  }

  /**
   * Generates the aggregated container code for modular architecture.
   * Used by container aggregators.
   */
  static generateAggregatedContainer(sortedModules: string[]): string {
    const moduleExports = sortedModules.map(moduleName => 
      this.generateModuleExportEntry(moduleName)
    );
    
    return this.generateObjectExport('container', moduleExports, ',');
  }

  /**
   * Generates the modular container type export.
   * Used by container aggregators.
   */
  static generateModularContainerTypeExport(): string {
    return 'export type Container = typeof container;';
  }

  /**
   * Generates a module function return object.
   * Used by module function body generators.
   */
  static generateModuleFunctionReturnObject(moduleExports: string[]): string {
    return moduleExports.length > 0 ? 
      `  return {\n${moduleExports.join(',\n')}\n  };` :
      '  return {};';
  }

  /**
   * Generates the complete module function body.
   * Used by module function body generators.
   */
  static generateModuleFunctionBody(
    moduleClasses: ClassInfo[], 
    constructorArgsResolver: (classInfo: ClassInfo) => string
  ): string {
    const factoryFunctions = this.generateTransientFactoriesSection(moduleClasses, constructorArgsResolver, '  ');
    const lazyInitializations = this.generateSingletonVariablesSection(moduleClasses, '  ');
    const lazyGetters = this.generateSingletonGettersSection(moduleClasses, constructorArgsResolver, '  ');
    const moduleExports = this.generateModuleExportsSection(moduleClasses, '    ');
    
    const returnObject = this.generateModuleFunctionReturnObject(moduleExports);
    
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
}