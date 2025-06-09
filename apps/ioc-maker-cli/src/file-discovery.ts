import { glob } from 'glob';
import { join } from 'path';

export class FileDiscovery {
  private sourceDir: string;
  private excludePatterns: string[];

  constructor(sourceDir: string, excludePatterns: string[] = []) {
    this.sourceDir = sourceDir;
    this.excludePatterns = excludePatterns;
  }

  async findTypeScriptFiles(): Promise<string[]> {
    const pattern = join(this.sourceDir, '**/*.ts');
    const files = await glob(pattern, {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        ...this.excludePatterns
      ]
    });
    return files;
  }
}