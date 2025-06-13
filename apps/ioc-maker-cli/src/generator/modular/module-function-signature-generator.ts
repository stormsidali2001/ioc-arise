import { InstantiationUtils } from '../shared';

/**
 * Responsible for generating function signatures and parameters for module container functions.
 * Handles the creation of function signatures with proper parameter types.
 */
export class ModuleFunctionSignatureGenerator {
  /**
   * Generates function parameters for module dependencies.
   */
  generateFunctionParameters(moduleDeps: Set<string>): string[] {
    return InstantiationUtils.generateModuleFunctionParameters(moduleDeps);
  }

  /**
   * Creates a function signature with parameters.
   */
  createFunctionSignature(functionName: string, params: string[]): string {
    return InstantiationUtils.createFunctionSignature(functionName, params);
  }
}