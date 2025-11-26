import { Command } from 'commander';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { analyzeProject, analyzeProjectWithFactories } from '../analyser';
import { IoCContainerGenerator } from '../generator';
import { CircularDependencyDetector } from '../utils/circular-dependency-detector';
import { ConfigManager } from '../utils/configManager';
import { ConfigValidator } from '../utils/configValidator';
import { ErrorFactory } from '../errors/errorFactory';
import { ErrorUtils } from '../errors/IoCError';
import { ModuleResolver } from '../utils/moduleResolver';
import { Logger } from '../utils/logger';
import { ClassInfo } from '../types';

export const generateCommand = new Command('generate')
  .description('Generate IoC container from TypeScript classes')
  .option('-s, --source <dir>', 'Source directory to scan', '.')
  .option('-o, --output <file>', 'Output file path', 'container.gen.ts')
  .option('-i, --interface <pattern>', 'Interface name pattern to match (regex)')
  .option('-e, --exclude <patterns...>', 'Exclude patterns for files')
  .option('--factory-pattern <pattern>', 'Factory function name pattern to match (regex). Default: functions with @factory JSDoc comment')
  .option('--value-pattern <pattern>', 'Value name pattern to match (regex). Default: values with @value JSDoc comment')
  .option('--check-cycles', 'Only check for circular dependencies without generating')
  .option('--verbose', 'Enable verbose logging')
  .action(async (options) => {
    try {
      // Initialize logger
      Logger.initialize({ verbose: options.verbose ?? false });

      // Initialize config manager with the source directory
      const initialSourceDir = resolve(options.source);
      const configManager = new ConfigManager(initialSourceDir);

      // Validate config if present
      if (configManager.hasConfigFile()) {
        const config = configManager.getConfig();
        if (!ConfigValidator.validateAndLog(config, configManager.getConfigPath())) {
          process.exit(1);
        }
      }

      // Merge CLI options with config file
      const mergedOptions = configManager.mergeWithCliOptions(options);

      const sourceDir = resolve(mergedOptions.source!);
      const outputPath = resolve(sourceDir, mergedOptions.output!);

      if (configManager.hasConfigFile() && mergedOptions.verbose) {
        Logger.info(`Using config file: ${configManager.getConfigPath()}`);
      }

      // Initialize module resolver if modules are configured
      let moduleResolver: ModuleResolver | null = null;
      if (mergedOptions.modules && Object.keys(mergedOptions.modules).length > 0) {
        moduleResolver = new ModuleResolver(mergedOptions.modules, sourceDir);
        if (mergedOptions.verbose) {
          Logger.info(`Module support enabled with ${Object.keys(mergedOptions.modules).length} modules`);
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
        if (mergedOptions.interface) {
          Logger.info(`Interface pattern: ${mergedOptions.interface}`);
        }
      }

      Logger.custom('🚀', 'Starting analysis...', Logger.getColors().cyan + Logger.getColors().bright);
      // Analyze the project (including factories)
      const { classes, factories, values } = await analyzeProjectWithFactories(sourceDir, {
        sourceDir,
        interfacePattern: mergedOptions.interface,
        excludePatterns: mergedOptions.exclude,
        factoryPattern: mergedOptions.factoryPattern,
        valuePattern: mergedOptions.valuePattern
      });

      // Check if we have anything to generate
      if (classes.length === 0 && (!factories || factories.length === 0) && (!values || values.length === 0)) {
        const error = ErrorFactory.noClassesFound(
          mergedOptions.interface || 'interfaces with "implements" keyword'
        );
        Logger.error(ErrorUtils.formatForConsole(error));
        Logger.error('No classes, factories, or values found to generate a container.');
        process.exit(1);
        return;
      }

      // Group classes by modules if module resolver is available
      let moduleGroupedClasses: Map<string, ClassInfo[]> | undefined;
      if (moduleResolver && classes.length > 0) {
        moduleGroupedClasses = moduleResolver.groupClassesByModule(classes);

        if (mergedOptions.verbose) {
          Logger.newline();
          Logger.custom('📋', `Found ${classes.length} classes organized into ${moduleGroupedClasses.size} modules:`);
          for (const [moduleName, moduleClasses] of moduleGroupedClasses) {
            Logger.log(`\n   📦 ${moduleName} (${moduleClasses.length} classes):`);
            moduleClasses.forEach(cls => {
              Logger.log(`      • ${cls.name} (${cls.dependencies.length} dependencies)`);
              if (cls.dependencies.length > 0) {
                Logger.log(`        Dependencies: ${cls.dependencies.map(dep => dep.name).join(', ')}`);
              }
            });
          }
        }
      } else {
        // Backward compatibility: single default module (only if we have classes)
        if (classes.length > 0) {
          moduleGroupedClasses = new Map([['CoreModule', classes]]);
        }

        if (mergedOptions.verbose) {
          if (classes.length > 0) {
            Logger.newline();
            Logger.custom('📋', `Found ${classes.length} classes:`);
            classes.forEach(cls => {
              Logger.log(`   • ${cls.name} (${cls.dependencies.length} dependencies)`);
              if (cls.dependencies.length > 0) {
                Logger.log(`     Dependencies: ${cls.dependencies.map(dep => dep.name).join(', ')}`);
              }
            });
          }
          if (factories && factories.length > 0) {
            Logger.newline();
            Logger.custom('🏭', `Found ${factories.length} factories:`);
            factories.forEach(factory => {
              Logger.log(`   • ${factory.name} (${factory.dependencies.length} dependencies)`);
            });
          }
          if (values && values.length > 0) {
            Logger.newline();
            Logger.custom('📦', `Found ${values.length} values:`);
            values.forEach(value => {
              Logger.log(`   • ${value.name}${value.interfaceName ? ` (${value.interfaceName})` : ''}`);
            });
          }
        }
      }

      // Check for circular dependencies between classes
      const cycles = CircularDependencyDetector.detect(classes);
      if (cycles.length > 0) {
        const firstCycle = cycles[0];
        if (firstCycle && firstCycle.length > 0) {
          const className = firstCycle[0] || 'unknown';
          const error = ErrorFactory.circularDependency(className, firstCycle);
          Logger.error(ErrorUtils.formatForConsole(error));

          if (cycles.length > 1) {
            Logger.log('\n   Additional cycles:');
            cycles.slice(1).forEach((cycle, index) => {
              Logger.log(`   ${index + 2}. ${cycle.join(' → ')}`);
            });
          }
        } else {
          Logger.error('Circular dependencies detected but cycle information is incomplete');
        }
        process.exit(1);
      }

      // Check for circular dependencies between modules
      if (moduleGroupedClasses && moduleGroupedClasses.size > 1 && classes.length > 0) {
        const moduleCycles = CircularDependencyDetector.detectModuleCycles(moduleGroupedClasses);
        if (moduleCycles.length > 0) {
          Logger.error('Circular dependencies detected between modules:');
          moduleCycles.forEach((cycle, index) => {
            if (cycle.length > 0) {
              // The cycle already includes the starting node at the end from TopologicalSorter
              const cycleDisplay = cycle.join(' → ');
              Logger.log(`   ${index + 1}. ${cycleDisplay}`);
            }
          });
          Logger.log('\n   Module dependencies must form a directed acyclic graph (DAG).');
          Logger.log('   Consider refactoring to break the circular dependency or merging the modules.');
          process.exit(1);
        }
      }

      if (mergedOptions.checkCycles) {
        Logger.success('No circular dependencies found (classes or modules).');
        process.exit(0);
        return;
      }

      // Generate container file
      Logger.custom('🚀', 'Generating container...', Logger.getColors().cyan + Logger.getColors().bright);
      IoCContainerGenerator.generate(classes, outputPath, moduleGroupedClasses, factories, values);

      Logger.success('Container generated successfully!');
      Logger.log(Logger.colorizeText(`   File: ${outputPath}`, Logger.getColors().gray));
      Logger.log(Logger.colorizeText(`   Classes: ${classes.length}`, Logger.getColors().gray));
      if (factories && factories.length > 0) {
        Logger.log(Logger.colorizeText(`   Factories: ${factories.length}`, Logger.getColors().gray));
      }
      if (values && values.length > 0) {
        Logger.log(Logger.colorizeText(`   Values: ${values.length}`, Logger.getColors().gray));
      }

      if (mergedOptions.verbose) {
        Logger.newline();
        Logger.custom('🎉', 'You can now import and use your container:', Logger.getColors().green + Logger.getColors().bright);
        Logger.log(Logger.colorizeText('   import { container } from "./container.gen";', Logger.getColors().gray));
        Logger.log(Logger.colorizeText('   // Usage examples:', Logger.getColors().gray));
        Logger.log(Logger.colorizeText('   // const userService = container.resolve(\'IUserService\');', Logger.getColors().gray));
      }

      process.exit(0);

    } catch (error) {
      if (ErrorUtils.isIoCError(error)) {
        Logger.error(ErrorUtils.formatForConsole(error));
      } else {
        const wrappedError = ErrorFactory.unexpectedError(error as Error);
        Logger.error(ErrorUtils.formatForConsole(wrappedError));
      }
      process.exit(1);
    }
  });