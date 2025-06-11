import { ClassInfo } from '../types';

export interface AnalysisResults {
  classes: ClassInfo[];
  circularDependencies: string[][];
}

export interface RenderAnalysis {
  render(results: AnalysisResults): void;
}