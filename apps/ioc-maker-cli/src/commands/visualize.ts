import { Command } from 'commander';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { analyzeProject } from '../analyser';
import { detectCircularDependencies } from '../generator';
import { ConsoleAnalysisRenderer } from '../renderer/console-analysis-renderer';
import type { RenderAnalysis, AnalysisResults } from '../renderer/render-analysis.interface';

export const visualizeCommand = new Command('visualize')
  .description('Visualize project dependencies and analysis results')
  .option('-s, --source <dir>', 'Source directory to scan', 'src')
  .option('-i, --interface <pattern>', 'Interface name pattern to match (regex)')
  .option('-e, --exclude <patterns...>', 'Exclude patterns for files')
  .option('-r, --renderer <type>', 'Renderer type (console)', 'console')
  .action(async (options) => {
    try {
      const sourceDir = resolve(options.source);

      if (!existsSync(sourceDir)) {
        console.error(`❌ Source directory does not exist: ${sourceDir}`);
        process.exit(1);
      }

      console.log(`🔍 Analyzing directory: ${sourceDir}`);

      // Perform analysis
      const classes = await analyzeProject(sourceDir, {
        sourceDir,
        interfacePattern: options.interface,
        excludePatterns: options.exclude
      });

      if (classes.length === 0) {
        console.log('⚠️  No classes implementing interfaces found.');
        return;
      }

      // Detect circular dependencies
      const circularDependencies = detectCircularDependencies(classes);

      // Prepare analysis results
      const analysisResults: AnalysisResults = {
        classes,
        circularDependencies
      };

      // Create renderer based on options
      const renderer = createRenderer(options.renderer);
      
      // Render the analysis results
      renderer.render(analysisResults);

    } catch (error) {
      console.error('❌ Error visualizing project:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

function createRenderer(rendererType: string): RenderAnalysis {
  switch (rendererType.toLowerCase()) {
    case 'console':
      return new ConsoleAnalysisRenderer();
    default:
      console.warn(`⚠️  Unknown renderer type: ${rendererType}. Falling back to console renderer.`);
      return new ConsoleAnalysisRenderer();
  }
}