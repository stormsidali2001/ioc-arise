import { relative } from 'path';
import {
  ClassInfo,
  DependencyInfo,
  ParsedFile,
  RawParam,
} from '../domain/types';

interface TokenSet {
  interfaces: Set<string>;
  classNames: Set<string>;
  abstractClasses: Set<string>;
  factoryNames: Set<string>;
  valueNames: Set<string>;
}

export class ClassAnalyzer {
  private sourceDir: string;
  private interfacePattern?: RegExp;

  constructor(sourceDir: string, interfacePattern?: string) {
    this.sourceDir = sourceDir;
    if (interfacePattern) {
      this.interfacePattern = new RegExp(interfacePattern);
    }
  }

  analyze(parsedFiles: ParsedFile[], tokens: TokenSet): ClassInfo[] {
    const all: ClassInfo[] = [];
    for (const pf of parsedFiles) {
      all.push(...this.analyzeFile(pf, tokens));
    }
    return all;
  }

  private analyzeFile(pf: ParsedFile, tokens: TokenSet): ClassInfo[] {
    const classes: ClassInfo[] = [];
    const processedNames = new Set<string>();

    // Classes implementing interfaces
    for (const raw of pf.classes) {
      if (!raw.implementsInterface) continue;
      if (raw.isAbstract) continue;

      const { interfaceName } = this.resolveInterface(
        raw.implementsInterface,
        pf.tokens.typeAliases,
        tokens.interfaces
      );
      if (!interfaceName) continue;

      if (this.interfacePattern && !this.interfacePattern.test(interfaceName))
        continue;

      processedNames.add(raw.name);
      classes.push({
        name: raw.name,
        filePath: raw.filePath,
        dependencies: this.resolveDependencies(
          raw.constructorParams,
          pf.tokens.typeAliases,
          pf.tokens.importMappings,
          tokens
        ),
        constructorParams: raw.constructorParams,
        interfaceName,
        abstractClassName: undefined,
        importPath: this.toImportPath(raw.filePath),
        scope: raw.jsDocScope ?? 'singleton',
      });
    }

    // Classes extending abstract classes
    for (const raw of pf.classes) {
      if (processedNames.has(raw.name)) continue;
      if (!raw.extendsClass) continue;
      if (raw.isAbstract) continue;
      if (!tokens.abstractClasses.has(raw.extendsClass)) continue;

      processedNames.add(raw.name);
      classes.push({
        name: raw.name,
        filePath: raw.filePath,
        dependencies: this.resolveDependencies(
          raw.constructorParams,
          pf.tokens.typeAliases,
          pf.tokens.importMappings,
          tokens
        ),
        constructorParams: raw.constructorParams,
        interfaceName: undefined,
        abstractClassName: raw.extendsClass,
        importPath: this.toImportPath(raw.filePath),
        scope: raw.jsDocScope ?? 'singleton',
      });
    }

    // Standalone classes (no interface, no abstract parent)
    for (const raw of pf.classes) {
      if (processedNames.has(raw.name)) continue;
      if (raw.isAbstract) continue;
      if (raw.implementsInterface || raw.extendsClass) continue;

      classes.push({
        name: raw.name,
        filePath: raw.filePath,
        dependencies: this.resolveDependencies(
          raw.constructorParams,
          pf.tokens.typeAliases,
          pf.tokens.importMappings,
          tokens
        ),
        constructorParams: raw.constructorParams,
        interfaceName: undefined,
        abstractClassName: undefined,
        importPath: this.toImportPath(raw.filePath),
        scope: raw.jsDocScope ?? 'singleton',
      });
    }

    return classes;
  }

  private resolveInterface(
    rawInterface: string,
    typeAliases: Map<string, string>,
    knownInterfaces: Set<string>
  ): { interfaceName?: string } {
    const resolved = typeAliases.get(rawInterface) ?? rawInterface;
    if (knownInterfaces.has(resolved)) return { interfaceName: resolved };
    return {};
  }

  private resolveDependencies(
    params: RawParam[],
    typeAliases: Map<string, string>,
    importMappings: Map<string, string>,
    tokens: TokenSet
  ): DependencyInfo[] {
    return params
      .map((p) => {
        const resolved = typeAliases.get(p.type) ?? p.type;
        return { originalType: p.type, resolvedType: resolved };
      })
      .filter(({ originalType, resolvedType }) => {
        if (tokens.interfaces.has(resolvedType)) return true;
        if (tokens.classNames.has(resolvedType)) return true;
        if (tokens.abstractClasses.has(resolvedType)) return true;
        if (tokens.factoryNames.has(resolvedType)) return true;
        if (tokens.valueNames.has(resolvedType)) return true;

        const rawPath =
          importMappings.get(originalType) ??
          importMappings.get(resolvedType);
        return rawPath !== undefined && !rawPath.startsWith('.');
      })
      .map(({ originalType, resolvedType }) => {
        const importPath =
          importMappings.get(originalType) ??
          importMappings.get(resolvedType) ??
          `./${resolvedType}`;
        return { name: resolvedType, importPath };
      });
  }

  private toImportPath(filePath: string): string {
    const rel = relative(this.sourceDir, filePath).replace(/\.ts$/, '');
    return `./${rel}`;
  }
}
