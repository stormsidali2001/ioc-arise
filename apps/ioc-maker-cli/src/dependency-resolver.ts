import { ClassInfo, DependencyGraph, TopologicalSortResult } from './types';

export class DependencyResolver {
  private classes: ClassInfo[];

  constructor(classes: ClassInfo[]) {
    this.classes = classes;
  }

  resolve(): TopologicalSortResult {
    const graph = this.buildDependencyGraph();
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const sorted: string[] = [];
    const cycles: string[][] = [];

    const visit = (node: string, path: string[] = []): void => {
      if (visiting.has(node)) {
        // Cycle detected
        const cycleStart = path.indexOf(node);
        cycles.push(path.slice(cycleStart).concat(node));
        return;
      }

      if (visited.has(node)) {
        return;
      }

      visiting.add(node);
      const dependencies = graph[node] || [];

      for (const dep of dependencies) {
        if (graph[dep]) { // Only visit if dependency is also a managed class
          visit(dep, [...path, node]);
        }
      }

      visiting.delete(node);
      visited.add(node);
      sorted.push(node);
    };

    for (const className of Object.keys(graph)) {
      if (!visited.has(className)) {
        visit(className);
      }
    }

    return { sorted, cycles };
  }

  private buildDependencyGraph(): DependencyGraph {
    const graph: DependencyGraph = {};
    const classNames = new Set(this.classes.map(c => c.name));

    for (const classInfo of this.classes) {
      // Only include dependencies that are also managed classes
      const managedDependencies = classInfo.dependencies.filter(dep => classNames.has(dep));
      graph[classInfo.name] = managedDependencies;
    }

    return graph;
  }

  detectCircularDependencies(): string[][] {
    const result = this.resolve();
    return result.cycles;
  }
}