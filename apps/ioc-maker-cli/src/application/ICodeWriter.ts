export interface ICodeWriter {
  write(filePath: string, content: string): Promise<void>;
}
