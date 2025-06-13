import { ClassInfo } from '../types';

export class ImportGenerator {
  private classes: ClassInfo[];
  private aliasMap: Map<string, string> = new Map();

  constructor(classes: ClassInfo[]) {
    this.classes = classes;
    this.generateAliases();
  }

  /**
   * Detects name collisions and generates unique aliases for colliding class names.
   */
  private generateAliases(): void {
    const nameToClasses = new Map<string, ClassInfo[]>();
    
    // Group classes by name to detect collisions
    for (const classInfo of this.classes) {
      if (!nameToClasses.has(classInfo.name)) {
        nameToClasses.set(classInfo.name, []);
      }
      nameToClasses.get(classInfo.name)!.push(classInfo);
    }
    
    // Generate aliases for colliding names
    for (const [className, classList] of nameToClasses) {
      if (classList.length > 1) {
        // Name collision detected - generate unique aliases
        for (let i = 1; i < classList.length; i++) {
          const classInfo = classList[i];
          if (classInfo) {
            const alias = this.generateUniqueAlias(className, classInfo.importPath, i);
            this.aliasMap.set(classInfo.importPath, alias);
          }
        }
      }
    }
  }

  /**
   * Generates a unique alias based on the class name and its module path.
   */
  private generateUniqueAlias(className: string, importPath: string, index: number): string {
    // Extract module name from import path (e.g., './user/CreateItemUseCase' -> 'User')
    const pathParts = importPath.split('/');
    let moduleName = '';
    
    // Find the module directory name (the part before the class file)
    for (let i = pathParts.length - 2; i >= 0; i--) {
      const part = pathParts[i];
      if (part && part !== '.' && part !== '..') {
        moduleName = part.charAt(0).toUpperCase() + part.slice(1);
        break;
      }
    }
    
    // If we couldn't extract a meaningful module name, use index
    if (!moduleName) {
      moduleName = `Module${index + 1}`;
    }
    
    return `${moduleName}${className}`;
  }

  /**
   * Gets the alias for a class, or returns the original name if no alias exists.
   */
  getClassAlias(classInfo: ClassInfo): string {
    return this.aliasMap.get(classInfo.importPath) || classInfo.name;
  }

  /**
   * Gets the alias for a class by its import path.
   */
  getClassAliasByPath(importPath: string): string {
    return this.aliasMap.get(importPath) || '';
  }

  /**
   * Checks if a class has an alias (i.e., was involved in a name collision).
   */
  hasAlias(classInfo: ClassInfo): boolean {
    return this.aliasMap.has(classInfo.importPath);
  }

  generateImports(): string {
    const importSet = new Set<string>();
    const classMap = new Map(this.classes.map(c => [c.name, c]));
    
    // Add imports for all managed classes with aliases if needed
    for (const classInfo of this.classes) {
      const alias = this.getClassAlias(classInfo);
      if (alias !== classInfo.name) {
        // Use alias for colliding imports
        importSet.add(`import { ${classInfo.name} as ${alias} } from '${classInfo.importPath}';`);
      } else {
        // No collision, use original name
        importSet.add(`import { ${classInfo.name} } from '${classInfo.importPath}';`);
      }
    }
    
    // Add imports for unmanaged dependencies
    for (const classInfo of this.classes) {
      for (const dep of classInfo.dependencies) {
        // If dependency is not a managed class, we need to import it
        if (!classMap.has(dep)) {
            //TODO: Think about this
            // importSet.add(`import { ${dep} } from '${classInfo.importPath}';`);
        }
      }
    }

    return Array.from(importSet).join('\n');
  }
}