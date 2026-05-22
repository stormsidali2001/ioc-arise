import { TsMorphTypeParser } from './infrastructure/parser/TsMorphTypeParser';
import { GlobFileDiscovery } from './infrastructure/discovery/GlobFileDiscovery';
import { FsCodeWriter } from './infrastructure/writer/FsCodeWriter';
import { ClassAnalyzer } from './analysis/ClassAnalyzer';
import { FactoryAnalyzer } from './analysis/FactoryAnalyzer';
import { ValueAnalyzer } from './analysis/ValueAnalyzer';
import { AnalyzeProjectUseCase } from './application/AnalyzeProjectUseCase';
import { GenerateContainerUseCase } from './application/GenerateContainerUseCase';
import { DetectCyclesUseCase } from './application/DetectCyclesUseCase';
import { ValidateOutputUseCase } from './application/ValidateOutputUseCase';

function buildContainer(sourceDir: string, interfacePattern?: string, factoryPattern?: string, valuePattern?: string) {
  const parser = new TsMorphTypeParser();
  const fileDiscovery = new GlobFileDiscovery();
  const writer = new FsCodeWriter();
  const classAnalyzer = new ClassAnalyzer(sourceDir, interfacePattern);
  const factoryAnalyzer = new FactoryAnalyzer(sourceDir, parser, factoryPattern);
  const valueAnalyzer = new ValueAnalyzer(sourceDir, valuePattern);

  return {
    parser,
    fileDiscovery,
    writer,
    analyzeProject: new AnalyzeProjectUseCase(
      fileDiscovery,
      parser,
      classAnalyzer,
      factoryAnalyzer,
      valueAnalyzer
    ),
    generateContainer: new GenerateContainerUseCase(writer, parser),
    detectCycles: new DetectCyclesUseCase(),
    validateOutput: new ValidateOutputUseCase(),
  };
}

export { buildContainer };
