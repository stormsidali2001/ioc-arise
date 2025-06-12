import { GeneratorOptions, ClassInfo } from '../types';
import { FileWriter } from './file-writer';
import { ImportGenerator } from './import-generator';

/**
 * Abstract base class for container generators.
 * Defines the common interface and shared functionality.
 */
export abstract class BaseContainerGenerator {
  protected fileWriter: FileWriter;
  protected importGenerator: ImportGenerator;

  constructor(fileWriter: FileWriter, importGenerator: ImportGenerator) {
    this.fileWriter = fileWriter;
    this.importGenerator = importGenerator;
  }

  /**
   * Main entry point for generating the container.
   */
  abstract generate(): void;

  /**
   * Generates the complete container code.
   */
  protected abstract generateContainerCode(): string;

  /**
   * Utility method to convert strings to camelCase.
   */
  protected camelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Writes the generated container code to file.
   */
  protected writeContainer(containerCode: string): void {
    this.fileWriter.writeContainer(containerCode);
  }
}