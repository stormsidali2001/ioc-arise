import { ClassInfo, DependencyGraph } from '../domain/types';
import { TopologicalSorter, TopologicalSortResult } from '../utils/topological-sorter';

export class DependencyResolver {
  private classes: ClassInfo[];

  constructor(classes: ClassInfo[]) {
    this.classes = classes;
  }

  resolve(): TopologicalSortResult {
    return TopologicalSorter.sort(this.buildGraph());
  }

  detectCircularDependencies(): string[][] {
    return this.resolve().cycles;
  }

  private buildGraph(): DependencyGraph {
    const graph: DependencyGraph = {};
    const classNames = new Set(this.classes.map((c) => c.name));
    const interfaceToClass = new Map<string, string>();

    for (const cls of this.classes) {
      if (cls.interfaceName) {
        interfaceToClass.set(cls.interfaceName, cls.name);
      }
    }

    for (const cls of this.classes) {
      const managed: string[] = [];
      for (const dep of cls.dependencies) {
        if (classNames.has(dep.name)) {
          managed.push(dep.name);
        } else if (interfaceToClass.has(dep.name)) {
          managed.push(interfaceToClass.get(dep.name)!);
        }
      }
      graph[cls.name] = managed;
    }

    return graph;
  }
}
