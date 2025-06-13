import { ClassInfo } from '../../types';
import { InstantiationUtils } from '../shared';
import { ModuleDependencyResolver } from './module-dependency-resolver';

/**
 * Responsible for generating the body content of module container functions.
 * Handles factories, singletons, getters, and exports generation.
 */
export class ModuleFunctionBodyGenerator {
  private dependencyResolver: ModuleDependencyResolver;

  constructor(dependencyResolver: ModuleDependencyResolver) {
    this.dependencyResolver = dependencyResolver;
  }

  /**
   * Generates the function body for a module container.
   */
  generateModuleFunctionBody(moduleClasses: ClassInfo[], moduleDeps: Set<string>, importGenerator?: any): string {
    const constructorArgsResolver = (classInfo: ClassInfo) => {
      const constructorArgs = this.dependencyResolver.buildConstructorArguments(classInfo, moduleClasses, moduleDeps, importGenerator);
      return constructorArgs.length > 0 ? constructorArgs.join(', ') : '';
    };

    return InstantiationUtils.generateModuleFunctionBody(moduleClasses, constructorArgsResolver, importGenerator);
  }


}