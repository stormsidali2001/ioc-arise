import { wrappedClass } from '@notjustcoders/one-logger-client-sdk';
import { ClassInfo, AnalyzerOptions, FactoryInfo, ValueInfo } from '../types';
import { ProjectAnalyzer as Wrapped } from './project-analyzer';
const ProjectAnalyzer = wrappedClass("ProojectAnalyzer", Wrapped,(name,...args)=>({name,args}))

export async function analyzeProject(sourceDir: string, options?: Partial<AnalyzerOptions>): Promise<ClassInfo[]> {
  const analyzer = new ProjectAnalyzer({
    sourceDir,
    ...options
  });
  
  const result = await analyzer.analyzeProject();
  return result.classes;
}

export async function analyzeProjectWithFactories(sourceDir: string, options?: Partial<AnalyzerOptions>): Promise<{ classes: ClassInfo[]; factories: FactoryInfo[]; values: ValueInfo[] }> {
  const analyzer = new ProjectAnalyzer({
    sourceDir,
    ...options
  });
  
  return analyzer.analyzeProject();
}