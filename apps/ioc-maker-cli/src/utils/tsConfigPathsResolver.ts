import { existsSync, readFileSync } from 'fs';
import { resolve, dirname, join } from 'path';

export class TsConfigPathsResolver {
  private baseUrl: string | null = null;
  private paths: Record<string, string[]> = {};

  constructor(startDir: string) {
    const tsConfigPath = this.findTsConfig(resolve(startDir));
    if (tsConfigPath) {
      this.loadTsConfig(tsConfigPath);
    }
  }

  private findTsConfig(startDir: string): string | null {
    let dir = startDir;
    while (true) {
      const candidate = join(dir, 'tsconfig.json');
      if (existsSync(candidate)) return candidate;
      const parent = dirname(dir);
      if (parent === dir) return null; // reached filesystem root
      dir = parent;
    }
  }

  /**
   * Strips JSON comments while respecting string literals.
   * A simple regex is not safe here because tsconfig path patterns like
   * "@/*" contain "/*" which would be mis-detected as a block comment.
   */
  private stripJsonComments(raw: string): string {
    let result = '';
    let i = 0;
    while (i < raw.length) {
      const ch = raw[i];
      if (ch === '"') {
        // Consume the entire string literal verbatim
        result += ch;
        i++;
        while (i < raw.length) {
          const c = raw[i];
          if (c === '\\') {
            result += c + (raw[i + 1] ?? '');
            i += 2;
          } else {
            result += c;
            i++;
            if (c === '"') break;
          }
        }
      } else if (ch === '/' && raw[i + 1] === '/') {
        // Line comment — skip to end of line
        while (i < raw.length && raw[i] !== '\n') i++;
      } else if (ch === '/' && raw[i + 1] === '*') {
        // Block comment — skip to */
        i += 2;
        while (i < raw.length) {
          if (raw[i] === '*' && raw[i + 1] === '/') { i += 2; break; }
          i++;
        }
      } else {
        result += ch;
        i++;
      }
    }
    return result;
  }

  private loadTsConfig(tsConfigPath: string): void {
    try {
      const raw = readFileSync(tsConfigPath, 'utf-8');
      const stripped = this.stripJsonComments(raw)
        // Strip trailing commas before } or ]
        .replace(/,(\s*[}\]])/g, '$1');

      const config = JSON.parse(stripped);
      const co = config.compilerOptions ?? {};

      if (!co.paths) return;

      this.baseUrl = co.baseUrl
        ? resolve(dirname(tsConfigPath), co.baseUrl)
        : dirname(tsConfigPath);

      this.paths = co.paths;
    } catch {
      // Silently ignore unparseable tsconfig
    }
  }

  /**
   * Resolves a path-alias import to an absolute filesystem path.
   * Returns null if the import is a regular relative import or no alias matches.
   */
  public resolveImportToAbsolute(importPath: string): string | null {
    if (!this.baseUrl || !importPath || importPath.startsWith('.')) return null;

    for (const [pattern, targets] of Object.entries(this.paths)) {
      for (const target of targets) {
        const resolved = this.tryMatch(importPath, pattern, target);
        if (resolved) return resolved;
      }
    }
    return null;
  }

  private tryMatch(importPath: string, pattern: string, target: string): string | null {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      if (!importPath.startsWith(prefix + '/')) return null;
      const rest = importPath.slice(prefix.length + 1);
      const targetBase = target.endsWith('/*') ? target.slice(0, -2) : target;
      return this.findFile(join(this.baseUrl!, targetBase, rest));
    }

    // Exact pattern match
    if (importPath !== pattern) return null;
    return this.findFile(join(this.baseUrl!, target));
  }

  private findFile(basePath: string): string | null {
    const candidates = [basePath, basePath + '.ts', join(basePath, 'index.ts')];
    for (const c of candidates) {
      if (existsSync(c)) return c;
    }
    return null;
  }

  public hasPathAliases(): boolean {
    return this.baseUrl !== null && Object.keys(this.paths).length > 0;
  }
}
