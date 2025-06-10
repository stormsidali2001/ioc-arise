import { ClassInfo } from '../types';

export interface ModuleDependencyResult {
  sortedModules: string[];
  cycles: string[][];
  moduleDependencies: Map<string, Set<string>>;
}

export class ModuleDependencyResolver {
  private moduleGroupedClasses: Map<string, ClassInfo[]>;
  private interfaceToModuleMap: Map<string, string>;

  constructor(moduleGroupedClasses: Map<string, ClassInfo[]>) {
    this.moduleGroupedClasses = moduleGroupedClasses;
    this.interfaceToModuleMap = this.buildInterfaceToModuleMap();
  }

  resolve(): ModuleDependencyResult {
    const moduleDependencies = this.buildModuleDependencyGraph();
    const sortResult = this.topologicalSort(moduleDependencies);
    
    return {
      sortedModules: sortResult.sorted,
      cycles: sortResult.cycles,
      moduleDependencies
    };
  }

  private buildInterfaceToModuleMap(): Map<string, string> {
    const interfaceToModuleMap = new Map<string, string>();
    
    for (const [moduleName, classes] of this.moduleGroupedClasses) {
      for (const classInfo of classes) {
        if (classInfo.interfaceName) {
          interfaceToModuleMap.set(classInfo.interfaceName, moduleName);
        }
      }
    }
    
    return interfaceToModuleMap;
  }

  private buildModuleDependencyGraph(): Map<string, Set<string>> {
    const moduleDependencies = new Map<string, Set<string>>();
    
    // Initialize all modules with empty dependency sets
    for (const moduleName of this.moduleGroupedClasses.keys()) {
      moduleDependencies.set(moduleName, new Set<string>());
    }
    
    // Analyze dependencies between modules
    for (const [moduleName, classes] of this.moduleGroupedClasses) {
      const moduleDeps = moduleDependencies.get(moduleName)!;
      
      for (const classInfo of classes) {
        for (const dependency of classInfo.dependencies) {
          // Check if this dependency is an interface from another module
          const dependencyModule = this.interfaceToModuleMap.get(dependency);
          
          if (dependencyModule && dependencyModule !== moduleName) {
            moduleDeps.add(dependencyModule);
          }
        }
      }
    }
    
    return moduleDependencies;
  }

  private topologicalSort(moduleDependencies: Map<string, Set<string>>): { sorted: string[], cycles: string[][] } {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const sorted: string[] = [];
    const cycles: string[][] = [];

    const visit = (module: string, path: string[] = []): void => {
      if (visiting.has(module)) {
        // Cycle detected
        const cycleStart = path.indexOf(module);
        cycles.push(path.slice(cycleStart).concat(module));
        return;
      }

      if (visited.has(module)) {
        return;
      }

      visiting.add(module);
      const dependencies = moduleDependencies.get(module) || new Set();

      for (const dep of dependencies) {
        visit(dep, [...path, module]);
      }

      visiting.delete(module);
      visited.add(module);
      sorted.push(module);
    };

    for (const module of moduleDependencies.keys()) {
      if (!visited.has(module)) {
        visit(module);
      }
    }

    return { sorted, cycles };
  }

  getModuleDependencies(moduleName: string): string[] {
    const result = this.resolve();
    const deps = result.moduleDependencies.get(moduleName);
    return deps ? Array.from(deps) : [];
  }
}