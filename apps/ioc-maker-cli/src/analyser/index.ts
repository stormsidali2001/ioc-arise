import { ClassInfo, AnalyzerOptions } from '../types';
import { ProjectAnalyzer } from './project-analyzer';

export async function analyzeProject(sourceDir: string, options?: Partial<AnalyzerOptions>): Promise<ClassInfo[]> {
  const analyzer = new ProjectAnalyzer({
    sourceDir,
    ...options
  });
  
  return analyzer.analyzeProject();
}