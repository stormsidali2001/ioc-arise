import { relative } from 'path';
import {
  DependencyInfo,
  FactoryInfo,
  InjectionScope,
  ParsedFile,
  RawParam,
} from '../domain/types';
import { TsMorphTypeParser } from '../infrastructure/parser/TsMorphTypeParser';

interface TokenSet {
  interfaces: Set<string>;
  classNames: Set<string>;
  factoryNames: Set<string>;
}

export class FactoryAnalyzer {
  private sourceDir: string;
  private factoryPattern?: RegExp;
  private parser: TsMorphTypeParser;

  constructor(
    sourceDir: string,
    parser: TsMorphTypeParser,
    factoryPattern?: string
  ) {
    this.sourceDir = sourceDir;
    this.parser = parser;
    if (factoryPattern) {
      try {
        this.factoryPattern = new RegExp(factoryPattern, 'i');
      } catch {
        // invalid pattern — ignore
      }
    }
  }

  analyze(parsedFiles: ParsedFile[], tokens: TokenSet): FactoryInfo[] {
    const all: FactoryInfo[] = [];
    for (const pf of parsedFiles) {
      all.push(...this.analyzeFile(pf, tokens));
    }
    return all;
  }

  private analyzeFile(pf: ParsedFile, tokens: TokenSet): FactoryInfo[] {
    const factories: FactoryInfo[] = [];

    for (const fn of pf.functions) {
      if (!fn.isExported) continue;

      const matchesPattern = this.factoryPattern
        ? this.factoryPattern.test(fn.name)
        : false;

      const returnType = fn.returnType;
      const instanceFactoryFor = returnType
        ? this.extractCoreInterfaceName(returnType, tokens.interfaces)
        : undefined;

      if (!fn.hasFactoryAnnotation && !matchesPattern && !instanceFactoryFor) {
        continue;
      }

      const defaultScope: InjectionScope = instanceFactoryFor
        ? 'transient'
        : 'singleton';
      const scope = fn.jsDocScope ?? defaultScope;

      const isContextObject =
        fn.parameters.length === 1 &&
        fn.parameters[0] !== undefined &&
        fn.parameters[0].type.startsWith('{') &&
        fn.parameters[0].type.includes(':');

      let dependencies: DependencyInfo[];
      let contextObjectName: string | undefined;
      let contextObjectProperties: { name: string; type: string }[] | undefined;

      if (isContextObject && fn.parameters[0]) {
        const ctxParam = fn.parameters[0];
        contextObjectName = ctxParam.name;
        contextObjectProperties =
          this.parser.extractContextObjectProperties(ctxParam);
        dependencies = this.resolveDepsFromContextProperties(
          contextObjectProperties,
          tokens,
          pf.tokens.importMappings
        );
      } else {
        dependencies = this.resolveDeps(
          fn.parameters,
          tokens,
          pf.tokens.importMappings
        );
      }

      const token = instanceFactoryFor ?? fn.name;
      const importPath = this.toImportPath(fn.filePath);

      factories.push({
        name: fn.name,
        filePath: fn.filePath,
        dependencies,
        parameters: fn.parameters,
        returnType,
        importPath,
        scope,
        token,
        useContextObject: isContextObject,
        contextObjectName,
        contextObjectProperties,
        instanceFactoryFor,
      });
    }

    return factories;
  }

  private resolveDeps(
    params: RawParam[],
    tokens: TokenSet,
    importMappings: Map<string, string>
  ): DependencyInfo[] {
    const deps: DependencyInfo[] = [];
    for (const p of params) {
      if (
        ['string', 'number', 'boolean', 'Date', 'Object', 'Array'].includes(
          p.type
        )
      )
        continue;
      if (p.type.startsWith('{')) continue;

      const rawPath = importMappings.get(p.type);
      const isExternal = rawPath !== undefined && !rawPath.startsWith('.');
      if (
        tokens.interfaces.has(p.type) ||
        tokens.classNames.has(p.type) ||
        tokens.factoryNames.has(p.type) ||
        isExternal
      ) {
        deps.push({ name: p.type, importPath: rawPath ?? './' });
      }
    }
    return deps;
  }

  private resolveDepsFromContextProperties(
    props: { name: string; type: string }[],
    tokens: TokenSet,
    importMappings: Map<string, string>
  ): DependencyInfo[] {
    const deps: DependencyInfo[] = [];
    for (const prop of props) {
      if (
        ['string', 'number', 'boolean', 'Date', 'Object', 'Array'].includes(
          prop.type
        )
      )
        continue;

      const rawPath = importMappings.get(prop.type);
      const isExternal = rawPath !== undefined && !rawPath.startsWith('.');
      if (
        tokens.interfaces.has(prop.type) ||
        tokens.classNames.has(prop.type) ||
        tokens.factoryNames.has(prop.type) ||
        isExternal
      ) {
        deps.push({ name: prop.type, importPath: rawPath ?? './' });
      }
    }
    return deps;
  }

  private extractCoreInterfaceName(
    returnType: string,
    interfaces: Set<string>
  ): string | undefined {
    const t = returnType.trim();
    if (interfaces.has(t)) return t;

    const promiseMatch = t.match(/^Promise\s*<\s*([A-Za-z_][A-Za-z0-9_]*)\s*>$/);
    if (promiseMatch?.[1] && interfaces.has(promiseMatch[1]))
      return promiseMatch[1];

    const awaitedMatch = t.match(
      /^Awaited\s*<\s*(?:Promise\s*<\s*)?([A-Za-z_][A-Za-z0-9_]*)\s*>?\s*>$/
    );
    if (awaitedMatch?.[1] && interfaces.has(awaitedMatch[1]))
      return awaitedMatch[1];

    return undefined;
  }

  private toImportPath(filePath: string): string {
    return relative(this.sourceDir, filePath)
      .replace(/\.ts$/, '')
      .replace(/\\/g, '/');
  }
}
