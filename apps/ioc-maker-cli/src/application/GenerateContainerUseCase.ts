import { ClassInfo, FactoryInfo, ValueInfo } from '../domain/types';
import { ICodeWriter } from './ICodeWriter';
import { RegistrationPlanner } from '../infrastructure/generator/RegistrationPlanner';
import { ContainerCodePrinter } from '../infrastructure/generator/ContainerCodePrinter';
import { ModuleCodePrinter } from '../infrastructure/generator/ModuleCodePrinter';
import { TypeDeclarationPrinter } from '../infrastructure/generator/TypeDeclarationPrinter';
import { TsMorphTypeParser } from '../infrastructure/parser/TsMorphTypeParser';
import { TsConfigPathsResolver } from '../utils/tsConfigPathsResolver';

export interface GenerateOptions {
  outputPath: string;
  classes: ClassInfo[];
  factories?: FactoryInfo[];
  values?: ValueInfo[];
  moduleGroupedClasses?: Map<string, ClassInfo[]>;
  moduleGroupedFactories?: Map<string, FactoryInfo[]>;
  moduleGroupedValues?: Map<string, ValueInfo[]>;
  isModular?: boolean;
  pathsResolver?: TsConfigPathsResolver;
}

export class GenerateContainerUseCase {
  constructor(
    private readonly writer: ICodeWriter,
    private readonly parser: TsMorphTypeParser
  ) {}

  async execute(opts: GenerateOptions): Promise<string[]> {
    const allClasses =
      opts.moduleGroupedClasses && opts.moduleGroupedClasses.size > 0
        ? Array.from(opts.moduleGroupedClasses.values()).flat()
        : opts.classes;

    RegistrationPlanner.checkNameCollisions(allClasses);

    const tokens = RegistrationPlanner.buildTokenSets(
      allClasses,
      opts.factories,
      opts.values
    );

    const generatedFiles: string[] = [];

    if (opts.isModular) {
      const output = ModuleCodePrinter.print(
        opts.outputPath,
        opts.moduleGroupedClasses ?? new Map(),
        tokens,
        allClasses,
        opts.moduleGroupedFactories,
        opts.moduleGroupedValues
      );

      await this.writer.write(output.mainFile.path, output.mainFile.content);
      generatedFiles.push(output.mainFile.path);

      for (const mf of output.moduleFiles) {
        await this.writer.write(mf.path, mf.content);
        generatedFiles.push(mf.path);
      }
    } else {
      const content = ContainerCodePrinter.print(
        opts.classes,
        opts.outputPath,
        tokens,
        opts.factories,
        opts.values
      );
      await this.writer.write(opts.outputPath, content);
      generatedFiles.push(opts.outputPath);
    }

    // Generate .gen.d.ts
    const dtsPath = opts.outputPath.endsWith('.gen.ts')
      ? opts.outputPath.replace(/\.gen\.ts$/, '.gen.d.ts')
      : opts.outputPath.replace(/\.ts$/, '.d.ts');

    const dtsContent = TypeDeclarationPrinter.print(
      allClasses,
      dtsPath,
      this.parser,
      opts.pathsResolver,
      opts.factories,
      opts.values
    );

    await this.writer.write(dtsPath, dtsContent);
    generatedFiles.push(dtsPath);

    return generatedFiles;
  }
}
