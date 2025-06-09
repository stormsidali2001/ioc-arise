import { ClassInfo, AnalyzerOptions } from '../types';
import { FileDiscovery } from './file-discovery';
import { ClassAnalyzer } from './class-analyzer';

export class ProjectAnalyzer {
  private fileDiscovery: FileDiscovery;
  private classAnalyzer: ClassAnalyzer;

  constructor(options: AnalyzerOptions) {
    this.fileDiscovery = new FileDiscovery(options.sourceDir, options.excludePatterns);
    this.classAnalyzer = new ClassAnalyzer(options.sourceDir, options.interfacePattern);
  }

  async analyzeProject(): Promise<ClassInfo[]> {
    const tsFiles = await this.fileDiscovery.findTypeScriptFiles();
    const classes: ClassInfo[] = [];

    for (const filePath of tsFiles) {
      const fileClasses = await this.classAnalyzer.analyzeFile(filePath);
      classes.push(...fileClasses);
    }

    return classes;
  }
}

export async function analyzeProject(sourceDir: string, options?: Partial<AnalyzerOptions>): Promise<ClassInfo[]> {
  const analyzer = new ProjectAnalyzer({
    sourceDir,
    ...options
  });
  
  return analyzer.analyzeProject();
}