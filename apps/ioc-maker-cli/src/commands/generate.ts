import { Command } from 'commander';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { ConfigManager } from '../utils/configManager';
import { ConfigValidator } from '../utils/configValidator';
import { ErrorFactory } from '../errors/errorFactory';
import { ErrorUtils } from '../errors/IoCError';
import { ModuleResolver } from '../utils/moduleResolver';
import { TsConfigPathsResolver } from '../utils/tsConfigPathsResolver';
import { Logger } from '../utils/logger';
import { ClassInfo, FactoryInfo, ValueInfo } from '../domain/types';
import { buildContainer } from '../container';

export const generateCommand = new Command('generate')
  .description('Generate IoC container from TypeScript classes')
  .option('-s, --source <dir>', 'Source directory to scan')
  .option('-o, --output <file>', 'Output file path')
  .option('-i, --interface <pattern>', 'Interface name pattern to match (regex)')
  .option('-e, --exclude <patterns...>', 'Exclude patterns for files')
  .option(
    '--factory-pattern <pattern>',
    'Factory function name pattern to match (regex). Default: functions with @factory JSDoc comment'
  )
  .option(
    '--value-pattern <pattern>',
    'Value name pattern to match (regex). Default: values with @value JSDoc comment'
  )
  .option('--check-cycles', 'Only check for circular dependencies without generating')
  .option('--no-validate', 'Disable validation of generated code')
  .option('--verbose', 'Enable verbose logging')
  .action(async (options) => {
    try {
      Logger.initialize({ verbose: options.verbose ?? false });

      const initialSourceDir = resolve(options.source || '.');
      const configManager = new ConfigManager(initialSourceDir);

      if (configManager.hasConfigFile()) {
        const config = configManager.getConfig();
        if (!ConfigValidator.validateAndLog(config, configManager.getConfigPath())) {
          process.exit(1);
        }
      }

      const mergedOptions = configManager.mergeWithCliOptions(options);
      const sourceDir = resolve(mergedOptions.source!);
      const outputPath = resolve(initialSourceDir, mergedOptions.output!);

      if (configManager.hasConfigFile() && mergedOptions.verbose) {
        Logger.info(`Using config file: ${configManager.getConfigPath()}`);
      }

      let moduleResolver: ModuleResolver | null = null;
      if (mergedOptions.modules && Object.keys(mergedOptions.modules).length > 0) {
        moduleResolver = new ModuleResolver(mergedOptions.modules, sourceDir);
        if (mergedOptions.verbose) {
          Logger.info(
            `Module support enabled with ${Object.keys(mergedOptions.modules).length} modules`
          );
        }
      }

      if (!existsSync(sourceDir)) {
        const error = ErrorFactory.sourceDirectoryNotFound(sourceDir);
        Logger.error(ErrorUtils.formatForConsole(error));
        process.exit(1);
      }

      if (mergedOptions.verbose) {
        Logger.info(`Scanning directory: ${sourceDir}`);
        Logger.info(`Output file: ${outputPath}`);
        if (mergedOptions.interface) Logger.info(`Interface pattern: ${mergedOptions.interface}`);
      }

      Logger.custom('🚀', 'Starting analysis...', Logger.getColors().cyan + Logger.getColors().bright);

      const services = buildContainer(
        sourceDir,
        mergedOptions.interface,
        mergedOptions.factoryPattern,
        mergedOptions.valuePattern
      );

      const { classes, factories, values } = await services.analyzeProject.execute({
        sourceDir,
        interfacePattern: mergedOptions.interface,
        excludePatterns: mergedOptions.exclude,
        factoryPattern: mergedOptions.factoryPattern,
        valuePattern: mergedOptions.valuePattern,
      });

      if (
        classes.length === 0 &&
        (!factories || factories.length === 0) &&
        (!values || values.length === 0)
      ) {
        const error = ErrorFactory.noClassesFound(
          mergedOptions.interface || 'interfaces with "implements" keyword'
        );
        Logger.error(ErrorUtils.formatForConsole(error));
        Logger.error('No classes, factories, or values found to generate a container.');
        process.exit(1);
      }

      // Group by module
      let moduleGroupedClasses: Map<string, ClassInfo[]> | undefined;
      let moduleGroupedFactories: Map<string, FactoryInfo[]> | undefined;
      let moduleGroupedValues: Map<string, ValueInfo[]> | undefined;

      if (moduleResolver) {
        if (classes.length > 0) moduleGroupedClasses = moduleResolver.groupClassesByModule(classes);
        if (factories && factories.length > 0)
          moduleGroupedFactories = moduleResolver.groupFactoriesByModule(factories);
        if (values && values.length > 0)
          moduleGroupedValues = moduleResolver.groupValuesByModule(values);
      } else if (classes.length > 0) {
        moduleGroupedClasses = new Map([['CoreModule', classes]]);
      }

      Logger.newline();
      printAnalysisSummary(
        moduleResolver !== null,
        moduleGroupedClasses,
        moduleGroupedFactories,
        moduleGroupedValues,
        classes,
        factories,
        values,
        mergedOptions.verbose ?? false
      );
      Logger.newline();

      // Detect cycles
      const cycles = services.detectCycles.detectClassCycles(classes);
      if (cycles.length > 0) {
        const firstCycle = cycles[0];
        if (firstCycle && firstCycle.length > 0) {
          const className = firstCycle[0] ?? 'unknown';
          const error = ErrorFactory.circularDependency(className, firstCycle);
          Logger.error(ErrorUtils.formatForConsole(error));
          if (cycles.length > 1) {
            Logger.log('\n   Additional cycles:');
            cycles.slice(1).forEach((cycle, i) => {
              Logger.log(`   ${i + 2}. ${cycle.join(' → ')}`);
            });
          }
        } else {
          Logger.error('Circular dependencies detected but cycle information is incomplete');
        }
        process.exit(1);
      }

      if (moduleGroupedClasses && moduleGroupedClasses.size > 1 && classes.length > 0) {
        const moduleCycles = services.detectCycles.detectModuleCycles(moduleGroupedClasses);
        if (moduleCycles.length > 0) {
          Logger.error('Circular dependencies detected between modules:');
          moduleCycles.forEach((cycle, i) => {
            if (cycle.length > 0) Logger.log(`   ${i + 1}. ${cycle.join(' → ')}`);
          });
          Logger.log('\n   Module dependencies must form a directed acyclic graph (DAG).');
          Logger.log('   Consider refactoring to break the circular dependency or merging the modules.');
          process.exit(1);
        }
      }

      if (mergedOptions.checkCycles) {
        Logger.success('No circular dependencies found (classes or modules).');
        process.exit(0);
      }

      Logger.custom('🚀', 'Generating container...', Logger.getColors().cyan + Logger.getColors().bright);

      const pathsResolver = new TsConfigPathsResolver(sourceDir);
      const generatedFiles = await services.generateContainer.execute({
        outputPath,
        classes,
        factories,
        values,
        moduleGroupedClasses,
        moduleGroupedFactories,
        moduleGroupedValues,
        isModular: moduleResolver !== null,
        pathsResolver,
      });

      // Validate
      if (mergedOptions.validate !== false) {
        try {
          services.validateOutput.validate(generatedFiles, sourceDir);
        } catch {
          Logger.error('Validation failed. Generated code may be invalid.');
        }
      }

      const statParts: string[] = [];
      if (classes.length > 0) statParts.push(`${classes.length} class${classes.length !== 1 ? 'es' : ''}`);
      if (factories && factories.length > 0)
        statParts.push(`${factories.length} factor${factories.length !== 1 ? 'ies' : 'y'}`);
      if (values && values.length > 0)
        statParts.push(`${values.length} value${values.length !== 1 ? 's' : ''}`);
      if (moduleResolver) {
        const moduleCount = new Set([
          ...(moduleGroupedClasses?.keys() ?? []),
          ...(moduleGroupedFactories?.keys() ?? []),
          ...(moduleGroupedValues?.keys() ?? []),
        ]).size;
        statParts.unshift(`${moduleCount} module${moduleCount !== 1 ? 's' : ''}`);
      }

      Logger.success('Container generated successfully!');
      Logger.log(Logger.colorizeText(`   📁 ${outputPath}`, Logger.getColors().gray));
      Logger.log(Logger.colorizeText(`   ${statParts.join(' · ')}`, Logger.getColors().gray));

      process.exit(0);
    } catch (error) {
      if (ErrorUtils.isIoCError(error)) {
        Logger.error(ErrorUtils.formatForConsole(error));
      } else {
        const wrapped = ErrorFactory.unexpectedError(error as Error);
        Logger.error(ErrorUtils.formatForConsole(wrapped));
      }
      process.exit(1);
    }
  });

function printAnalysisSummary(
  isModular: boolean,
  moduleGroupedClasses: Map<string, ClassInfo[]> | undefined,
  moduleGroupedFactories: Map<string, FactoryInfo[]> | undefined,
  moduleGroupedValues: Map<string, ValueInfo[]> | undefined,
  classes: ClassInfo[],
  factories: FactoryInfo[] | undefined,
  values: ValueInfo[] | undefined,
  _verbose: boolean
): void {
  const c = Logger.getColors();

  const printClass = (cls: ClassInfo, indent: string) => {
    const name = Logger.colorizeText(`${indent}🏗️  ${cls.name}`, c.white);
    if (cls.interfaceName) {
      Logger.log(
        name +
          Logger.colorizeText(' ──implements──▶ ', c.gray) +
          Logger.colorizeText(cls.interfaceName, c.green)
      );
    } else if (cls.abstractClassName) {
      Logger.log(
        name +
          Logger.colorizeText(' ──extends──▶ ', c.gray) +
          Logger.colorizeText(cls.abstractClassName, c.green)
      );
    } else {
      Logger.log(name);
    }
    if (cls.dependencies.length > 0) {
      const deps = cls.dependencies.map((d) => d.name).join(', ');
      Logger.log(
        Logger.colorizeText(`${indent}   deps: `, c.gray) +
          Logger.colorizeText(deps, c.yellow)
      );
    }
  };

  const printFactory = (factory: FactoryInfo, indent: string) => {
    if (factory.instanceFactoryFor) {
      Logger.log(
        Logger.colorizeText(`${indent}🔌 ${factory.name}()`, c.white) +
          Logger.colorizeText(' ──returns──▶ ', c.gray) +
          Logger.colorizeText(factory.instanceFactoryFor, c.green)
      );
    } else {
      const token = factory.token ?? factory.name;
      Logger.log(
        Logger.colorizeText(`${indent}🏭 ${factory.name}()`, c.white) +
          Logger.colorizeText(' ──factory──▶ ', c.gray) +
          Logger.colorizeText(`'${token}'`, c.magenta)
      );
    }
    if (factory.dependencies.length > 0) {
      const deps = factory.dependencies.map((d) => d.name).join(', ');
      Logger.log(
        Logger.colorizeText(`${indent}   deps: `, c.gray) +
          Logger.colorizeText(deps, c.yellow)
      );
    }
  };

  const printValue = (value: ValueInfo, indent: string) => {
    const label = value.interfaceName ?? value.token ?? value.name;
    Logger.log(
      Logger.colorizeText(`${indent}💎 ${value.name}`, c.white) +
        Logger.colorizeText(' ──value──▶ ', c.gray) +
        Logger.colorizeText(label, c.green)
    );
  };

  if (isModular) {
    const allModuleNames = new Set<string>([
      ...(moduleGroupedClasses?.keys() ?? []),
      ...(moduleGroupedFactories?.keys() ?? []),
      ...(moduleGroupedValues?.keys() ?? []),
    ]);
    for (const moduleName of allModuleNames) {
      Logger.log(Logger.colorizeText(`📦 ${moduleName}`, c.cyan + c.bright));
      for (const cls of moduleGroupedClasses?.get(moduleName) ?? []) printClass(cls, '   ');
      for (const f of moduleGroupedFactories?.get(moduleName) ?? []) printFactory(f, '   ');
      for (const v of moduleGroupedValues?.get(moduleName) ?? []) printValue(v, '   ');
    }
  } else {
    for (const cls of classes) printClass(cls, '   ');
    for (const f of factories ?? []) printFactory(f, '   ');
    for (const v of values ?? []) printValue(v, '   ');
  }
}
