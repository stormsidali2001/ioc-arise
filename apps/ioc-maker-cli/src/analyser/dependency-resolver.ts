import { ClassInfo, DependencyGraph } from '../types';
import { TopologicalSorter, TopologicalSortResult } from '../utils/topological-sorter';

export class DependencyResolver {
  private classes: ClassInfo[];

  constructor(classes: ClassInfo[]) {
    this.classes = classes;
  }

  resolve(): TopologicalSortResult {
    const graph = this.buildDependencyGraph();
    return TopologicalSorter.sort(graph);
  }

  private buildDependencyGraph(): DependencyGraph {
    const graph: DependencyGraph = {};
    const classNames = new Set(this.classes.map(c => c.name));
    
    // Create interface-to-class mapping
    const interfaceToClassMap = new Map<string, string>();
    for (const classInfo of this.classes) {
      if (classInfo.interfaceName) {
        interfaceToClassMap.set(classInfo.interfaceName, classInfo.name);
      }
    }

    for (const classInfo of this.classes) {
      const managedDependencies: string[] = [];
      
      for (const dep of classInfo.dependencies) {
        // Check if dependency is a direct class name
        if (classNames.has(dep.name)) {
          managedDependencies.push(dep.name);
        }
        // Check if dependency is an interface that maps to a managed class
        else if (interfaceToClassMap.has(dep.name)) {
          const implementingClass = interfaceToClassMap.get(dep.name)!;
          managedDependencies.push(implementingClass);
        }
      }
      
      graph[classInfo.name] = managedDependencies;
    }

    return graph;
  }

  detectCircularDependencies(): string[][] {
    const result = this.resolve();
    return result.cycles;
  }
}