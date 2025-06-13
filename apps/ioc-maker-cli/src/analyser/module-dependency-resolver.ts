import { ClassInfo } from '../types';
import { TopologicalSorter } from '../utils/topological-sorter';

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
          const dependencyModule = this.interfaceToModuleMap.get(dependency.name);
          
          if (dependencyModule && dependencyModule !== moduleName) {
            moduleDeps.add(dependencyModule);
          }
        }
      }
    }
    
    return moduleDependencies;
  }

  private topologicalSort(moduleDependencies: Map<string, Set<string>>): { sorted: string[], cycles: string[][] } {
    // Convert Map<string, Set<string>> to Map<string, string[]> for TopologicalSorter
    const graphMap = new Map<string, string[]>();
    for (const [module, deps] of moduleDependencies) {
      graphMap.set(module, Array.from(deps));
    }
    
    return TopologicalSorter.sort(graphMap,"desc");
  }

  getModuleDependencies(moduleName: string): string[] {
    const result = this.resolve();
    const deps = result.moduleDependencies.get(moduleName);
    return deps ? Array.from(deps) : [];
  }
}