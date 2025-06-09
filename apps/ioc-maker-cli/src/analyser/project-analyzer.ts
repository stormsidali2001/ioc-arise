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
    
    const fileAnalysisPromises = tsFiles.map(filePath => 
      this.classAnalyzer.analyzeFile(filePath)
    );
    
    const fileClassesArrays = await Promise.all(fileAnalysisPromises);
    const classes = fileClassesArrays.flat();

    return classes;
  }
}
