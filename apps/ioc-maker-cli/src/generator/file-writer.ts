import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { ErrorFactory } from '../errors/index.js';

export class FileWriter {
  private outputPath: string;

  constructor(outputPath: string) {
    this.outputPath = outputPath;
  }

  writeContainer(content: string): void {
    try {
      // Ensure output directory exists
      const outputDir = dirname(this.outputPath);
      mkdirSync(outputDir, { recursive: true });

      // Write the container file
      writeFileSync(this.outputPath, content, 'utf-8');
    } catch (error) {
      throw ErrorFactory.fileWriteError(
        this.outputPath,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  getOutputPath(): string {
    return this.outputPath;
  }
}