import { ClassInfo } from '../types';
import { TopologicalSorter } from './topological-sorter';

export class CircularDependencyDetector {
    /**
     * Detects circular dependencies in a list of classes
     * @param classes - Array of analyzed classes
     * @returns Array of cycles, where each cycle is an array of class names involved
     */
    static detect(classes: ClassInfo[]): string[][] {
        // Build a map from interface/class name to actual class name
        const nameToClassName = new Map<string, string>();
        classes.forEach((cls) => {
            nameToClassName.set(cls.name, cls.name); // Class name maps to itself
            if (cls.interfaceName) {
                nameToClassName.set(cls.interfaceName, cls.name); // Interface name maps to implementing class
            }
        });

        const dependencyGraph = new Map<string, string[]>();

        // Build dependency graph using actual class names
        classes.forEach((cls) => {
            const resolvedDeps = cls.dependencies
                .map((dep) => nameToClassName.get(dep.name))
                .filter((name): name is string => name !== undefined);

            dependencyGraph.set(cls.name, resolvedDeps);
        });

        // Use TopologicalSorter to detect cycles
        const result = TopologicalSorter.sort(dependencyGraph);
        return result.cycles;
    }

    /**
     * Detects circular dependencies between modules
     * @param moduleGroupedClasses - Map of module name to classes in that module
     * @returns Array of cycles, where each cycle is an array of module names involved
     */
    static detectModuleCycles(moduleGroupedClasses: Map<string, ClassInfo[]>): string[][] {
        const moduleDependencyGraph = new Map<string, Set<string>>();

        // Build module dependency graph
        for (const [moduleName, classes] of moduleGroupedClasses.entries()) {
            const moduleDeps = new Set<string>();

            // For each class in this module, find which modules its dependencies belong to
            for (const cls of classes) {
                for (const dep of cls.dependencies) {
                    // Find which module this dependency belongs to
                    for (const [depModuleName, depModuleClasses] of moduleGroupedClasses.entries()) {
                        if (depModuleName === moduleName) continue; // Skip self-dependencies

                        // Check if the dependency is in this other module (by interface name or class name)
                        const isInModule = depModuleClasses.some(
                            depCls => depCls.interfaceName === dep.name || depCls.name === dep.name
                        );

                        if (isInModule) {
                            moduleDeps.add(depModuleName);
                        }
                    }
                }
            }

            moduleDependencyGraph.set(moduleName, moduleDeps);
        }

        // Convert Set to Array for TopologicalSorter
        const graphForSorter = new Map<string, string[]>();
        for (const [module, deps] of moduleDependencyGraph.entries()) {
            graphForSorter.set(module, Array.from(deps));
        }

        // Use TopologicalSorter to detect cycles
        const result = TopologicalSorter.sort(graphForSorter);
        return result.cycles;
    }
}

