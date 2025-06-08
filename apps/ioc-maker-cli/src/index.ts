#!/usr/bin/env node

import { Command } from 'commander';
import { join, resolve } from 'path';
import { existsSync } from 'fs';
import { analyzeProject } from './analyzer';
import { generateContainerFile, detectCircularDependencies } from './generator';
import { ClassInfo } from './types';

const program = new Command();

program
  .name('ioc-maker')
  .description('Generate type-safe IoC containers for TypeScript projects')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate IoC container from TypeScript classes')
  .option('-s, --source <dir>', 'Source directory to scan', 'src')
  .option('-o, --output <file>', 'Output file path', 'container.gen.ts')
  .option('-i, --interface <pattern>', 'Interface name pattern to match (regex)')
  .option('-e, --exclude <patterns...>', 'Exclude patterns for files')
  .option('--check-cycles', 'Only check for circular dependencies without generating')
  .option('--verbose', 'Enable verbose logging')
  .action(async (options) => {
    try {
      const sourceDir = resolve(options.source);
      const outputPath = resolve(sourceDir, options.output);

      if (!existsSync(sourceDir)) {
        console.error(`❌ Source directory does not exist: ${sourceDir}`);
        process.exit(1);
      }

      if (options.verbose) {
        console.log(`🔍 Scanning directory: ${sourceDir}`);
        console.log(`📝 Output file: ${outputPath}`);
        if (options.interface) {
          console.log(`🎯 Interface pattern: ${options.interface}`);
        }
      }

      // Analyze the project
      const classes = await analyzeProject(sourceDir, {
        sourceDir,
        interfacePattern: options.interface,
        excludePatterns: options.exclude
      });

      console.log("Analysis results------------\n")
      console.dir(classes,{depth:5})
      console.log("Analysis results------------\n")

      if (classes.length === 0) {
        console.log('⚠️  No classes implementing interfaces found.');
        if (options.interface) {
          console.log(`   Make sure classes implement interfaces matching pattern: ${options.interface}`);
        } else {
          console.log('   Make sure classes implement interfaces using the "implements" keyword.');
        }
        return;
      }

      if (options.verbose) {
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

      if (options.checkCycles) {
        console.log('✅ No circular dependencies found.');
        return;
      }

      // Generate container file
      generateContainerFile(classes, outputPath);

      console.log(`✅ Container generated successfully!`);
      console.log(`   File: ${outputPath}`);
      console.log(`   Classes: ${classes.length}`);
      
      if (options.verbose) {
        console.log('\n🎉 You can now import and use your container:');
        console.log('   import { container } from "./container.gen";');
        console.log('   const userService = container.userService;');
      }

    } catch (error) {
      console.error('❌ Error generating container:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Analyze project and show detected classes without generating')
  .option('-s, --source <dir>', 'Source directory to scan', 'src')
  .option('-i, --interface <pattern>', 'Interface name pattern to match (regex)')
  .option('-e, --exclude <patterns...>', 'Exclude patterns for files')
  .action(async (options) => {
    try {
      const sourceDir = resolve(options.source);

      if (!existsSync(sourceDir)) {
        console.error(`❌ Source directory does not exist: ${sourceDir}`);
        process.exit(1);
      }

      console.log(`🔍 Analyzing directory: ${sourceDir}`);

      const classes = await analyzeProject(sourceDir, {
        sourceDir,
        interfacePattern: options.interface,
        excludePatterns: options.exclude
      });
      console.log("Analysis results------------\n")
      console.log(classes)
      console.log("Analysis results------------\n")
      if (classes.length === 0) {
        console.log('⚠️  No classes implementing interfaces found.');
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
          console.log(`   Dependencies: ${cls.dependencies.join(', ')}`);
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
      console.error('❌ Error analyzing project:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();

// If no command is provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}