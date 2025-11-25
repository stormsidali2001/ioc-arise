import { Command } from 'commander';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { analyzeProject } from '../analyser';
import { CircularDependencyDetector } from '../utils/circular-dependency-detector';
import { ConsoleAnalysisRenderer } from '../renderer/console-analysis-renderer';
import type { RenderAnalysis, AnalysisResults } from '../renderer/render-analysis.interface';
import { ConfigManager } from '../utils/configManager';
import { ConfigValidator } from '../utils/configValidator';
import { ErrorFactory } from '../errors/errorFactory';
import { ErrorUtils } from '../errors/IoCError';

export const visualizeCommand = new Command('visualize')
  .description('Visualize project dependencies and analysis results')
  .option('-s, --source <dir>', 'Source directory to scan', 'src')
  .option('-i, --interface <pattern>', 'Interface name pattern to match (regex)')
  .option('-e, --exclude <patterns...>', 'Exclude patterns for files')
  .option('-r, --renderer <type>', 'Renderer type (console)', 'console')
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

      // Perform analysis
      const classes = await analyzeProject(sourceDir, {
        sourceDir,
        interfacePattern: mergedOptions.interface,
        excludePatterns: mergedOptions.exclude
      });

      if (classes.length === 0) {
        console.log('⚠️  No classes implementing interfaces found.');
        return;
      }

      // Detect circular dependencies
      const circularDependencies = CircularDependencyDetector.detect(classes);

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
      if (ErrorUtils.isIoCError(error)) {
        console.error(`❌ ${ErrorUtils.formatForConsole(error)}`);
      } else {
        const wrappedError = ErrorFactory.unexpectedError(error as Error);
        console.error(`❌ ${ErrorUtils.formatForConsole(wrappedError)}`);
      }
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