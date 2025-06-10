export interface TopologicalSortResult {
  sorted: string[];
  cycles: string[][];
}

export class TopologicalSorter {
  /**
   * Performs topological sorting on a dependency graph with cycle detection
   * @param graph - A map where keys are nodes and values are their dependencies
   * @param order - Sort order: 'asc' for ascending (default) or 'desc' for descending
   * @returns Object containing sorted nodes and any detected cycles
   */
  static sort(graph: Map<string, string[]> | Record<string, string[]>, order: 'asc' | 'desc' = 'asc'): TopologicalSortResult {
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
      const dependencies = this.getDependencies(graph, node);

      for (const dep of dependencies) {
        if (this.hasNode(graph, dep)) { // Only visit if dependency exists in graph
          visit(dep, [...path, node]);
        }
      }

      visiting.delete(node);
      visited.add(node);
      sorted.push(node);
    };

    const nodes = this.getNodes(graph);
    for (const node of nodes) {
      if (!visited.has(node)) {
        visit(node);
      }
    }

    const finalSorted = sorted.reverse();
    return { 
      sorted: order === 'desc' ? finalSorted.reverse() : finalSorted, 
      cycles 
    };
  }

  private static getDependencies(graph: Map<string, string[]> | Record<string, string[]>, node: string): string[] {
    if (graph instanceof Map) {
      return graph.get(node) || [];
    }
    return graph[node] || [];
  }

  private static hasNode(graph: Map<string, string[]> | Record<string, string[]>, node: string): boolean {
    if (graph instanceof Map) {
      return graph.has(node);
    }
    return node in graph;
  }

  private static getNodes(graph: Map<string, string[]> | Record<string, string[]>): string[] {
    if (graph instanceof Map) {
      return Array.from(graph.keys());
    }
    return Object.keys(graph);
  }
}