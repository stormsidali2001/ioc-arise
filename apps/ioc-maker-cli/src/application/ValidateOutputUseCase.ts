import { GeneratedCodeValidator } from '../utils/generatedCodeValidator';

export class ValidateOutputUseCase {
  validate(generatedFiles: string[], sourceDir: string): void {
    GeneratedCodeValidator.validate(generatedFiles, sourceDir);
  }
}
