import { Command } from 'commander';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { analyzeProject } from '../analyser';
import { CircularDependencyDetector } from '../utils/circular-dependency-detector';
import { ConfigManager } from '../utils/configManager';
import { ConfigValidator } from '../utils/configValidator';
import { ErrorFactory } from '../errors/errorFactory';
import { ErrorUtils } from '../errors/IoCError';
import { Logger } from '../utils/logger';

export const analyzeCommand = new Command('analyze')
  .description('Analyze project and show detected classes without generating')
  .option('-s, --source <dir>', 'Source directory to scan', 'src')
  .option('-i, --interface <pattern>', 'Interface name pattern to match (regex)')
  .option('-e, --exclude <patterns...>', 'Exclude patterns for files')
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

      if (!existsSync(sourceDir)) {
        const error = ErrorFactory.sourceDirectoryNotFound(sourceDir);
        Logger.error(ErrorUtils.formatForConsole(error));
        process.exit(1);
      }

      if (configManager.hasConfigFile()) {
        Logger.info(`Using config file: ${configManager.getConfigPath()}`);
      }
      Logger.custom('🔍', `Analyzing directory: ${sourceDir}`, Logger.getColors().cyan + Logger.getColors().bright);

      const classes = await analyzeProject(sourceDir, {
        sourceDir,
        interfacePattern: mergedOptions.interface,
        excludePatterns: mergedOptions.exclude
      });

      if (classes.length === 0) {
        const error = ErrorFactory.noClassesFound(
          mergedOptions.interface || 'interfaces with "implements" keyword'
        );
        Logger.error(ErrorUtils.formatForConsole(error));
        process.exit(1);
        return;
      }

      Logger.newline();
      Logger.custom('📋', `Found ${classes.length} classes:`, Logger.getColors().blue + Logger.getColors().bright);
      Logger.newline();

      classes.forEach(cls => {
        Logger.custom('📦', cls.name, Logger.getColors().cyan + Logger.getColors().bright);
        Logger.log(Logger.colorizeText(`   File: ${cls.filePath}`, Logger.getColors().gray));
        if (cls.interfaceName) {
          Logger.log(Logger.colorizeText(`   Implements: ${cls.interfaceName}`, Logger.getColors().yellow));
        }
        if (cls.abstractClassName) {
          Logger.log(Logger.colorizeText(`   Extends: ${cls.abstractClassName} (abstract)`, Logger.getColors().magenta));
        }
        if (cls.dependencies.length > 0) {
          const deps = cls.dependencies.map(dep => dep.name).join(', ');
          Logger.log(Logger.colorizeText(`   Dependencies: ${deps}`, Logger.getColors().blue));
        } else {
          Logger.log(Logger.colorizeText(`   Dependencies: none`, Logger.getColors().gray));
        }
        Logger.newline();
      });

      // Check for circular dependencies
      const cycles = CircularDependencyDetector.detect(classes);
      if (cycles.length > 0) {
        Logger.warn('Circular dependencies detected:');
        cycles.forEach((cycle, index) => {
          Logger.log(Logger.colorizeText(`   ${index + 1}. ${cycle.join(' → ')}`, Logger.getColors().red));
        });
      } else {
        Logger.success('No circular dependencies found.');
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