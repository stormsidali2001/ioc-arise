import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export class FileWriter {
  private outputPath: string;

  constructor(outputPath: string) {
    this.outputPath = outputPath;
  }

  writeContainer(content: string): void {
    // Ensure output directory exists
    const outputDir = dirname(this.outputPath);
    mkdirSync(outputDir, { recursive: true });

    // Write the container file
    writeFileSync(this.outputPath, content, 'utf-8');
  }
}