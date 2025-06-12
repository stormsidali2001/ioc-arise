import { ClassInfo } from '../../types';
import { toVariableName } from '../../utils/naming';
import { DependencyResolver } from './dependency-resolver';

export class InstantiationGenerator {
  private classes: ClassInfo[];
  private dependencyResolver: DependencyResolver;
  private classMap: Map<string, ClassInfo>;
  private interfaceToClassMap: Map<string, string>;

  constructor(classes: ClassInfo[]) {
    this.classes = classes;
    this.dependencyResolver = new DependencyResolver(classes);
    this.classMap = new Map(classes.map(c => [c.name, c]));
    this.interfaceToClassMap = this.dependencyResolver.createInterfaceToClassMap();
  }

  generateInstantiations(sortedClasses: string[]): string {
    const { singletonClasses, transientClasses } = this.separateClassesByScope();
    const singletonClassNames = this.filterSingletonClassNames(sortedClasses, singletonClasses);

    const sections = [
      this.generateTransientFactories(transientClasses),
      this.generateSingletonVariables(singletonClassNames),
      this.generateSingletonGetters(singletonClassNames)
    ].filter(section => section.length > 0);

    return sections.join('\n\n');
  }

  private separateClassesByScope() {
    return {
      singletonClasses: this.classes.filter(c => c.scope === 'singleton'),
      transientClasses: this.classes.filter(c => c.scope === 'transient')
    };
  }

  private filterSingletonClassNames(sortedClasses: string[], singletonClasses: ClassInfo[]): string[] {
    return sortedClasses.filter(name => 
      singletonClasses.some(c => c.name === name)
    );
  }

  private generateTransientFactories(transientClasses: ClassInfo[]): string {
    if (transientClasses.length === 0) return '';

    const factories = transientClasses.map(classInfo => 
      this.createTransientFactory(classInfo)
    );

    return [
      '// Lazy loading setup for transient dependencies',
      ...factories
    ].join('\n');
  }

  private createTransientFactory(classInfo: ClassInfo): string {
    const variableName = toVariableName(classInfo.name);
    const constructorArgs = this.generateConstructorArguments(classInfo);
    
    return constructorArgs
      ? `const ${variableName}Factory = (): ${classInfo.name} => new ${classInfo.name}(${constructorArgs});`
      : `const ${variableName}Factory = (): ${classInfo.name} => new ${classInfo.name}();`;
  }

  private generateSingletonVariables(singletonClassNames: string[]): string {
    if (singletonClassNames.length === 0) return '';

    const variables = singletonClassNames.map(className => {
      const variableName = toVariableName(className);
      return `let ${variableName}: ${className} | undefined;`;
    });

    return [
      '// Lazy initialization variables for singletons',
      ...variables
    ].join('\n');
  }

  private generateSingletonGetters(singletonClassNames: string[]): string {
    if (singletonClassNames.length === 0) return '';

    const getters = [...singletonClassNames].reverse().map(className => 
      this.createSingletonGetter(className)
    ).filter(getter => getter !== null);

    return [
      '// Lazy getter functions for singletons',
      ...getters
    ].join('\n');
  }

  private createSingletonGetter(className: string): string | null {
    const classInfo = this.classMap.get(className);
    if (!classInfo) return null;

    const variableName = toVariableName(className);
    const getterName = `get${className}`;
    const constructorArgs = this.generateConstructorArguments(classInfo);
    
    const instantiation = constructorArgs
      ? `new ${className}(${constructorArgs})`
      : `new ${className}()`;

    return `const ${getterName} = (): ${className} => {\n  if (!${variableName}) {\n    ${variableName} = ${instantiation};\n  }\n  return ${variableName};\n};`;
  }

  private generateConstructorArguments(classInfo: ClassInfo): string {
    if (classInfo.constructorParams.length === 0) return '';

    const args = classInfo.constructorParams.map((param, paramIndex) => 
      this.resolveParameterDependency(classInfo, param, paramIndex)
    );

    return args.join(', ');
  }

  private resolveParameterDependency(classInfo: ClassInfo, param: any, paramIndex: number): string {
    const targetDependency = this.getTargetDependency(classInfo, param, paramIndex);
    const implementingClass = this.interfaceToClassMap.get(targetDependency) || targetDependency;
    const depClassInfo = this.classMap.get(implementingClass);

    if (depClassInfo) {
      return this.createManagedDependencyCall(depClassInfo, implementingClass);
    }

    if (classInfo.dependencies.includes(targetDependency)) {
      return `new ${targetDependency}()`;
    }

    return this.dependencyResolver.getDefaultValueForType(param.type, param.isOptional);
  }

  private getTargetDependency(classInfo: ClassInfo, param: any, paramIndex: number): string {
    if (paramIndex < classInfo.dependencies.length) {
      const resolvedDep = classInfo.dependencies[paramIndex];
      if (resolvedDep) return resolvedDep;
    }

    const directMatch = classInfo.dependencies.find(dep => dep === param.type);
    return directMatch || param.type;
  }

  private createManagedDependencyCall(depClassInfo: ClassInfo, implementingClass: string): string {
    if (depClassInfo.scope === 'transient') {
      return `${toVariableName(implementingClass)}Factory()`;
    }
    return `get${implementingClass}()`;
  }
}