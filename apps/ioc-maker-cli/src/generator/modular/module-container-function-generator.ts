import { ClassInfo } from '../../types';
import { ModuleFunctionSignatureGenerator } from './module-function-signature-generator';
import { ModuleDependencyResolver } from './module-dependency-resolver';
import { ModuleFunctionBodyGenerator } from './module-function-body-generator';

/**
 * Coordinates the generation of module container functions.
 * Delegates specific responsibilities to specialized generators.
 */
export class ModuleContainerFunctionGenerator {
  private moduleGroupedClasses: Map<string, ClassInfo[]>;
  private signatureGenerator: ModuleFunctionSignatureGenerator;
  private dependencyResolver: ModuleDependencyResolver;
  private bodyGenerator: ModuleFunctionBodyGenerator;

  constructor(
    moduleGroupedClasses: Map<string, ClassInfo[]>,
    signatureGenerator: ModuleFunctionSignatureGenerator,
    dependencyResolver: ModuleDependencyResolver,
    bodyGenerator: ModuleFunctionBodyGenerator
  ) {
    this.moduleGroupedClasses = moduleGroupedClasses;
    this.signatureGenerator = signatureGenerator;
    this.dependencyResolver = dependencyResolver;
    this.bodyGenerator = bodyGenerator;
  }

  /**
   * Generates container functions for all modules.
   */
  generateModuleContainerFunctions(sortedModules: string[], moduleDependencies: Map<string, Set<string>>): string[] {
    const moduleContainerFunctions: string[] = [];
    
    for (const moduleName of sortedModules) {
      const moduleClasses = this.moduleGroupedClasses.get(moduleName);
      if (!moduleClasses) continue;
      
      const moduleContainerFunction = this.createModuleContainerFunction(moduleName, moduleClasses, moduleDependencies);
      moduleContainerFunctions.push(moduleContainerFunction);
    }
    
    return moduleContainerFunctions;
  }

  /**
   * Creates a container function for a specific module.
   */
  private createModuleContainerFunction(moduleName: string, moduleClasses: ClassInfo[], moduleDependencies: Map<string, Set<string>>): string {
    const moduleFunctionName = `create${moduleName}Container`;
    const moduleDeps = moduleDependencies.get(moduleName) || new Set();
    
    const functionParams = this.signatureGenerator.generateFunctionParameters(moduleDeps);
    const functionSignature = this.signatureGenerator.createFunctionSignature(moduleFunctionName, functionParams);
    const functionBody = this.bodyGenerator.generateModuleFunctionBody(moduleClasses, moduleDeps);
    
    return `${functionSignature} {\n${functionBody}\n}`;
  }


}