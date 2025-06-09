import { AnalyzerOptions, ClassInfo } from '../types';
import { ClassAnalyzer } from './class-analyzer';
import { FileDiscovery } from './file-discovery';


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
