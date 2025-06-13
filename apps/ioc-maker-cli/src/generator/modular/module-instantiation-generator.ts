import { InstantiationUtils } from '../shared';

/**
 * Responsible for generating module instantiation code.
 * Handles the creation of module container instances.
 */
export class ModuleInstantiationGenerator {
  constructor() {
    // No dependencies needed for this generator
  }

  /**
   * Generates instantiation code for all modules.
   */
  generateModuleInstantiations(sortedModules: string[], moduleDependencies: Map<string, Set<string>>): string[] {
    const moduleContainerCodes: string[] = [];
    
    for (const moduleName of sortedModules) {
      const moduleInstantiation = InstantiationUtils.generateModuleInstantiation(moduleName, moduleDependencies);
      moduleContainerCodes.push(moduleInstantiation);
    }
    
    return moduleContainerCodes;
  }
}