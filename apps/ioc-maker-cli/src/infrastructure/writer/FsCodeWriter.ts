import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { ICodeWriter } from '../../application/ICodeWriter';

export class FsCodeWriter implements ICodeWriter {
  async write(filePath: string, content: string): Promise<void> {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, content);
  }
}
