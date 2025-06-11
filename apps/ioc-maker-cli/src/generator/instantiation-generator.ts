import { ClassInfo } from '../types';
import { toVariableName } from '../utils/naming';
import { DependencyResolver } from './dependency-resolver';

export class InstantiationGenerator {
  private classes: ClassInfo[];
  private dependencyResolver: DependencyResolver;

  constructor(classes: ClassInfo[]) {
    this.classes = classes;
    this.dependencyResolver = new DependencyResolver(classes);
  }

  generateInstantiations(sortedClasses: string[]): string {
    const classMap = new Map(this.classes.map(c => [c.name, c]));
    const lazyInitializations: string[] = [];
    const lazyGetters: string[] = [];
    const transientFactories: string[] = [];

    // Create interface to class mapping for dependency resolution
    const interfaceToClassMap = this.dependencyResolver.createInterfaceToClassMap();

    // Separate singletons and transients
    const singletonClasses = this.classes.filter(c => c.scope === 'singleton');
    const transientClasses = this.classes.filter(c => c.scope === 'transient');

    // Generate lazy initialization variables for singletons
    const singletonClassNames = sortedClasses.filter(name => {
      return singletonClasses.some(c => c.name === name);
    });

    for (const className of singletonClassNames) {
      const variableName = toVariableName(className);
      lazyInitializations.push(`let ${variableName}: ${className} | undefined;`);
    }

    // Generate lazy getter functions for singletons
    for (const className of singletonClassNames.reverse()) {
      const classInfo = classMap.get(className);
      if (!classInfo) continue;

      const variableName = toVariableName(className);
      const getterName = `get${className}`;
      
      // Generate constructor arguments for all parameters
      let constructorArgs = '';
      if (classInfo.constructorParams.length > 0) {
        const args = classInfo.constructorParams.map((param, paramIndex) => {
          // The dependencies array contains resolved interface names (after alias resolution)
          // We need to map constructor parameters to dependencies by position
          let targetDependency: string = param.type;
          
          // If we have a dependency at this parameter index, use it (it's already resolved)
          if (paramIndex < classInfo.dependencies.length) {
            const resolvedDep = classInfo.dependencies[paramIndex];
            if (resolvedDep) {
              targetDependency = resolvedDep;
            }
          } else {
            // Fallback: check if parameter type directly matches any dependency
            const directMatch = classInfo.dependencies.find(dep => dep === param.type);
            if (directMatch) {
              targetDependency = directMatch;
            }
          }
          
          // Check if this is a managed dependency
          const implementingClass = interfaceToClassMap.get(targetDependency) || targetDependency;
          const depClassInfo = classMap.get(implementingClass);
          
          if (depClassInfo) {
            // This is a managed dependency, resolve it
            if (depClassInfo.scope === 'transient') {
              return `${toVariableName(implementingClass)}Factory()`;
            }
            return `get${implementingClass}()`;
          } else {
            // Check if it's in our dependencies list (unmanaged but expected)
            if (classInfo.dependencies.includes(targetDependency)) {
              return `new ${targetDependency}()`;
            }
            // This is an unmanaged parameter, generate default value
            return this.dependencyResolver.getDefaultValueForType(param.type, param.isOptional);
          }
        });
        constructorArgs = args.join(', ');
      }

      const instantiation = constructorArgs
        ? `new ${className}(${constructorArgs})`
        : `new ${className}()`;

      const lazyGetter = `const ${getterName} = (): ${className} => {\n  if (!${variableName}) {\n    ${variableName} = ${instantiation};\n  }\n  return ${variableName};\n};`;
      
      lazyGetters.push(lazyGetter);
    }

    // Generate transient factory functions (lazy loading)
    for (const classInfo of transientClasses) {
      const className = classInfo.name;
      const variableName = toVariableName(className);
      const dependencies = this.dependencyResolver.resolveDependencies(classInfo, interfaceToClassMap, classMap);

      const factory = dependencies
        ? `const ${variableName}Factory = (): ${className} => new ${className}(${dependencies});`
        : `const ${variableName}Factory = (): ${className} => new ${className}();`;

      transientFactories.push(factory);
    }

    const result = [];
    
    // First declare transient factories if needed
    if (transientFactories.length > 0) {
      result.push('// Lazy loading setup for transient dependencies');
      
      // Create individual typed factory functions
      for (const classInfo of transientClasses) {
        const variableName = toVariableName(classInfo.name);
        const className = classInfo.name;
        
        // Generate constructor arguments for all parameters
        let constructorArgs = '';
        if (classInfo.constructorParams.length > 0) {
          const args = classInfo.constructorParams.map(param => {
             // Check if this parameter is a dependency
             const depIndex = classInfo.dependencies.indexOf(param.type);
             if (depIndex !== -1) {
               // Check if it's a managed dependency (exists in our class map)
               const implementingClass = interfaceToClassMap.get(param.type) || param.type;
               const depClassInfo = classMap.get(implementingClass);
               if (depClassInfo) {
                 // This is a managed dependency, resolve it
                 if (depClassInfo.scope === 'transient') {
                   return `${toVariableName(implementingClass)}Factory()`;
                 }
                 return `get${implementingClass}()`;
               } else {
                 // This is an unmanaged dependency, create new instance
                 return `new ${param.type}()`;
               }
             } else {
               // This is an unmanaged parameter, generate default value
               return this.dependencyResolver.getDefaultValueForType(param.type, param.isOptional);
             }
           });
          constructorArgs = args.join(', ');
        }
        
        const factoryFunction = constructorArgs
          ? `const ${variableName}Factory = (): ${className} => new ${className}(${constructorArgs});`
          : `const ${variableName}Factory = (): ${className} => new ${className}();`;
        
        result.push(factoryFunction);
      }
      result.push('');
    }
    
    // Then add lazy initialization variables for singletons
    if (lazyInitializations.length > 0) {
      result.push('// Lazy initialization variables for singletons');
      result.push(...lazyInitializations);
      result.push('');
    }
    
    // Then add lazy getter functions for singletons
    if (lazyGetters.length > 0) {
      result.push('// Lazy getter functions for singletons');
      result.push(...lazyGetters);
    }

    return result.join('\n');
  }
}