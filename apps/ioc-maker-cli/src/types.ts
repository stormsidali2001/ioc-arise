export type InjectionScope = 'singleton' | 'transient';

export interface ConstructorParameter {
  name: string;
  type: string;
  isOptional: boolean;
  accessModifier?: 'private' | 'public' | 'protected';
}

export interface DependencyInfo {
  name: string;
  importPath: string;
}

export interface ClassInfo {
  name: string;
  filePath: string;
  dependencies: DependencyInfo[];
  constructorParams: ConstructorParameter[];
  interfaceName?: string;
  abstractClassName?: string;
  importPath: string;
  scope: InjectionScope;
}

export interface AnalyzerOptions {
  sourceDir: string;
  interfacePattern?: string;
  excludePatterns?: string[];
}

export interface GeneratorOptions {
  outputPath: string;
  classes?: ClassInfo[];
  moduleGroupedClasses?: Map<string, ClassInfo[]>;
}

export interface DependencyGraph {
  [className: string]: string[];
}