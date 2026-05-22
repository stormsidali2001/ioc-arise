import { ClassInfo, FactoryInfo, ValueInfo, ParsedFile } from '../domain/types';
import { TsMorphTypeParser } from '../infrastructure/parser/TsMorphTypeParser';
import { ClassAnalyzer } from '../analysis/ClassAnalyzer';
import { FactoryAnalyzer } from '../analysis/FactoryAnalyzer';
import { ValueAnalyzer } from '../analysis/ValueAnalyzer';
import { IFileDiscovery } from './IFileDiscovery';
import { ErrorFactory } from '../errors/errorFactory';
import { ErrorUtils } from '../errors/IoCError';
import { Logger } from '../utils/logger';

export interface AnalyzeProjectOptions {
  sourceDir: string;
  interfacePattern?: string;
  excludePatterns?: string[];
  factoryPattern?: string;
  valuePattern?: string;
}

export interface AnalysisResult {
  classes: ClassInfo[];
  factories: FactoryInfo[];
  values: ValueInfo[];
}

export class AnalyzeProjectUseCase {
  constructor(
    private readonly fileDiscovery: IFileDiscovery,
    private readonly parser: TsMorphTypeParser,
    private readonly classAnalyzer: ClassAnalyzer,
    private readonly factoryAnalyzer: FactoryAnalyzer,
    private readonly valueAnalyzer: ValueAnalyzer
  ) {}

  async execute(options: AnalyzeProjectOptions): Promise<AnalysisResult> {
    const filePaths = await this.fileDiscovery.discover(
      options.sourceDir,
      options.excludePatterns
    );

    // Parse all files
    const parsedFiles: ParsedFile[] = [];
    for (const fp of filePaths) {
      try {
        parsedFiles.push(this.parser.parseFile(fp));
      } catch (err) {
        Logger.warn(`Warning: Could not parse ${fp}:`, { error: err });
      }
    }

    // Collect global token inventory from all parsed files
    const allInterfaces = new Set<string>();
    const allClassNames = new Set<string>();
    const allAbstractClasses = new Set<string>();

    for (const pf of parsedFiles) {
      pf.tokens.interfaces.forEach((i) => allInterfaces.add(i));
      pf.tokens.externalReExports.forEach((n) => allInterfaces.add(n));
      pf.tokens.classNames.forEach((n) => allClassNames.add(n));
      pf.tokens.abstractClassNames.forEach((n) => allAbstractClasses.add(n));

      // Type aliases that are self-mapped are valid DI tokens
      for (const [alias] of pf.tokens.typeAliases) {
        if (pf.tokens.typeAliases.get(alias) === alias) {
          allInterfaces.add(alias);
        }
      }
    }

    // Collect factory & value names (need second pass to know all of them)
    const allFactoryNames = new Set<string>();
    const allValueNames = new Set<string>();

    for (const pf of parsedFiles) {
      for (const fn of pf.functions) {
        if (!fn.isExported) continue;
        const matchesPattern = options.factoryPattern
          ? new RegExp(options.factoryPattern, 'i').test(fn.name)
          : false;
        const instanceFactoryFor = fn.returnType
          ? this.extractCoreInterfaceName(fn.returnType, allInterfaces)
          : undefined;
        if (fn.hasFactoryAnnotation || matchesPattern || instanceFactoryFor) {
          allFactoryNames.add(fn.name);
          if (instanceFactoryFor) allInterfaces.add(instanceFactoryFor);
        }
      }
      for (const v of pf.values) {
        const matchesPattern = options.valuePattern
          ? new RegExp(options.valuePattern, 'i').test(v.name)
          : false;
        if (v.hasValueAnnotation || matchesPattern) {
          allValueNames.add(v.name);
        }
      }
    }

    const tokens = {
      interfaces: allInterfaces,
      classNames: allClassNames,
      abstractClasses: allAbstractClasses,
      factoryNames: allFactoryNames,
      valueNames: allValueNames,
    };

    const classes = this.classAnalyzer.analyze(parsedFiles, tokens);
    const factories = this.factoryAnalyzer.analyze(parsedFiles, {
      interfaces: allInterfaces,
      classNames: allClassNames,
      factoryNames: allFactoryNames,
    });
    const values = this.valueAnalyzer.analyze(parsedFiles);

    this.validateUniqueInterfaceImplementations(classes);
    this.validateUniqueAbstractClassExtensions(classes);
    this.validateInstanceFactoryConflicts(classes, factories);

    return { classes, factories, values };
  }

  private extractCoreInterfaceName(
    returnType: string,
    interfaces: Set<string>
  ): string | undefined {
    const t = returnType.trim();
    if (interfaces.has(t)) return t;
    const pm = t.match(/^Promise\s*<\s*([A-Za-z_][A-Za-z0-9_]*)\s*>$/);
    if (pm?.[1] && interfaces.has(pm[1])) return pm[1];
    const am = t.match(
      /^Awaited\s*<\s*(?:Promise\s*<\s*)?([A-Za-z_][A-Za-z0-9_]*)\s*>?\s*>$/
    );
    if (am?.[1] && interfaces.has(am[1])) return am[1];
    return undefined;
  }

  private validateUniqueInterfaceImplementations(classes: ClassInfo[]): void {
    const map = new Map<string, ClassInfo[]>();
    for (const cls of classes) {
      if (!cls.interfaceName) continue;
      const bucket = map.get(cls.interfaceName) ?? [];
      bucket.push(cls);
      map.set(cls.interfaceName, bucket);
    }
    for (const [iface, bucket] of map) {
      if (bucket.length > 1) {
        const err = ErrorFactory.duplicateInterfaceImplementation(
          iface,
          bucket.map((c) => c.name)
        );
        Logger.error(ErrorUtils.formatForConsole(err));
        bucket.forEach((c) => Logger.log(`   • ${c.name} (${c.filePath})`));
        throw err;
      }
    }
  }

  private validateUniqueAbstractClassExtensions(classes: ClassInfo[]): void {
    const map = new Map<string, ClassInfo[]>();
    for (const cls of classes) {
      if (!cls.abstractClassName) continue;
      const bucket = map.get(cls.abstractClassName) ?? [];
      bucket.push(cls);
      map.set(cls.abstractClassName, bucket);
    }
    for (const [abstract, bucket] of map) {
      if (bucket.length > 1) {
        const err = ErrorFactory.duplicateAbstractClassExtension(
          abstract,
          bucket.map((c) => c.name)
        );
        Logger.error(ErrorUtils.formatForConsole(err));
        throw err;
      }
    }
  }

  private validateInstanceFactoryConflicts(
    classes: ClassInfo[],
    factories: FactoryInfo[]
  ): void {
    const map = new Map<string, string[]>();
    for (const cls of classes) {
      if (!cls.interfaceName) continue;
      const bucket = map.get(cls.interfaceName) ?? [];
      bucket.push(`class:${cls.name}`);
      map.set(cls.interfaceName, bucket);
    }
    for (const f of factories) {
      if (!f.instanceFactoryFor) continue;
      const bucket = map.get(f.instanceFactoryFor) ?? [];
      bucket.push(`factory:${f.name}`);
      map.set(f.instanceFactoryFor, bucket);
    }
    for (const [iface, providers] of map) {
      if (providers.length > 1) {
        Logger.error(
          `Multiple implementation providers found for interface '${iface}':`
        );
        providers.forEach((p) => Logger.log(`   • ${p}`));
        throw ErrorFactory.duplicateInterfaceImplementation(iface, providers);
      }
    }
  }
}
