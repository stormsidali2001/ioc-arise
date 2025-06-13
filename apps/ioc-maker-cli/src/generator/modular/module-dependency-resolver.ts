import { ClassInfo } from '../../types';
import { InstantiationUtils } from '../shared';

/**
 * Responsible for resolving dependencies within and across modules.
 * Handles both internal module dependencies and external module dependencies.
 */
export class ModuleDependencyResolver {
  private moduleGroupedClasses: Map<string, ClassInfo[]>;

  constructor(moduleGroupedClasses: Map<string, ClassInfo[]>) {
    this.moduleGroupedClasses = moduleGroupedClasses;
  }

  /**
   * Builds constructor arguments for a class.
   */
  buildConstructorArguments(classInfo: ClassInfo, moduleClasses: ClassInfo[], moduleDeps: Set<string>): string[] {
    const constructorArgs: string[] = [];
    
    for (const dep of classInfo.dependencies) {
      const arg = this.resolveDependencyArgument(dep, moduleClasses, moduleDeps);
      if (arg) {
        constructorArgs.push(arg);
      }
    }
    
    return constructorArgs;
  }

  /**
   * Resolves a dependency argument.
   */
  private resolveDependencyArgument(dependency: string, moduleClasses: ClassInfo[], moduleDeps: Set<string>): string | null {
    // Check if dependency is from another module
    const externalModuleArg = this.findExternalModuleDependency(dependency, moduleDeps);
    if (externalModuleArg) {
      return externalModuleArg;
    }
    
    // Check if dependency is from the same module
    return InstantiationUtils.resolveBasicDependency(dependency, moduleClasses);
  }

  /**
   * Finds a dependency from an external module.
   */
  private findExternalModuleDependency(dependency: string, moduleDeps: Set<string>): string | null {
    for (const depModule of moduleDeps) {
      const depModuleClasses = this.moduleGroupedClasses.get(depModule);
      if (depModuleClasses) {
        const depClass = depModuleClasses.find(c => c.interfaceName === dependency);
        if (depClass) {
          const depModuleVarName = InstantiationUtils.toCamelCase(depModule) + 'Container';
          return `${depModuleVarName}.${dependency}`;
        }
      }
    }
    return null;
  }


}