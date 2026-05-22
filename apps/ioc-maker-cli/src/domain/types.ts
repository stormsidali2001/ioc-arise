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
  token?: string;
  useContextObject?: boolean;
  contextObjectName?: string;
  contextObjectProperties?: { name: string; type: string }[];
  instanceFactoryFor?: string;
}

export interface ValueInfo {
  name: string;
  filePath: string;
  interfaceName?: string;
  importPath: string;
  scope: InjectionScope;
  token?: string;
}

export interface AnalyzerOptions {
  sourceDir: string;
  interfacePattern?: string;
  excludePatterns?: string[];
  factoryPattern?: string;
  valuePattern?: string;
}

export interface DependencyGraph {
  [className: string]: string[];
}

// ── Raw types produced by TsMorphTypeParser ──────────────────────────────────

export interface RawParam {
  name: string;
  type: string;
  isOptional: boolean;
  accessModifier?: 'private' | 'public' | 'protected';
}

export interface RawClassData {
  name: string;
  filePath: string;
  isAbstract: boolean;
  implementsInterface?: string;
  extendsClass?: string;
  constructorParams: RawParam[];
  jsDocScope?: InjectionScope;
}

export interface RawFunctionData {
  name: string;
  filePath: string;
  isExported: boolean;
  returnType?: string;
  parameters: RawParam[];
  hasFactoryAnnotation: boolean;
  jsDocScope?: InjectionScope;
}

export interface RawValueData {
  name: string;
  filePath: string;
  typeAnnotation?: string;
  hasValueAnnotation: boolean;
  jsDocScope?: InjectionScope;
}

export interface FileTokens {
  interfaces: string[];
  typeAliases: Map<string, string>;
  importMappings: Map<string, string>;
  externalReExports: string[];
  classNames: string[];
  abstractClassNames: string[];
}

export interface ParsedFile {
  filePath: string;
  classes: RawClassData[];
  functions: RawFunctionData[];
  values: RawValueData[];
  tokens: FileTokens;
}
