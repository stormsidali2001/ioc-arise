import { readFileSync } from 'fs';
import { ts } from '@ast-grep/napi';
import { IoCConfig } from './configManager';
import { ErrorFactory } from '../errors/errorFactory';

/**
 * Parses a TypeScript config file (ioc.config.ts) and extracts the config object
 * from a defineConfig() call
 */
export class ConfigParser {
  /**
   * Parse ioc.config.ts file and extract config object
   */
  static parseConfigFile(filePath: string): IoCConfig {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const ast = ts.parse(content);
      const root = ast.root();

      // Try to find export default defineConfig({...})
      const defaultExport = this.findDefaultExport(root);
      if (defaultExport) {
        const config = this.extractConfigFromNode(defaultExport);
        if (config) {
          return config;
        }
      }

      // Try to find export const config = defineConfig({...})
      const namedExport = this.findNamedExport(root);
      if (namedExport) {
        const config = this.extractConfigFromNode(namedExport);
        if (config) {
          return config;
        }
      }

      throw ErrorFactory.configParseError(
        filePath,
        'Could not find defineConfig() call in config file'
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Could not find')) {
        throw error;
      }
      throw ErrorFactory.configParseError(
        filePath,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Find export default defineConfig({...})
   */
  private static findDefaultExport(root: any): any {
    try {
      // Find export default statements
      const exportDefaults = root.findAll({
        rule: {
          kind: 'export_statement'
        }
      });

      for (const exportStmt of exportDefaults) {
        const text = exportStmt.text();
        if (text.includes('export default') && text.includes('defineConfig')) {
          // Find call expressions within this export
          const callExprs = exportStmt.findAll({
            rule: {
              kind: 'call_expression'
            }
          });

          for (const callExpr of callExprs) {
            const callText = callExpr.text();
            if (callText.includes('defineConfig')) {
              // Get the arguments - should be an object literal
              const args = callExpr.findAll({
                rule: {
                  kind: 'object'
                }
              });

              if (args.length > 0) {
                return args[0];
              }
            }
          }
        }
      }
    } catch (error) {
      // Fallback: try text-based extraction
    }
    return null;
  }

  /**
   * Find export const config = defineConfig({...})
   */
  private static findNamedExport(root: any): any {
    try {
      // Find variable declarations that are exported
      const varDecls = root.findAll({
        rule: {
          kind: 'variable_declaration'
        }
      });

      for (const varDecl of varDecls) {
        // Check if it's exported and contains defineConfig
        const parent = varDecl.parent();
        if (parent) {
          const parentText = parent.text();
          if (parentText.includes('export') && varDecl.text().includes('defineConfig')) {
            // Find call expressions
            const callExprs = varDecl.findAll({
              rule: {
                kind: 'call_expression'
              }
            });

            for (const callExpr of callExprs) {
              const callText = callExpr.text();
              if (callText.includes('defineConfig')) {
                // Get the arguments - should be an object literal
                const args = callExpr.findAll({
                  rule: {
                    kind: 'object'
                  }
                });

                if (args.length > 0) {
                  return args[0];
                }
              }
            }
          }
        }
      }
    } catch (error) {
      // Fallback handling
    }
    return null;
  }

  /**
   * Extract config object from defineConfig() call node
   * The node should already be the argument to defineConfig
   */
  private static extractConfigFromNode(node: any): IoCConfig | null {
    try {
      // The node should be an object literal
      const kind = node.kind();
      if (kind === 'object' || node.text().trim().startsWith('{')) {
        return this.parseObjectLiteral(node);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Parse an object literal AST node into a JavaScript object
   */
  private static parseObjectLiteral(node: any): IoCConfig {
    const config: any = {};

    // Find all property assignments: key: value
    const properties = node.findAll({
      rule: {
        kind: 'pair'
      }
    });
    
    for (const prop of properties) {
      // Try to find key and value
      const keyMatches = prop.findAll({
        rule: {
          kind: 'property_key'
        }
      });
      const valueMatches = prop.findAll({
        rule: {
          kind: 'property_value'
        }
      });

      if (keyMatches.length === 0 || valueMatches.length === 0) continue;

      const keyNode = keyMatches[0];
      const valueNode = valueMatches[0];

      const key = this.extractStringValue(keyNode);
      if (!key) continue;

      const value = this.extractValue(valueNode);
      config[key] = value;
    }

    return config as IoCConfig;
  }

  /**
   * Extract value from an AST node (handles strings, numbers, booleans, arrays, objects)
   */
  private static extractValue(node: any): any {
    if (!node) return undefined;

    const kind = node.kind();
    const text = node.text().trim();

    // String literal
    if (kind === 'string' || text.startsWith('"') || text.startsWith("'") || text.startsWith('`')) {
      return this.extractStringValue(node);
    }

    // Number literal
    if (kind === 'number' || /^-?\d+\.?\d*$/.test(text)) {
      return parseFloat(text);
    }

    // Boolean literal
    if (text === 'true') return true;
    if (text === 'false') return false;

    // Array literal
    if (kind === 'array' || text.startsWith('[')) {
      return this.parseArrayLiteral(node);
    }

    // Object literal
    if (kind === 'object' || text.startsWith('{')) {
      return this.parseObjectLiteral(node);
    }

    // Template literal (for paths)
    if (kind === 'template_string' || text.startsWith('`')) {
      return this.extractStringValue(node);
    }

    // Undefined/null
    if (text === 'undefined') return undefined;
    if (text === 'null') return null;

    // Fallback: try to extract as string
    return this.extractStringValue(node);
  }

  /**
   * Extract string value from string literal node
   */
  private static extractStringValue(node: any): string | undefined {
    try {
      const text = node.text();
      // Remove quotes
      if ((text.startsWith('"') && text.endsWith('"')) ||
          (text.startsWith("'") && text.endsWith("'"))) {
        return text.slice(1, -1);
      }
      // Template literal
      if (text.startsWith('`') && text.endsWith('`')) {
        return text.slice(1, -1);
      }
      return text;
    } catch {
      return undefined;
    }
  }

  /**
   * Parse an array literal AST node into a JavaScript array
   */
  private static parseArrayLiteral(node: any): any[] {
    const array: any[] = [];

    // Find all array elements
    const elements = node.findAll({
      rule: {
        kind: 'array_element'
      }
    });
    
    for (const element of elements) {
      const value = this.extractValue(element);
      if (value !== undefined) {
        array.push(value);
      }
    }

    return array;
  }
}

