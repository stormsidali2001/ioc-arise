/**
 * Responsible for aggregating module containers into a single container.
 */
export class ContainerAggregator {
  /**
   * Generates the aggregated container code.
   */
  generateAggregatedContainer(sortedModules: string[]): string {
    const moduleExports: string[] = [];
    
    for (const moduleName of sortedModules) {
      const moduleVarName = this.camelCase(moduleName) + 'Container';
      const moduleKey = this.camelCase(moduleName);
      moduleExports.push(`  ${moduleKey}: ${moduleVarName}`);
    }
    
    return `export const container = {\n${moduleExports.join(',\n')}\n};`;
  }

  /**
   * Generates the type export for the container.
   */
  generateModularTypeExport(): string {
    return 'export type Container = typeof container;';
  }

  /**
   * Utility method to convert strings to camelCase.
   */
  private camelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1).replace(/[^a-zA-Z0-9]/g, '');
  }
}