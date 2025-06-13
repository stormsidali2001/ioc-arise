import { Command } from 'commander';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { analyzeProject } from '../analyser';
import { generateContainerFile, detectCircularDependencies } from '../generator';
import { ConfigManager } from '../utils/configManager';
import { ModuleResolver } from '../utils/moduleResolver';
import { initializeOneLogger ,logger} from '@notjustcoders/one-logger-client-sdk';

export const generateCommand = new Command('generate')
  .description('Generate IoC container from TypeScript classes')
  .option('-s, --source <dir>', 'Source directory to scan', 'src')
  .option('-o, --output <file>', 'Output file path', 'container.gen.ts')
  .option('-i, --interface <pattern>', 'Interface name pattern to match (regex)')
  .option('-e, --exclude <patterns...>', 'Exclude patterns for files')
  .option('--check-cycles', 'Only check for circular dependencies without generating')
  .option('--verbose', 'Enable verbose logging')
  .action(async (options) => {
    try {

await initializeOneLogger({
  name:"ioc-maker",
  description:"ioc-maker",
  tracer:{
    batchSize:1,
  },
  isDev:process.env.NODE_ENV === "development",


})
      // Initialize config manager with the source directory
      const initialSourceDir = resolve(options.source);
      const configManager = new ConfigManager(initialSourceDir);
      
      // Merge CLI options with config file
      const mergedOptions = configManager.mergeWithCliOptions(options);
      
      const sourceDir = resolve(mergedOptions.source!);
      const outputPath = resolve(sourceDir, mergedOptions.output!);
      
      if (configManager.hasConfigFile() && mergedOptions.verbose) {
        console.log(`📋 Using config file: ${configManager.getConfigPath()}`);
      }

      // Validate module configuration if present
      let moduleResolver: ModuleResolver | null = null;
      if (mergedOptions.modules && Object.keys(mergedOptions.modules).length > 0) {
        const validationErrors = ModuleResolver.validateModuleConfig(mergedOptions.modules);
        if (validationErrors.length > 0) {
          console.error('❌ Module configuration errors:');
          validationErrors.forEach(error => console.error(`   ${error}`));
          process.exit(1);
        }
        moduleResolver = new ModuleResolver(mergedOptions.modules, sourceDir);
        if (mergedOptions.verbose) {
          console.log(`🏗️  Module support enabled with ${Object.keys(mergedOptions.modules).length} modules`);
        }
      }

      if (!existsSync(sourceDir)) {
        console.error(`❌ Source directory does not exist: ${sourceDir}`);
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

      console.dir({classes},{depth:100})

      if (classes.length === 0) {
        console.log('⚠️  No classes implementing interfaces found.');
        if (mergedOptions.interface) {
          console.log(`   Make sure classes implement interfaces matching pattern: ${mergedOptions.interface}`);
        } else {
          console.log('   Make sure classes implement interfaces using the "implements" keyword.');
        }
        process.exit(-1)
        return;
      }

      // Group classes by modules if module resolver is available
      let moduleGroupedClasses: Map<string, any[]>;
      if (moduleResolver) {
        moduleGroupedClasses = moduleResolver.groupClassesByModule(classes);
        
        if (mergedOptions.verbose) {
          console.log(`\n📋 Found ${classes.length} classes organized into ${moduleGroupedClasses.size} modules:`);
          for (const [moduleName, moduleClasses] of moduleGroupedClasses) {
            console.log(`\n   📦 ${moduleName} (${moduleClasses.length} classes):`);
            moduleClasses.forEach(cls => {
              console.log(`      • ${cls.name} (${cls.dependencies.length} dependencies)`);
              if (cls.dependencies.length > 0) {
                console.log(`        Dependencies: ${cls.dependencies.join(', ')}`);
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
              console.log(`     Dependencies: ${cls.dependencies.join(', ')}`);
            }
          });
        }
      }

      // Check for circular dependencies
      const cycles = detectCircularDependencies(classes);
      if (cycles.length > 0) {
        console.error('❌ Circular dependencies detected:');
        cycles.forEach((cycle, index) => {
          console.error(`   ${index + 1}. ${cycle.join(' → ')}`);
        });
        process.exit(1);
      }

      if (mergedOptions.checkCycles) {
        console.log('✅ No circular dependencies found.');
        return;
      }

      console.log("Generating container: generateContainerFile------------------>")
      // Generate container file
        generateContainerFile(moduleGroupedClasses, outputPath);

      console.log(`✅ Container generated successfully!`);
      console.log(`   File: ${outputPath}`);
      console.log(`   Classes: ${classes.length}`);
      
      if (mergedOptions.verbose) {
        console.log('\n🎉 You can now import and use your container:');
        console.log('   import { container } from "./container.gen";');
        console.log('   const userService = container.userService;');
      }

      // Force process exit to prevent hanging due to one-logger SDK
      process.exit(0);

    } catch (error) {
      console.error('❌ Error generating container:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });