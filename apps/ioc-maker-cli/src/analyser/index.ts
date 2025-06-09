import { wrappedClass } from '@notjustcoders/one-logger-client-sdk';
import { ClassInfo, AnalyzerOptions } from '../types';
import { ProjectAnalyzer as Wrapped } from './project-analyzer';
const ProjectAnalyzer = wrappedClass("ProojectAnalyzer", Wrapped,(name,...args)=>({name,args}))

export async function analyzeProject(sourceDir: string, options?: Partial<AnalyzerOptions>): Promise<ClassInfo[]> {
  const analyzer = new ProjectAnalyzer({
    sourceDir,
    ...options
  });
  
  return analyzer.analyzeProject();
}