import { ClassInfo, ConstructorParameter, InjectionScope } from './types';

export class CodeGenerator {
  private classes: ClassInfo[];

  constructor(classes: ClassInfo[]) {
    this.classes = classes;
  }

  generateImports(): string {
    const importSet = new Set<string>();
    const classMap = new Map(this.classes.map(c => [c.name, c]));
    
    // Add imports for all managed classes
    for (const classInfo of this.classes) {
      importSet.add(`import { ${classInfo.name} } from '${classInfo.importPath}';`);
    }
    
    // Add imports for unmanaged dependencies
    for (const classInfo of this.classes) {
      for (const dep of classInfo.dependencies) {
        // If dependency is not a managed class, we need to import it
        if (!classMap.has(dep)) {
          // Check if it's an interface (starts with 'I' by convention)
          if (!dep.startsWith('I')) {
            importSet.add(`import { ${dep} } from '${classInfo.importPath}';`);
          }
        }
      }
    }

    return Array.from(importSet).join('\n');
  }

  generateInstantiations(sortedClasses: string[]): string {
    const classMap = new Map(this.classes.map(c => [c.name, c]));
    const instantiations: string[] = [];
    const transientFactories: string[] = [];

    // Create interface to class mapping for dependency resolution
    const interfaceToClassMap = new Map<string, string>();
    for (const classInfo of this.classes) {
      if (classInfo.interfaceName) {
        interfaceToClassMap.set(classInfo.interfaceName, classInfo.name);
      }
    }

    // Separate singletons and transients
    const singletonClasses = this.classes.filter(c => c.scope === 'singleton');
    const transientClasses = this.classes.filter(c => c.scope === 'transient');

    // Generate singleton instantiations (eager loading)
    const singletonClassNames = sortedClasses.filter(name => {
      return singletonClasses.some(c => c.name === name);
    });

    for (const className of singletonClassNames.reverse()) {
      const classInfo = classMap.get(className);
      if (!classInfo) continue;

      const variableName = this.toVariableName(className);
      const dependencies = this.resolveDependencies(classInfo, interfaceToClassMap, classMap);

      const instantiation = dependencies
        ? `const ${variableName} = new ${className}(${dependencies});`
        : `const ${variableName} = new ${className}();`;

      instantiations.push(instantiation);
    }

    // Generate transient factory functions (lazy loading)
    for (const classInfo of transientClasses) {
      const className = classInfo.name;
      const variableName = this.toVariableName(className);
      const dependencies = this.resolveDependencies(classInfo, interfaceToClassMap, classMap);

      const factory = dependencies
        ? `  ['${variableName}', () => new ${className}(${dependencies})]`
        : `  ['${variableName}', () => new ${className}()]`;

      transientFactories.push(factory);
    }

    const result = [];
    
    // First declare transient factories if needed
    if (transientFactories.length > 0) {
      result.push('// Lazy loading setup for transient dependencies');
      
      // Create individual typed factory functions
      for (const classInfo of transientClasses) {
        const variableName = this.toVariableName(classInfo.name);
        const className = classInfo.name;
        const dependencies = this.resolveDependencies(classInfo, interfaceToClassMap, classMap);
        
        const factoryFunction = dependencies
          ? `const ${variableName}Factory = (): ${className} => new ${className}(${dependencies});`
          : `const ${variableName}Factory = (): ${className} => new ${className}();`;
        
        result.push(factoryFunction);
      }
      result.push('');
    }
    
    // Then do singleton instantiations
    if (instantiations.length > 0) {
      result.push('// Eager singleton instantiation');
      result.push(...instantiations);
    }

    return result.join('\n');
  }

  generateContainerObject(): string {
    const singletonProperties: string[] = [];
    const transientProperties: string[] = [];

    for (const classInfo of this.classes) {
      const variableName = this.toVariableName(classInfo.name);
      const interfaceName = classInfo.interfaceName || classInfo.name;
      
      if (classInfo.scope === 'singleton') {
        singletonProperties.push(`  ${interfaceName}: ${variableName},`);
      } else if (classInfo.scope === 'transient') {
        transientProperties.push(`  get ${interfaceName}(): ${classInfo.name} {
    return ${variableName}Factory();
  },`);
      }
    }

    const allProperties = [...singletonProperties, ...transientProperties];
    return `export const container = {\n${allProperties.join('\n')}\n};`;
  }

  generateTypeExport(): string {
    return 'export type Container = typeof container;';
  }

  private toVariableName(className: string): string {
    // Convert PascalCase to camelCase
    return className.charAt(0).toLowerCase() + className.slice(1);
  }

  private resolveDependencies(
    classInfo: ClassInfo,
    interfaceToClassMap: Map<string, string>,
    classMap: Map<string, ClassInfo>
  ): string {
    return classInfo.dependencies
      .map(dep => {
        // Check if dependency is an interface name
        const implementingClass = interfaceToClassMap.get(dep);
        if (implementingClass) {
          const depClassInfo = classMap.get(implementingClass);
          if (depClassInfo && depClassInfo.scope === 'transient') {
            // For transient dependencies, use factory call
            return `${this.toVariableName(implementingClass)}Factory()`;
          }
          return this.toVariableName(implementingClass);
        }
        // Check if dependency is a class name
        if (classMap.has(dep)) {
          const depClassInfo = classMap.get(dep);
          if (depClassInfo && depClassInfo.scope === 'transient') {
            return `${this.toVariableName(dep)}Factory()`;
          }
          return this.toVariableName(dep);
        }
        // Check if dependency is a class that exists in the same file but not managed
        return this.createUnmanagedDependencyInstance(dep);
      })
      .filter(dep => dep !== null)
      .join(', ');
  }

  private createUnmanagedDependencyInstance(className: string): string {
    // Find the class info for this unmanaged dependency
    const classInfo = this.classes.find(c => c.name === className);
    if (!classInfo || !classInfo.constructorParams.length) {
      return `new ${className}()`;
    }
    
    const args = this.generateConstructorArgs(classInfo.constructorParams);
    return `new ${className}(${args})`;
  }

  private generateConstructorArgs(params: ConstructorParameter[]): string {
    return params.map(param => this.getDefaultValueForType(param.type, param.isOptional)).join(', ');
  }

  private getDefaultValueForType(type: string, isOptional: boolean): string {
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
        // For class types, try to find if it's a managed dependency
        const classMap = new Map(this.classes.map(c => [c.name, c]));
        if (classMap.has(type)) {
          return this.toVariableName(type);
        }
        // For unmanaged class types, create a simple instance
        return `new ${type}()`;
    }
  }
}