export interface ConstructorParameter {
  name: string;
  type: string;
  isOptional: boolean;
  accessModifier?: 'private' | 'public' | 'protected';
}

export interface ClassInfo {
  name: string;
  filePath: string;
  dependencies: string[];
  constructorParams: ConstructorParameter[];
  interfaceName?: string;
  importPath: string;
}

export interface AnalyzerOptions {
  sourceDir: string;
  interfacePattern?: string;
  excludePatterns?: string[];
}

export interface GeneratorOptions {
  outputPath: string;
  classes: ClassInfo[];
}

export interface DependencyGraph {
  [className: string]: string[];
}

export interface TopologicalSortResult {
  sorted: string[];
  cycles: string[][];
}