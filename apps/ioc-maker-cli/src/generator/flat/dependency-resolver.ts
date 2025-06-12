import { ClassInfo, ConstructorParameter } from '../../types';
import { InstantiationUtils, DependencyResolverUtils } from '../shared';

export class DependencyResolver {
  private classes: ClassInfo[];

  constructor(classes: ClassInfo[]) {
    this.classes = classes;
  }

  createInterfaceToClassMap(): Map<string, string> {
    return DependencyResolverUtils.createInterfaceToClassMap(this.classes);
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
            return `${InstantiationUtils.toCamelCase(implementingClass)}Factory()`;
          }
          return InstantiationUtils.toCamelCase(implementingClass);
        }
        // Check if dependency is a class name
        if (classMap.has(dep)) {
          const depClassInfo = classMap.get(dep);
          if (depClassInfo && depClassInfo.scope === 'transient') {
            return `${InstantiationUtils.toCamelCase(dep)}Factory()`;
          }
          return InstantiationUtils.toCamelCase(dep);
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
    return DependencyResolverUtils.createUnmanagedDependencyInstance(className, classInfo);
  }

  private generateConstructorArgs(params: ConstructorParameter[]): string {
    return DependencyResolverUtils.generateConstructorArgs(params);
  }

  getDefaultValueForType(type: string, isOptional: boolean): string {
    // For class types, try to find if it's a managed dependency
    const classMap = new Map(this.classes.map(c => [c.name, c]));
    if (classMap.has(type)) {
      return InstantiationUtils.toCamelCase(type);
    }
    
    return DependencyResolverUtils.getDefaultValueForType(type, isOptional);
  }
}