import { relative, dirname } from 'path';
import { ClassInfo, FactoryInfo, ValueInfo } from '../../domain/types';
import { TokenSets } from './RegistrationPlanner';

/**
 * Collects all import statements needed for a generated container file.
 * Returns a deduplicated, sorted import block string.
 */
export class ImportCollector {
  static collect(
    classes: ClassInfo[],
    outputPath: string,
    tokens: TokenSets,
    factories?: FactoryInfo[],
    values?: ValueInfo[],
    allProjectClasses: ClassInfo[] = []
  ): string {
    const outputDir = dirname(outputPath);
    const importMap = new Map<string, Set<string>>();

    const add = (filePath: string, name: string) => {
      let rel = relative(outputDir, filePath).replace(/\.ts$/, '');
      if (!rel.startsWith('.')) rel = `./${rel}`;
      rel = rel.replace(/\\/g, '/');
      if (!importMap.has(rel)) importMap.set(rel, new Set());
      importMap.get(rel)!.add(name);
    };

    classes.forEach((cls) => add(cls.filePath, cls.name));
    factories?.forEach((f) => add(f.filePath, f.name));
    values?.forEach((v) => add(v.filePath, v.name));

    // Dependencies that use constructor tokens (not string tokens)
    const registeredNames = new Set([
      ...classes.map((c) => c.name),
      ...(factories?.map((f) => f.name) ?? []),
      ...(values?.map((v) => v.name) ?? []),
    ]);

    [...classes, ...(factories ?? [])].forEach((entity) => {
      entity.dependencies.forEach((dep) => {
        if (
          registeredNames.has(dep.name) ||
          tokens.interfaceNames.has(dep.name) ||
          tokens.abstractClassNames.has(dep.name)
        )
          return;
        const depClass = allProjectClasses.find((c) => c.name === dep.name);
        if (depClass) add(depClass.filePath, depClass.name);
      });
    });

    return Array.from(importMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([path, names]) => {
        const sorted = Array.from(names).sort();
        return `import { ${sorted.join(', ')} } from '${path}';`;
      })
      .join('\n');
  }
}
