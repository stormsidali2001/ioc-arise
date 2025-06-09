import { ClassInfo } from '../types';

export class ImportGenerator {
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
}