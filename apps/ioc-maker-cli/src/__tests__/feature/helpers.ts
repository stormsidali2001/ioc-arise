import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { buildContainer } from '../../container';
import { ModuleResolver } from '../../utils/moduleResolver';
import { TsConfigPathsResolver } from '../../utils/tsConfigPathsResolver';
import type { ICodeWriter } from '../../application/ICodeWriter';
import type { ClassInfo, FactoryInfo, ValueInfo } from '../../domain/types';

export interface IoCConfig {
  source?: string;
  output?: string;
  interface?: string;
  factoryPattern?: string;
  valuePattern?: string;
  exclude?: string[];
  modules?: Record<string, string[]>;
}

function readConfig(exampleDir: string): IoCConfig {
  const configPath = join(exampleDir, 'ioc.config.json');
  if (!existsSync(configPath)) return {};
  return JSON.parse(readFileSync(configPath, 'utf8')) as IoCConfig;
}

/**
 * Runs the full generation pipeline for an example directory using an
 * in-memory writer. Returns a Map<absolutePath, fileContent> of every
 * file that would have been written to disk.
 *
 * Throws an IoCError (or plain Error) for any pipeline failure so tests
 * can assert on error cases without calling process.exit().
 */
export async function runExampleGenerate(
  exampleDir: string
): Promise<Map<string, string>> {
  const config = readConfig(exampleDir);

  const sourceDir = resolve(exampleDir, config.source ?? '.');
  const outputPath = resolve(exampleDir, config.output ?? 'container.gen.ts');

  const written = new Map<string, string>();
  const writer: ICodeWriter = {
    write: async (path, content) => {
      written.set(path, content);
    },
  };

  const services = buildContainer(
    sourceDir,
    config.interface,
    config.factoryPattern,
    config.valuePattern,
    writer
  );

  const { classes, factories, values } = await services.analyzeProject.execute({
    sourceDir,
    interfacePattern: config.interface,
    excludePatterns: config.exclude,
    factoryPattern: config.factoryPattern,
    valuePattern: config.valuePattern,
  });

  // Module grouping
  let moduleGroupedClasses: Map<string, ClassInfo[]> | undefined;
  let moduleGroupedFactories: Map<string, FactoryInfo[]> | undefined;
  let moduleGroupedValues: Map<string, ValueInfo[]> | undefined;
  const isModular =
    config.modules != null && Object.keys(config.modules).length > 0;

  if (isModular && config.modules) {
    const moduleResolver = new ModuleResolver(config.modules, sourceDir);
    if (classes.length > 0)
      moduleGroupedClasses = moduleResolver.groupClassesByModule(classes);
    if (factories.length > 0)
      moduleGroupedFactories = moduleResolver.groupFactoriesByModule(factories);
    if (values.length > 0)
      moduleGroupedValues = moduleResolver.groupValuesByModule(values);
  } else if (classes.length > 0) {
    moduleGroupedClasses = new Map([['CoreModule', classes]]);
  }

  // Class-level cycle detection
  const classCycles = services.detectCycles.detectClassCycles(classes);
  if (classCycles.length > 0) {
    const cycle = classCycles[0] ?? [];
    throw new Error(
      `Circular dependency detected: ${cycle.join(' → ')}`
    );
  }

  // Module-level cycle detection
  if (moduleGroupedClasses && moduleGroupedClasses.size > 1) {
    const moduleCycles =
      services.detectCycles.detectModuleCycles(moduleGroupedClasses);
    if (moduleCycles.length > 0) {
      const cycle = moduleCycles[0] ?? [];
      throw new Error(
        `Circular module dependency detected: ${cycle.join(' → ')}`
      );
    }
  }

  await services.generateContainer.execute({
    outputPath,
    classes,
    factories,
    values,
    moduleGroupedClasses,
    moduleGroupedFactories,
    moduleGroupedValues,
    isModular,
    pathsResolver: new TsConfigPathsResolver(sourceDir),
  });

  return written;
}

/**
 * Returns the absolute path to the examples directory.
 */
export function examplesDir(): string {
  return resolve(__dirname, '../../../examples');
}

/**
 * Reads a committed golden file and returns its content.
 */
export function readGolden(absolutePath: string): string {
  return readFileSync(absolutePath, 'utf8');
}
