import { relative } from 'path';
import { InjectionScope, ParsedFile, ValueInfo } from '../domain/types';

export class ValueAnalyzer {
  private sourceDir: string;
  private valuePattern?: RegExp;

  constructor(sourceDir: string, valuePattern?: string) {
    this.sourceDir = sourceDir;
    if (valuePattern) {
      try {
        this.valuePattern = new RegExp(valuePattern, 'i');
      } catch {
        // invalid pattern — ignore
      }
    }
  }

  analyze(parsedFiles: ParsedFile[]): ValueInfo[] {
    const all: ValueInfo[] = [];
    for (const pf of parsedFiles) {
      all.push(...this.analyzeFile(pf));
    }
    return all;
  }

  private analyzeFile(pf: ParsedFile): ValueInfo[] {
    const values: ValueInfo[] = [];

    for (const raw of pf.values) {
      const matchesPattern = this.valuePattern
        ? this.valuePattern.test(raw.name)
        : false;

      if (!raw.hasValueAnnotation && !matchesPattern) continue;

      const scope: InjectionScope = raw.jsDocScope ?? 'singleton';
      const token = raw.typeAnnotation ?? raw.name;
      const importPath = this.toImportPath(raw.filePath);

      values.push({
        name: raw.name,
        filePath: raw.filePath,
        interfaceName: raw.typeAnnotation,
        importPath,
        scope,
        token,
      });
    }

    return values;
  }

  private toImportPath(filePath: string): string {
    return `./${relative(this.sourceDir, filePath).replace(/\.ts$/, '')}`;
  }
}
