import { ClassInfo } from '../../types';

/**
 * Shared utility class for instantiation-related functionality used by both
 * flat and modular container generators.
 */
export class InstantiationUtils {
  /**
   * Converts a string to camelCase (first letter lowercase).
   */
  static toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Generates factory functions for transient classes.
   */
  static generateTransientFactory(classInfo: ClassInfo, constructorArgs?: string): string {
    const instanceName = this.toCamelCase(classInfo.name);
    const factoryName = `${instanceName}Factory`;
    
    return constructorArgs
      ? `const ${factoryName} = (): ${classInfo.name} => new ${classInfo.name}(${constructorArgs});`
      : `const ${factoryName} = (): ${classInfo.name} => new ${classInfo.name}();`;
  }

  /**
   * Generates a singleton variable declaration.
   */
  static generateSingletonVariable(classInfo: ClassInfo): string {
    const instanceName = this.toCamelCase(classInfo.name);
    return `let ${instanceName}: ${classInfo.name} | undefined;`;
  }

  /**
   * Generates a singleton getter function.
   */
  static generateSingletonGetter(classInfo: ClassInfo, constructorArgs?: string): string {
    const instanceName = this.toCamelCase(classInfo.name);
    const getterName = `get${classInfo.name}`;
    
    const instantiation = constructorArgs
      ? `new ${classInfo.name}(${constructorArgs})`
      : `new ${classInfo.name}()`;
    
    return `const ${getterName} = (): ${classInfo.name} => {
  if (!${instanceName}) {
    ${instanceName} = ${instantiation};
  }
  return ${instanceName};
};`;
  }

  /**
   * Filters classes by scope.
   */
  static filterClassesByScope(classes: ClassInfo[]): { singletonClasses: ClassInfo[], transientClasses: ClassInfo[] } {
    return {
      singletonClasses: classes.filter(c => c.scope === 'singleton'),
      transientClasses: classes.filter(c => c.scope === 'transient')
    };
  }

  /**
   * Creates a managed dependency call based on class scope.
   */
  static createManagedDependencyCall(classInfo: ClassInfo, implementingClass: string): string {
    if (classInfo.scope === 'transient') {
      return `${this.toCamelCase(implementingClass)}Factory()`;
    }
    return `get${implementingClass}()`;
  }
}