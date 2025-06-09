import { Command } from 'commander';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { analyzeProject } from '../analyser';
import { generateContainerFile, detectCircularDependencies } from '../generator';
import { ConfigManager } from '../utils/configManager';

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

      // Analyze the project
      const classes = await analyzeProject(sourceDir, {
        sourceDir,
        interfacePattern: mergedOptions.interface,
        excludePatterns: mergedOptions.exclude
      });

      console.log("Analysis results------------\n")
      console.dir(classes,{depth:5})
      console.log("Analysis results------------\n")

      if (classes.length === 0) {
        console.log('⚠️  No classes implementing interfaces found.');
        if (mergedOptions.interface) {
          console.log(`   Make sure classes implement interfaces matching pattern: ${mergedOptions.interface}`);
        } else {
          console.log('   Make sure classes implement interfaces using the "implements" keyword.');
        }
        return;
      }

      if (mergedOptions.verbose) {
        console.log(`\n📋 Found ${classes.length} classes:`);
        classes.forEach(cls => {
          console.log(`   • ${cls.name} (${cls.dependencies.length} dependencies)`);
          if (cls.dependencies.length > 0) {
            console.log(`     Dependencies: ${cls.dependencies.join(', ')}`);
          }
        });
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

      // Generate container file
      generateContainerFile(classes, outputPath);

      console.log(`✅ Container generated successfully!`);
      console.log(`   File: ${outputPath}`);
      console.log(`   Classes: ${classes.length}`);
      
      if (mergedOptions.verbose) {
        console.log('\n🎉 You can now import and use your container:');
        console.log('   import { container } from "./container.gen";');
        console.log('   const userService = container.userService;');
      }

    } catch (error) {
      console.error('❌ Error generating container:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });