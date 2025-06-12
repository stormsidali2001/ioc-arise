import { ClassInfo, ConstructorParameter } from '../../types';
import { toVariableName } from '../../utils/naming';

export class DependencyResolver {
  private classes: ClassInfo[];

  constructor(classes: ClassInfo[]) {
    this.classes = classes;
  }

  createInterfaceToClassMap(): Map<string, string> {
    const interfaceToClassMap = new Map<string, string>();
    for (const classInfo of this.classes) {
      if (classInfo.interfaceName) {
        interfaceToClassMap.set(classInfo.interfaceName, classInfo.name);
      }
    }
    return interfaceToClassMap;
  }

  resolveDependencies(
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
            return `${toVariableName(implementingClass)}Factory()`;
          }
          return toVariableName(implementingClass);
        }
        // Check if dependency is a class name
        if (classMap.has(dep)) {
          const depClassInfo = classMap.get(dep);
          if (depClassInfo && depClassInfo.scope === 'transient') {
            return `${toVariableName(dep)}Factory()`;
          }
          return toVariableName(dep);
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

  getDefaultValueForType(type: string, isOptional: boolean): string {
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
          return toVariableName(type);
        }
        // For unmanaged class types, create a simple instance
        return `new ${type}()`;
    }
  }
}