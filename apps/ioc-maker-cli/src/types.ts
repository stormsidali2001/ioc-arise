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

export interface FactoryInfo {
  name: string;
  filePath: string;
  dependencies: DependencyInfo[];
  parameters: ConstructorParameter[];
  returnType?: string;
  importPath: string;
  scope: InjectionScope;
  token?: string; // Optional token name for registration
  useContextObject?: boolean; // Whether factory uses context object pattern
  contextObjectName?: string; // Name of the context parameter (e.g., "context")
  contextObjectProperties?: { name: string; type: string }[]; // Properties in the context object
}

export interface ValueInfo {
  name: string;              // Variable name (e.g., "userService")
  filePath: string;
  interfaceName?: string;     // Interface it implements (e.g., "IUserService")
  importPath: string;
  scope: InjectionScope;     // Always singleton for useValue
  token?: string;            // Token for registration (defaults to interfaceName or name)
}

export interface AnalyzerOptions {
  sourceDir: string;
  interfacePattern?: string;
  excludePatterns?: string[];
  factoryPattern?: string;
  valuePattern?: string;
}

export interface GeneratorOptions {
  outputPath: string;
  classes?: ClassInfo[];
  moduleGroupedClasses?: Map<string, ClassInfo[]>;
}

export interface DependencyGraph {
  [className: string]: string[];
}