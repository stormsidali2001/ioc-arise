import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { ErrorFactory, ErrorUtils } from '../errors/index.js';

export interface IoCConfig {
  source?: string;
  output?: string;
  interface?: string;
  exclude?: string[];
  checkCycles?: boolean;
  verbose?: boolean;
  modules?: Record<string, string[]>;
}

export class ConfigManager {
  private static readonly CONFIG_FILE_NAME = 'ioc.config.json';
  private config: IoCConfig = {};
  private configPath: string;

  constructor(sourceDir: string) {
    // Config file should be in the same directory as the source
    this.configPath = resolve(sourceDir, ConfigManager.CONFIG_FILE_NAME);
    this.loadConfig();
  }

  private loadConfig(): void {
    if (existsSync(this.configPath)) {
      try {
        const configContent = readFileSync(this.configPath, 'utf-8');
        this.config = JSON.parse(configContent);
      } catch (error) {
        if (error instanceof SyntaxError) {
          const parseError = ErrorFactory.configParseError(
            this.configPath,
            error.message
          );
          console.warn(`⚠️  Warning: ${ErrorUtils.formatForConsole(parseError)}`);
        } else {
          const readError = ErrorFactory.fileReadError(
            this.configPath,
            error instanceof Error ? error.message : String(error)
          );
          console.warn(`⚠️  Warning: ${ErrorUtils.formatForConsole(readError)}`);
        }
        console.warn('   Using default configuration.');
        this.config = {};
      }
    }
  }

  public getConfig(): IoCConfig {
    return { ...this.config };
  }

  public mergeWithCliOptions(cliOptions: any): IoCConfig {
    // CLI options take precedence over config file
    return {
      source: cliOptions.source || this.config.source || 'src',
      output: cliOptions.output || this.config.output || 'container.gen.ts',
      interface: cliOptions.interface || this.config.interface,
      exclude: cliOptions.exclude || this.config.exclude,
      checkCycles: cliOptions.checkCycles || this.config.checkCycles || false,
      verbose: cliOptions.verbose || this.config.verbose || false,
      modules: cliOptions.modules || this.config.modules
    };
  }

  public hasConfigFile(): boolean {
    return existsSync(this.configPath);
  }

  public getConfigPath(): string {
    return this.configPath;
  }
}