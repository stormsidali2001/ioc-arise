import { minimatch } from 'minimatch';
import { relative, normalize } from 'path';
import { ClassInfo, FactoryInfo, ValueInfo } from '../types';
import { ErrorFactory } from '../errors/errorFactory';
import { IoCError } from '../errors/IoCError';

export class ModuleResolver {
  private moduleConfig: Record<string, string[]>;
  private sourceDirectory: string;

  constructor(moduleConfig: Record<string, string[]>, sourceDirectory: string) {
    this.moduleConfig = moduleConfig;
    this.sourceDirectory = normalize(sourceDirectory);
  }

  /**
   * Determines which module a file belongs to based on its path
   * @param filePath - Absolute path to the file
   * @returns Module name or null if no match found
   */
  public getModuleForFile(filePath: string): string | null {
    const relativePath = this.normalizeFilePath(filePath);
    
    for (const [moduleName, patterns] of Object.entries(this.moduleConfig)) {
      for (const pattern of patterns) {
        if (this.matchesPattern(relativePath, pattern)) {
          return moduleName;
        }
      }
    }
    
    return null; // Will be assigned to CoreModule
  }

  /**
   * Groups classes by their assigned modules
   * @param classes - Array of ClassInfo objects
   * @returns Map of module names to their classes
   */
  public groupClassesByModule(classes: ClassInfo[]): Map<string, ClassInfo[]> {
    const moduleGroups = new Map<string, ClassInfo[]>();
    
    for (const classInfo of classes) {
      const moduleName = this.getModuleForFile(classInfo.filePath) || 'CoreModule';
      
      if (!moduleGroups.has(moduleName)) {
        moduleGroups.set(moduleName, []);
      }
      
      moduleGroups.get(moduleName)!.push(classInfo);
    }
    
    return moduleGroups;
  }

  /**
   * Groups factory functions by their assigned modules
   * @param factories - Array of FactoryInfo objects
   * @returns Map of module names to their factories
   */
  public groupFactoriesByModule(factories: FactoryInfo[]): Map<string, FactoryInfo[]> {
    const moduleGroups = new Map<string, FactoryInfo[]>();

    for (const factoryInfo of factories) {
      const moduleName = this.getModuleForFile(factoryInfo.filePath) || 'CoreModule';

      if (!moduleGroups.has(moduleName)) {
        moduleGroups.set(moduleName, []);
      }

      moduleGroups.get(moduleName)!.push(factoryInfo);
    }

    return moduleGroups;
  }

  /**
   * Groups values by their assigned modules
   * @param values - Array of ValueInfo objects
   * @returns Map of module names to their values
   */
  public groupValuesByModule(values: ValueInfo[]): Map<string, ValueInfo[]> {
    const moduleGroups = new Map<string, ValueInfo[]>();

    for (const valueInfo of values) {
      const moduleName = this.getModuleForFile(valueInfo.filePath) || 'CoreModule';

      if (!moduleGroups.has(moduleName)) {
        moduleGroups.set(moduleName, []);
      }

      moduleGroups.get(moduleName)!.push(valueInfo);
    }

    return moduleGroups;
  }

  /**
   * Checks if a file path matches a given pattern
   * @param filePath - Normalized relative file path
   * @param pattern - Pattern to match against
   * @returns True if the pattern matches
   */
  private matchesPattern(filePath: string, pattern: string): boolean {
    // Handle exact file matches
    if (pattern.endsWith('.ts') || pattern.endsWith('.js')) {
      return filePath === pattern || filePath.endsWith('/' + pattern);
    }
    
    // Handle folder patterns
    if (!pattern.includes('*') && !pattern.includes('?')) {
      // Exact folder match
      return filePath.startsWith(pattern + '/') || filePath === pattern;
    }
    
    // Handle glob patterns
    return minimatch(filePath, pattern, { matchBase: true });
  }

  /**
   * Converts absolute path to relative path from source directory
   * @param filePath - Absolute file path
   * @returns Normalized relative path
   */
  private normalizeFilePath(filePath: string): string {
    const relativePath = relative(this.sourceDirectory, filePath);
    return normalize(relativePath).replace(/\\/g, '/');
  }

  /**
   * Validates module configuration
   * @param moduleConfig - Module configuration to validate
   * @returns Array of validation errors
   */
  public static validateModuleConfig(moduleConfig: Record<string, string[]>): IoCError[] {
    const errors: IoCError[] = [];
    const allPatterns = new Set<string>();
    
    for (const [moduleName, patterns] of Object.entries(moduleConfig)) {
      // Validate module name
      if (!moduleName || typeof moduleName !== 'string') {
        errors.push(ErrorFactory.moduleConfigInvalid(moduleName, 'Invalid module name'));
        continue;
      }
      
      // Validate patterns
      if (!Array.isArray(patterns)) {
        errors.push(ErrorFactory.moduleConfigInvalid(moduleName, 'patterns must be an array'));
        continue;
      }
      
      for (const pattern of patterns) {
        if (typeof pattern !== 'string') {
          errors.push(ErrorFactory.moduleConfigInvalid(moduleName, `contains invalid pattern: ${pattern}`));
          continue;
        }
        
        // Check for duplicate patterns
        if (allPatterns.has(pattern)) {
          errors.push(ErrorFactory.modulePatternInvalid(pattern, moduleName));
        } else {
          allPatterns.add(pattern);
        }
      }
    }
    
    return errors;
  }
}