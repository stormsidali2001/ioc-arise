import { Project, Diagnostic } from "ts-morph";
import { Logger } from "./logger";
import { ErrorFactory } from "../errors/errorFactory";

export class GeneratedCodeValidator {
  /**
   * Validates generated TypeScript files for errors
   * @param filePaths - Array of absolute paths to generated files
   * @param sourceDir - Source directory of the project for context
   */
  static validate(filePaths: string[], sourceDir: string): void {
    if (filePaths.length === 0) return;

    Logger.custom(
      "🔍",
      "Validating generated code...",
      Logger.getColors().cyan + Logger.getColors().bright,
    );

    const project = new Project({
      compilerOptions: {
        noEmit: true,
        skipLibCheck: true,
        allowJs: true,
        esModuleInterop: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        moduleResolution: 2, // NodeNext
      },
    });

    // Add source files from the project for context (to resolve imports)
    Logger.debug(`Adding context from: ${sourceDir}/**/*.ts`);
    project.addSourceFilesAtPaths([
        `${sourceDir}/**/*.ts`,
        `!${sourceDir}/**/*.gen.ts`, // Exclude already generated files
        `!**/node_modules/**`
    ]);

    // Add exactly the generated files we want to check
    for (const filePath of filePaths) {
      if (filePath.endsWith('.d.ts')) {
          Logger.debug(`Skipping .d.ts file: ${filePath}`);
          continue;
      }
      Logger.debug(`Validating: ${filePath}`);
      project.addSourceFileAtPath(filePath);
    }

    // Get all diagnostics
    const diagnostics = project.getPreEmitDiagnostics();

    if (diagnostics.length > 0) {
      this.reportErrors(diagnostics, filePaths);
    } else {
      Logger.success("No TypeScript errors found in generated files!");
    }
  }

  private static reportErrors(diagnostics: Diagnostic[], generatedFiles: string[]): void {
    const generatedFilesSet = new Set(generatedFiles);
    
    // Filter diagnostics to only show those in our generated files
    const relevantDiagnostics = diagnostics.filter(d => {
      const sourceFile = d.getSourceFile();
      return sourceFile && generatedFilesSet.has(sourceFile.getFilePath());
    });

    if (relevantDiagnostics.length === 0) {
      Logger.success("No TypeScript errors found in generated files!");
      return;
    }

    Logger.error(`Found ${relevantDiagnostics.length} TypeScript error(s) in generated files:`);

    relevantDiagnostics.forEach((diagnostic) => {
      const message = diagnostic.getMessageText();
      const sourceFile = diagnostic.getSourceFile();
      const line = diagnostic.getLineNumber();
      const fileName = sourceFile ? sourceFile.getBaseName() : "unknown";
      const filePath = sourceFile ? sourceFile.getFilePath() : "unknown";

      const formattedMessage = typeof message === "string" 
        ? message 
        : message.getMessageText();

      Logger.log(
        `${Logger.getColors().red}❌ ${fileName}:${line}${Logger.getColors().reset} - ${formattedMessage}`
      );
      Logger.log(Logger.colorizeText(`   at ${filePath}:${line}`, Logger.getColors().gray));
    });

    // We don't necessarily want to exit here if we want the user to see the files, 
    // but typically if the generated code is invalid, it's a failure.
    // For now, let's just log it. If the user wants it to fail, we can throw.
    throw new Error("Generated code has TypeScript errors.");
  }
}
