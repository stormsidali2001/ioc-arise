import { ClassInfo } from '../domain/types';
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
    const graphMap = new Map<string, string[]>();
    for (const [mod, deps] of moduleDependencies) {
      graphMap.set(mod, Array.from(deps));
    }
    const sortResult = TopologicalSorter.sort(graphMap, 'desc');
    return {
      sortedModules: sortResult.sorted,
      cycles: sortResult.cycles,
      moduleDependencies,
    };
  }

  private buildInterfaceToModuleMap(): Map<string, string> {
    const map = new Map<string, string>();
    for (const [moduleName, classes] of this.moduleGroupedClasses) {
      for (const cls of classes) {
        if (cls.interfaceName) map.set(cls.interfaceName, moduleName);
        map.set(cls.name, moduleName);
        if (cls.abstractClassName) map.set(cls.abstractClassName, moduleName);
      }
    }
    return map;
  }

  private buildModuleDependencyGraph(): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();
    for (const moduleName of this.moduleGroupedClasses.keys()) {
      graph.set(moduleName, new Set());
    }
    for (const [moduleName, classes] of this.moduleGroupedClasses) {
      const deps = graph.get(moduleName)!;
      for (const cls of classes) {
        for (const dep of cls.dependencies) {
          const depModule = this.interfaceToModuleMap.get(dep.name);
          if (depModule && depModule !== moduleName) {
            deps.add(depModule);
          }
        }
      }
    }
    return graph;
  }
}
