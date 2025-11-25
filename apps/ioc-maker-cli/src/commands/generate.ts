import { Command } from 'commander';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { analyzeProject } from '../analyser';
import { IoCContainerGenerator } from '../generator';
import { CircularDependencyDetector } from '../utils/circular-dependency-detector';
import { ConfigManager } from '../utils/configManager';
import { ConfigValidator } from '../utils/configValidator';
import { ErrorFactory } from '../errors/errorFactory';
import { ErrorUtils } from '../errors/IoCError';
import { ModuleResolver } from '../utils/moduleResolver';
import { initializeOneLogger, logger } from '@notjustcoders/one-logger-client-sdk';
import { DependencyInfo, ClassInfo } from '../types';

export const generateCommand = new Command('generate')
  .description('Generate IoC container from TypeScript classes')
  .option('-s, --source <dir>', 'Source directory to scan', '.')
  .option('-o, --output <file>', 'Output file path', 'container.gen.ts')
  .option('-i, --interface <pattern>', 'Interface name pattern to match (regex)')
  .option('-e, --exclude <patterns...>', 'Exclude patterns for files')
  .option('--check-cycles', 'Only check for circular dependencies without generating')
  .option('--verbose', 'Enable verbose logging')
  .action(async (options) => {
    try {

await initializeOneLogger({
        name: "ioc-maker",
        description: "ioc-maker",
        tracer: {
          batchSize: 1,
  },
        isDev: process.env.NODE_ENV === "development",


})
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
        console.log(`📋 Using config file: ${configManager.getConfigPath()}`);
      }

      // Initialize module resolver if modules are configured
      let moduleResolver: ModuleResolver | null = null;
      if (mergedOptions.modules && Object.keys(mergedOptions.modules).length > 0) {
        moduleResolver = new ModuleResolver(mergedOptions.modules, sourceDir);
        if (mergedOptions.verbose) {
          console.log(`🏗️  Module support enabled with ${Object.keys(mergedOptions.modules).length} modules`);
        }
      }

      if (!existsSync(sourceDir)) {
        const error = ErrorFactory.sourceDirectoryNotFound(sourceDir);
        console.error(`❌ ${ErrorUtils.formatForConsole(error)}`);
        process.exit(1);
      }

      if (mergedOptions.verbose) {
        console.log(`🔍 Scanning directory: ${sourceDir}`);
        console.log(`📝 Output file: ${outputPath}`);
        if (mergedOptions.interface) {
          console.log(`🎯 Interface pattern: ${mergedOptions.interface}`);
        }
      }

      console.log("🚀 Starting analysis...")
      // Analyze the project
      const classes = await analyzeProject(sourceDir, {
        sourceDir,
        interfacePattern: mergedOptions.interface,
        excludePatterns: mergedOptions.exclude
      });
      console.log("analysis results", classes)

      if (classes.length === 0) {
        const error = ErrorFactory.noClassesFound(
          mergedOptions.interface || 'interfaces with "implements" keyword'
        );
        console.error(`❌ ${ErrorUtils.formatForConsole(error)}`);
        process.exit(1);
        return;
      }

      // Group classes by modules if module resolver is available
      let moduleGroupedClasses: Map<string, ClassInfo[]>;
      if (moduleResolver) {
        moduleGroupedClasses = moduleResolver.groupClassesByModule(classes);
        
        if (mergedOptions.verbose) {
          console.log(`\n📋 Found ${classes.length} classes organized into ${moduleGroupedClasses.size} modules:`);
          for (const [moduleName, moduleClasses] of moduleGroupedClasses) {
            console.log(`\n   📦 ${moduleName} (${moduleClasses.length} classes):`);
            moduleClasses.forEach(cls => {
              console.log(`      • ${cls.name} (${cls.dependencies.length} dependencies)`);
              if (cls.dependencies.length > 0) {
                console.log(`        Dependencies: ${cls.dependencies.map(dep => dep.name).join(', ')}`);
              }
            });
          }
        }
      } else {
        // Backward compatibility: single default module
        moduleGroupedClasses = new Map([['CoreModule', classes]]);
        
        if (mergedOptions.verbose) {
          console.log(`\n📋 Found ${classes.length} classes:`);
          classes.forEach(cls => {
            console.log(`   • ${cls.name} (${cls.dependencies.length} dependencies)`);
            if (cls.dependencies.length > 0) {
              console.log(`     Dependencies: ${cls.dependencies.map(dep => dep.name).join(', ')}`);
            }
          });
        }
      }

      // Check for circular dependencies between classes
      const cycles = CircularDependencyDetector.detect(classes);
      if (cycles.length > 0) {
        const firstCycle = cycles[0];
        if (firstCycle && firstCycle.length > 0) {
          const className = firstCycle[0] || 'unknown';
          const error = ErrorFactory.circularDependency(className, firstCycle);
          console.error(`❌ ${ErrorUtils.formatForConsole(error)}`);
          
          if (cycles.length > 1) {
            console.error('\n   Additional cycles:');
            cycles.slice(1).forEach((cycle, index) => {
              console.error(`   ${index + 2}. ${cycle.join(' → ')}`);
            });
          }
        } else {
          console.error('❌ Circular dependencies detected but cycle information is incomplete');
        }
        process.exit(1);
      }

      // Check for circular dependencies between modules
      if (moduleGroupedClasses && moduleGroupedClasses.size > 1) {
        const moduleCycles = CircularDependencyDetector.detectModuleCycles(moduleGroupedClasses);
        if (moduleCycles.length > 0) {
          console.error(`❌ Circular dependencies detected between modules:`);
          moduleCycles.forEach((cycle, index) => {
            if (cycle.length > 0) {
              // The cycle already includes the starting node at the end from TopologicalSorter
              const cycleDisplay = cycle.join(' → ');
              console.error(`   ${index + 1}. ${cycleDisplay}`);
            }
          });
          console.error('\n   Module dependencies must form a directed acyclic graph (DAG).');
          console.error('   Consider refactoring to break the circular dependency or merging the modules.');
          process.exit(1);
        }
      }

      if (mergedOptions.checkCycles) {
        console.log('✅ No circular dependencies found (classes or modules).');
        return;
      }

      // Generate container file
      console.log(`🚀 Generating container using 'ioc-arise' runtime...`);
      IoCContainerGenerator.generate(classes, outputPath, moduleGroupedClasses);

      console.log(`✅ Container generated successfully!`);
      console.log(`   File: ${outputPath}`);
      console.log(`   Classes: ${classes.length}`);
      
      if (mergedOptions.verbose) {
        console.log('\n🎉 You can now import and use your container:');
        console.log('   import { container } from "./container.gen";');
        console.log('   // Usage examples:');
        console.log('   // const userService = container.resolve(UserService);');
      }

      // Force process exit to prevent hanging due to one-logger SDK
      process.exit(0);

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