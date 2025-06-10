import { ClassInfo } from '../types';

export class ModuleContainerGenerator {
  private moduleGroupedClasses: Map<string, ClassInfo[]>;

  constructor(moduleGroupedClasses: Map<string, ClassInfo[]>) {
    this.moduleGroupedClasses = moduleGroupedClasses;
  }

  generateModuleContainers(): string {
    const moduleContainerCodes: string[] = [];
    
    for (const [moduleName, moduleClasses] of this.moduleGroupedClasses) {
      const moduleVarName = this.camelCase(moduleName) + 'Container';
      const moduleExports: string[] = [];
      
      for (const classInfo of moduleClasses) {
        if (classInfo.interfaceName) {
          const instanceName = this.camelCase(classInfo.name);
          // Check if this is a transient dependency (has factory)
          const isTransient = classInfo.scope === 'transient';
          const exportValue = isTransient ? 
            `get ${classInfo.interfaceName}(): ${classInfo.name} {\n    return ${instanceName}Factory();\n  }` :
            `${classInfo.interfaceName}: ${instanceName}`;
          
          if (isTransient) {
            moduleExports.push(`  ${exportValue}`);
          } else {
            moduleExports.push(`  ${exportValue}`);
          }
        }
      }
      
      const moduleContainerCode = `const ${moduleVarName} = {\n${moduleExports.join(',\n')}\n};`;
      moduleContainerCodes.push(moduleContainerCode);
    }
    
    return moduleContainerCodes.join('\n\n');
  }

  generateAggregatedContainer(): string {
    const moduleExports: string[] = [];
    
    for (const [moduleName] of this.moduleGroupedClasses) {
      const moduleVarName = this.camelCase(moduleName) + 'Container';
      const moduleKey = this.camelCase(moduleName);
      moduleExports.push(`  ${moduleKey}: ${moduleVarName}`);
    }
    
    return `export const container = {\n${moduleExports.join(',\n')}\n};`;
  }

  generateModularTypeExport(): string {
    return 'export type Container = typeof container;';
  }

  private camelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1).replace(/[^a-zA-Z0-9]/g, '');
  }
}