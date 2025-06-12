import { ClassInfo } from '../../types';

/**
 * Responsible for generating module instantiation code.
 * Handles the creation of module container instances.
 */
export class ModuleInstantiationGenerator {
  private moduleGroupedClasses: Map<string, ClassInfo[]>;

  constructor(moduleGroupedClasses: Map<string, ClassInfo[]>) {
    this.moduleGroupedClasses = moduleGroupedClasses;
  }

  /**
   * Generates instantiation code for all modules.
   */
  generateModuleInstantiations(sortedModules: string[], moduleDependencies: Map<string, Set<string>>): string[] {
    const moduleContainerCodes: string[] = [];
    
    for (const moduleName of sortedModules) {
      const moduleInstantiation = this.createModuleInstantiation(moduleName, moduleDependencies);
      moduleContainerCodes.push(moduleInstantiation);
    }
    
    return moduleContainerCodes;
  }

  /**
   * Creates instantiation code for a specific module.
   */
  private createModuleInstantiation(moduleName: string, moduleDependencies: Map<string, Set<string>>): string {
    const moduleVarName = this.camelCase(moduleName) + 'Container';
    const moduleFunctionName = `create${moduleName}Container`;
    const moduleDeps = moduleDependencies.get(moduleName) || new Set();
    
    const functionArgs = this.getModuleFunctionArguments(moduleDeps);
    
    return functionArgs.length > 0 ?
      `const ${moduleVarName} = ${moduleFunctionName}(${functionArgs.join(', ')});` :
      `const ${moduleVarName} = ${moduleFunctionName}();`;
  }

  /**
   * Gets function arguments for module dependencies.
   */
  private getModuleFunctionArguments(moduleDeps: Set<string>): string[] {
    const functionArgs: string[] = [];
    
    for (const depModule of moduleDeps) {
      const depVarName = this.camelCase(depModule) + 'Container';
      functionArgs.push(depVarName);
    }
    
    return functionArgs;
  }

  /**
   * Utility method to convert strings to camelCase.
   */
  private camelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1).replace(/[^a-zA-Z0-9]/g, '');
  }
}