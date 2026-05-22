import { glob } from 'glob';
import { join } from 'path';
import { IFileDiscovery } from '../../application/IFileDiscovery';

export class GlobFileDiscovery implements IFileDiscovery {
  async discover(sourceDir: string, excludePatterns: string[] = []): Promise<string[]> {
    const files = await glob(join(sourceDir, '**/*.ts'), {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        ...excludePatterns,
      ],
    });
    return files.sort();
  }
}
