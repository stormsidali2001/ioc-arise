export interface IFileDiscovery {
  discover(sourceDir: string, excludePatterns?: string[]): Promise<string[]>;
}
