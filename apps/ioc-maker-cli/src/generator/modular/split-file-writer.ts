import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { ClassInfo } from '../../types';
import { ImportGenerator } from '../import-generator';
import { ModuleContainerFunctionGenerator } from './module-container-function-generator';
import { ModuleInstantiationGenerator } from './module-instantiation-generator';

/**
 * Handles writing split module files when there are more than 3 modules.
 * Each module gets its own <moduleName>.gen.ts file, plus a main container.gen.ts aggregator.
 */
export class SplitFileWriter {
  private outputPath: string;
  private outputDir: string;

  constructor(outputPath: string) {
    this.outputPath = outputPath;
    this.outputDir = dirname(outputPath);
  }

  /**
   * Writes split module files and main aggregator file.
   */
  writeSplitModules(
    moduleGroupedClasses: Map<string, ClassInfo[]>,
    sortedModules: string[],
    moduleDependencies: Map<string, Set<string>>,
    moduleContainerFunctionGenerator: ModuleContainerFunctionGenerator,
    moduleInstantiationGenerator: ModuleInstantiationGenerator,
    globalImportGenerator: ImportGenerator
  ): void {
    // Ensure output directory exists
    mkdirSync(this.outputDir, { recursive: true });

    // Write individual module files
    for (const moduleName of sortedModules) {
      const moduleClasses = moduleGroupedClasses.get(moduleName);
      if (!moduleClasses) continue;

      const moduleFilePath = join(this.outputDir, `${moduleName}.gen.ts`);
      const moduleContent = this.generateModuleFileContent(
        moduleName,
        moduleClasses,
        moduleDependencies,
        moduleContainerFunctionGenerator,
        moduleInstantiationGenerator,
        globalImportGenerator
      );
      
      writeFileSync(moduleFilePath, moduleContent, 'utf-8');
    }

    // Write main aggregator file
    const aggregatorContent = this.generateAggregatorFileContent(sortedModules, moduleDependencies);
    writeFileSync(this.outputPath, aggregatorContent, 'utf-8');
  }

  /**
   * Generates content for an individual module file.
   */
  private generateModuleFileContent(
    moduleName: string,
    moduleClasses: ClassInfo[],
    moduleDependencies: Map<string, Set<string>>,
    moduleContainerFunctionGenerator: ModuleContainerFunctionGenerator,
    moduleInstantiationGenerator: ModuleInstantiationGenerator,
    globalImportGenerator: ImportGenerator
  ): string {
    // Create a module-specific import generator
    const moduleImportGenerator = new ImportGenerator(moduleClasses);
    const moduleImports = moduleImportGenerator.generateImports();

    // Generate module container function
    const moduleContainerFunctions = moduleContainerFunctionGenerator.generateModuleContainerFunctions(
      [moduleName],
      moduleDependencies
    );

    // Generate module dependencies import statements
    const moduleDeps = moduleDependencies.get(moduleName) || new Set();
    const dependencyImports = this.generateDependencyImports(moduleDeps);

    // Generate module type definitions
    const moduleTypeExport = this.generateModuleTypeExport(moduleName);

    return [
      moduleImports,
      dependencyImports,
      '',
      moduleContainerFunctions.join('\n\n'),
      '',
      moduleTypeExport
    ].filter(line => line.trim() !== '').join('\n');
  }

  /**
   * Generates dependency import statements for a module.
   */
  private generateDependencyImports(moduleDeps: Set<string>): string {
    if (moduleDeps.size === 0) return '';

    const imports = Array.from(moduleDeps).map(depModule => 
      `import { create${depModule}Container } from './${depModule}.gen';`
    );

    return imports.join('\n');
  }

  /**
   * Generates type export for a module.
   */
  private generateModuleTypeExport(moduleName: string): string {
    const functionName = `create${moduleName}Container`;
    return `export { ${functionName} };
export type ${moduleName}Container = ReturnType<typeof ${functionName}>;`;
  }

  /**
   * Generates content for the main aggregator file.
   */
  private generateAggregatorFileContent(
    sortedModules: string[],
    moduleDependencies: Map<string, Set<string>>
  ): string {
    // Generate imports for all module files
    const moduleImports = sortedModules.map(moduleName => 
      `import { create${moduleName}Container } from './${moduleName}.gen';`
    ).join('\n');

    // Generate module instantiations in dependency order
    const moduleInstantiations = this.generateModuleInstantiationsForAggregator(
      sortedModules,
      moduleDependencies
    );

    // Generate aggregated container
    const aggregatedContainer = this.generateAggregatedContainerForSplit(sortedModules);

    // Generate type export
    const typeExport = 'export type Container = typeof container;';

    return [
      moduleImports,
      '',
      moduleInstantiations.join('\n'),
      '',
      aggregatedContainer,
      '',
      typeExport
    ].join('\n');
  }

  /**
   * Generates module instantiations for the aggregator file.
   */
  private generateModuleInstantiationsForAggregator(
    sortedModules: string[],
    moduleDependencies: Map<string, Set<string>>
  ): string[] {
    const instantiations: string[] = [];
    
    for (const moduleName of sortedModules) {
      const moduleDeps = moduleDependencies.get(moduleName) || new Set();
      const moduleVarName = this.toCamelCase(moduleName) + 'Container';
      const moduleFunctionName = `create${moduleName}Container`;
      
      const functionArgs = Array.from(moduleDeps).map(depModule => 
        this.toCamelCase(depModule) + 'Container'
      );
      
      const functionCall = functionArgs.length > 0 
        ? `${moduleFunctionName}(${functionArgs.join(', ')})`
        : `${moduleFunctionName}()`;
      
      instantiations.push(`const ${moduleVarName} = ${functionCall};`);
    }
    
    return instantiations;
  }

  /**
   * Generates the aggregated container for split files.
   */
  private generateAggregatedContainerForSplit(sortedModules: string[]): string {
    const moduleExports = sortedModules.map(moduleName => {
      const moduleVarName = this.toCamelCase(moduleName) + 'Container';
      const moduleKey = this.toCamelCase(moduleName);
      return `  ${moduleKey}: ${moduleVarName}`;
    });
    
    return `export const container = {\n${moduleExports.join(',\n')}\n};`;
  }

  /**
   * Converts a string to camelCase.
   */
  private toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1).replace(/[^a-zA-Z0-9]/g, '');
  }
}