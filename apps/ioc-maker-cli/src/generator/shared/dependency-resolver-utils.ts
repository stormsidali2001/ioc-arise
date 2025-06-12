import { ClassInfo, ConstructorParameter } from '../../types';
import { InstantiationUtils } from './instantiation-utils';

/**
 * Shared utility class for dependency resolution functionality used by both
 * flat and modular container generators.
 */
export class DependencyResolverUtils {
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
}