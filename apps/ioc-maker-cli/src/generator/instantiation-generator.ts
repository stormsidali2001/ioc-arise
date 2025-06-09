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
    const instantiations: string[] = [];
    const transientFactories: string[] = [];

    // Create interface to class mapping for dependency resolution
    const interfaceToClassMap = this.dependencyResolver.createInterfaceToClassMap();

    // Separate singletons and transients
    const singletonClasses = this.classes.filter(c => c.scope === 'singleton');
    const transientClasses = this.classes.filter(c => c.scope === 'transient');

    // Generate singleton instantiations (eager loading)
    const singletonClassNames = sortedClasses.filter(name => {
      return singletonClasses.some(c => c.name === name);
    });

    for (const className of singletonClassNames.reverse()) {
      const classInfo = classMap.get(className);
      if (!classInfo) continue;

      const variableName = toVariableName(className);
      
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
               return toVariableName(implementingClass);
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

      const instantiation = constructorArgs
        ? `const ${variableName} = new ${className}(${constructorArgs});`
        : `const ${variableName} = new ${className}();`;

      instantiations.push(instantiation);
    }

    // Generate transient factory functions (lazy loading)
    for (const classInfo of transientClasses) {
      const className = classInfo.name;
      const variableName = toVariableName(className);
      const dependencies = this.dependencyResolver.resolveDependencies(classInfo, interfaceToClassMap, classMap);

      const factory = dependencies
        ? `  ['${variableName}', () => new ${className}(${dependencies})]`
        : `  ['${variableName}', () => new ${className}()]`;

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
                 return toVariableName(implementingClass);
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
    
    // Then do singleton instantiations
    if (instantiations.length > 0) {
      result.push('// Eager singleton instantiation');
      result.push(...instantiations);
    }

    return result.join('\n');
  }
}