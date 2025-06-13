/**
 * Responsible for aggregating module containers into a single container.
 */
import { InstantiationUtils } from '../shared';

export class ContainerAggregator {
  /**
   * Generates the aggregated container code.
   */
  generateAggregatedContainer(sortedModules: string[]): string {
    return InstantiationUtils.generateAggregatedContainer(sortedModules);
  }

  /**
   * Generates the type export for the container.
   */
  generateModularTypeExport(): string {
    return InstantiationUtils.generateModularContainerTypeExport();
  }
}