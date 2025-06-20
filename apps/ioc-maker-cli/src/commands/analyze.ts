import { Command } from 'commander';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { analyzeProject } from '../analyser';
import { detectCircularDependencies } from '../generator';
import { ConfigManager } from '../utils/configManager';
import { ConfigValidator } from '../utils/configValidator';
import { ErrorFactory, ErrorUtils } from '../errors/index.js';

export const analyzeCommand = new Command('analyze')
  .description('Analyze project and show detected classes without generating')
  .option('-s, --source <dir>', 'Source directory to scan', 'src')
  .option('-i, --interface <pattern>', 'Interface name pattern to match (regex)')
  .option('-e, --exclude <patterns...>', 'Exclude patterns for files')
  .action(async (options) => {
    try {
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
        console.error(`❌ ${ErrorUtils.formatForConsole(error)}`);
        process.exit(1);
      }

      if (configManager.hasConfigFile()) {
        console.log(`📋 Using config file: ${configManager.getConfigPath()}`);
      }
      console.log(`🔍 Analyzing directory: ${sourceDir}`);

      const classes = await analyzeProject(sourceDir, {
        sourceDir,
        interfacePattern: mergedOptions.interface,
        excludePatterns: mergedOptions.exclude
      });
      console.log("---------------------------------------")
      console.dir(classes,{depth:100})

      if (classes.length === 0) {
        const error = ErrorFactory.noClassesFound(
          mergedOptions.interface || 'interfaces with "implements" keyword'
        );
        console.error(`❌ ${ErrorUtils.formatForConsole(error)}`);
        process.exit(1);
        return;
      }

      console.log(`\n📋 Found ${classes.length} classes:\n`);
      
      classes.forEach(cls => {
        console.log(`📦 ${cls.name}`);
        console.log(`   File: ${cls.filePath}`);
        if (cls.interfaceName) {
          console.log(`   Implements: ${cls.interfaceName}`);
        }
        if (cls.dependencies.length > 0) {
          console.log(`   Dependencies: ${cls.dependencies.map(dep => dep.name).join(', ')}`);
        } else {
          console.log(`   Dependencies: none`);
        }
        console.log('');
      });

      // Check for circular dependencies
      const cycles = detectCircularDependencies(classes);
      if (cycles.length > 0) {
        console.log('⚠️  Circular dependencies detected:');
        cycles.forEach((cycle, index) => {
          console.log(`   ${index + 1}. ${cycle.join(' → ')}`);
        });
      } else {
        console.log('✅ No circular dependencies found.');
      }

    } catch (error) {
      if (ErrorUtils.isIoCError(error)) {
        console.error(`❌ ${ErrorUtils.formatForConsole(error)}`);
      } else {
        const wrappedError = ErrorFactory.unexpectedError(error as Error);
        console.error(`❌ ${ErrorUtils.formatForConsole(wrappedError)}`);
      }
      process.exit(1);
    }
  });