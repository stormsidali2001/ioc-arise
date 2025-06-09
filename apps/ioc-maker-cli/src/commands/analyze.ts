import { Command } from 'commander';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { analyzeProject } from '../analyser';
import { detectCircularDependencies } from '../generator';

export const analyzeCommand = new Command('analyze')
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