import { writeFileSync } from 'fs';
import { dirname } from 'path';
import { mkdirSync } from 'fs';
import { ClassInfo, GeneratorOptions, DependencyGraph, TopologicalSortResult } from './types';

export class ContainerGenerator {
  private options: GeneratorOptions;

  constructor(options: GeneratorOptions) {
    this.options = options;
  }

  generateContainer(): void {
    const sortResult = this.topologicalSort();
    
    if (sortResult.cycles.length > 0) {
      throw new Error(`Circular dependencies detected: ${JSON.stringify(sortResult.cycles)}`);
    }

    const containerCode = this.generateContainerCode(sortResult.sorted);
    this.writeContainerFile(containerCode);
  }

  private topologicalSort(): TopologicalSortResult {
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
    const classNames = new Set(this.options.classes.map(c => c.name));

    for (const classInfo of this.options.classes) {
      // Only include dependencies that are also managed classes
      const managedDependencies = classInfo.dependencies.filter(dep => classNames.has(dep));
      graph[classInfo.name] = managedDependencies;
    }

    return graph;
  }

  private generateContainerCode(sortedClasses: string[]): string {
    const imports = this.generateImports();
    const instantiations = this.generateInstantiations(sortedClasses);
    const containerObject = this.generateContainerObject();
    const typeExport = this.generateTypeExport();

    return `${imports}\n\n${instantiations}\n\n${containerObject}\n\n${typeExport}\n`;
  }

  private generateImports(): string {
    const importSet = new Set<string>();
    const classMap = new Map(this.options.classes.map(c => [c.name, c]));
    
    // Add imports for all managed classes
    for (const classInfo of this.options.classes) {
      importSet.add(`import { ${classInfo.name} } from '${classInfo.importPath}';`);
    }
    
    // Add imports for unmanaged dependencies
    for (const classInfo of this.options.classes) {
      for (const dep of classInfo.dependencies) {
        // If dependency is not a managed class, we need to import it
        if (!classMap.has(dep)) {
          // Check if it's an interface (starts with 'I' by convention)
          if (!dep.startsWith('I')) {
            importSet.add(`import { ${dep} } from '${classInfo.importPath}';`);
          }
        }
      }
    }

    return Array.from(importSet).join('\n');
  }

  private generateInstantiations(sortedClasses: string[]): string {
    const classMap = new Map(this.options.classes.map(c => [c.name, c]));
    const instantiations: string[] = [];

    // Create interface to class mapping for dependency resolution
    const interfaceToClassMap = new Map<string, string>();
    for (const classInfo of this.options.classes) {
      if (classInfo.interfaceName) {
        interfaceToClassMap.set(classInfo.interfaceName, classInfo.name);
      }
    }

    for (const className of sortedClasses) {
      const classInfo = classMap.get(className);
      if (!classInfo) continue;

      const variableName = this.toVariableName(className);
      const dependencies = classInfo.dependencies
        .map(dep => {
          // Check if dependency is an interface name
          const implementingClass = interfaceToClassMap.get(dep);
          if (implementingClass) {
            return this.toVariableName(implementingClass);
          }
          // Check if dependency is a class name
          if (classMap.has(dep)) {
            return this.toVariableName(dep);
          }
          // Check if dependency is a class that exists in the same file but not managed
          // For now, we'll create a simple instance for unmanaged dependencies
          return `new ${dep}()`;
        })
        .filter(dep => dep !== null)
        .join(', ');

      const instantiation = dependencies
        ? `const ${variableName} = new ${className}(${dependencies});`
        : `const ${variableName} = new ${className}();`;

      instantiations.push(instantiation);
    }

    return instantiations.join('\n');
  }

  private generateContainerObject(): string {
    const properties = this.options.classes.map(classInfo => {
      const variableName = this.toVariableName(classInfo.name);
      return `  ${variableName},`;
    });

    return `export const container = {\n${properties.join('\n')}\n};`;
  }

  private generateTypeExport(): string {
    return 'export type Container = typeof container;';
  }

  private toVariableName(className: string): string {
    // Convert PascalCase to camelCase
    return className.charAt(0).toLowerCase() + className.slice(1);
  }

  private writeContainerFile(content: string): void {
    // Ensure output directory exists
    const outputDir = dirname(this.options.outputPath);
    mkdirSync(outputDir, { recursive: true });

    // Write the container file
    writeFileSync(this.options.outputPath, content, 'utf-8');
  }
}

export function generateContainerFile(classes: ClassInfo[], outputPath: string): void {
  const generator = new ContainerGenerator({ classes, outputPath });
  generator.generateContainer();
}

export function detectCircularDependencies(classes: ClassInfo[]): string[][] {
  const generator = new ContainerGenerator({ classes, outputPath: '' });
  try {
    const sortResult = (generator as any).topologicalSort();
    return sortResult.cycles;
  } catch (error) {
    return [];
  }
}