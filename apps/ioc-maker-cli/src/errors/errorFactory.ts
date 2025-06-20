import {
  IoCError,
  IoCErrorCode,
  ErrorSeverity,
  ErrorContext,
  ConfigError,
  AnalysisError,
  GenerationError,
  ValidationError,
  FileSystemError
} from './IoCError.js';

/**
 * Factory functions for creating specific IoC errors
 */
export class ErrorFactory {
  // Configuration errors
  static configNotFound(filePath: string): ConfigError {
    return new ConfigError(
      IoCErrorCode.CONFIG_FILE_NOT_FOUND,
      `Configuration file not found: ${filePath}`,
      { filePath },
      [
        'Create an ioc.config.json file in your project root',
        'Use --config flag to specify a different config file path',
        'Run with --help to see configuration options'
      ]
    );
  }

  static configParseError(filePath: string, parseError: string): ConfigError {
    return new ConfigError(
      IoCErrorCode.CONFIG_PARSE_ERROR,
      `Failed to parse configuration file: ${parseError}`,
      { filePath },
      [
        'Check JSON syntax in your configuration file',
        'Validate JSON using an online JSON validator',
        'Ensure all strings are properly quoted'
      ]
    );
  }

  static configValidationError(property: string, value: any, expectedType: string): ConfigError {
    return new ConfigError(
      IoCErrorCode.CONFIG_VALIDATION_ERROR,
      `Invalid configuration property '${property}': expected ${expectedType}, got ${typeof value}`,
      { configProperty: property },
      [
        `Set '${property}' to a valid ${expectedType}`,
        'Check the configuration documentation for valid values',
        'Remove the property to use default value'
      ]
    );
  }

  // Source directory errors
  static sourceDirectoryNotFound(sourcePath: string): FileSystemError {
    return new FileSystemError(
      IoCErrorCode.SOURCE_DIR_NOT_FOUND,
      `Source directory not found: ${sourcePath}`,
      { filePath: sourcePath },
      [
        'Check if the source directory path is correct',
        'Ensure the directory exists',
        'Use absolute path if relative path is not working'
      ]
    );
  }

  static sourceDirectoryEmpty(sourcePath: string): AnalysisError {
    return new AnalysisError(
      IoCErrorCode.SOURCE_DIR_EMPTY,
      `Source directory contains no TypeScript files: ${sourcePath}`,
      { filePath: sourcePath },
      [
        'Add TypeScript files to the source directory',
        'Check if files have .ts extension',
        'Verify exclude patterns are not filtering out all files'
      ]
    );
  }

  // Analysis errors
  static noClassesFound(sourcePath: string): AnalysisError {
    return new AnalysisError(
      IoCErrorCode.NO_CLASSES_FOUND,
      `No classes found for dependency injection in: ${sourcePath}`,
      { filePath: sourcePath },
      [
        'Add classes that implement interfaces or extend abstract classes',
        'Check if classes are properly exported',
        'Verify interface patterns match your interfaces',
        'Ensure abstract classes are properly declared with "abstract" keyword'
      ]
    );
  }

  static circularDependency(className: string, dependencyChain: string[]): AnalysisError {
    return new AnalysisError(
      IoCErrorCode.CIRCULAR_DEPENDENCY,
      `Circular dependency detected in class '${className}': ${dependencyChain.join(' -> ')}`,
      { className },
      [
        'Refactor classes to remove circular dependencies',
        'Use interfaces to break dependency cycles',
        'Consider using factory pattern or lazy loading'
      ]
    );
  }

  static duplicateInterfaceImplementation(interfaceName: string, classes: string[]): AnalysisError {
    return new AnalysisError(
      IoCErrorCode.DUPLICATE_INTERFACE_IMPLEMENTATION,
      `Multiple implementations found for interface '${interfaceName}': ${classes.join(', ')}`,
      { interfaceName },
      [
        'Use different interface names for different implementations',
        'Configure module-specific bindings',
        'Use qualifiers to distinguish implementations'
      ]
    );
  }

  // Generation errors
  static generationFailed(reason: string, outputPath?: string): GenerationError {
    return new GenerationError(
      IoCErrorCode.GENERATION_FAILED,
      `Container generation failed: ${reason}`,
      { filePath: outputPath },
      [
        'Check if output directory is writable',
        'Verify all dependencies are resolvable',
        'Review analysis results for errors'
      ]
    );
  }

  static outputFileError(outputPath: string, error: string): GenerationError {
    return new GenerationError(
      IoCErrorCode.OUTPUT_FILE_ERROR,
      `Failed to write output file '${outputPath}': ${error}`,
      { filePath: outputPath },
      [
        'Check if output directory exists and is writable',
        'Ensure sufficient disk space',
        'Verify file permissions'
      ]
    );
  }

  // Module errors
  static moduleConfigInvalid(moduleName: string, reason: string): ValidationError {
    return new ValidationError(
      IoCErrorCode.MODULE_CONFIG_INVALID,
      `Invalid module configuration for '${moduleName}': ${reason}`,
      { moduleName },
      [
        'Check module configuration syntax',
        'Verify all required properties are present',
        'Review module configuration documentation'
      ]
    );
  }

  static modulePatternInvalid(pattern: string, moduleName: string): ValidationError {
    return new ValidationError(
      IoCErrorCode.MODULE_PATTERN_INVALID,
      `Invalid pattern '${pattern}' in module '${moduleName}'`,
      { moduleName },
      [
        'Use valid glob patterns (e.g., **/*.service.ts)',
        'Check pattern syntax documentation',
        'Test patterns with a glob testing tool'
      ]
    );
  }

  // File system errors
  static fileNotFound(filePath: string): FileSystemError {
    return new FileSystemError(
      IoCErrorCode.FILE_NOT_FOUND,
      `File not found: ${filePath}`,
      { filePath },
      [
        'Check if the file path is correct',
        'Ensure the file exists',
        'Verify file permissions'
      ]
    );
  }

  static fileReadError(filePath: string, error: string): FileSystemError {
    return new FileSystemError(
      IoCErrorCode.FILE_READ_ERROR,
      `Failed to read file '${filePath}': ${error}`,
      { filePath },
      [
        'Check file permissions',
        'Ensure file is not locked by another process',
        'Verify file is not corrupted'
      ]
    );
  }

  static fileWriteError(filePath: string, error: string): FileSystemError {
    return new FileSystemError(
      IoCErrorCode.FILE_WRITE_ERROR,
      `Failed to write file '${filePath}': ${error}`,
      { filePath },
      [
        'Check directory permissions',
        'Ensure sufficient disk space',
        'Verify parent directory exists'
      ]
    );
  }

  // Validation errors
  static validationError(message: string, context?: ErrorContext): ValidationError {
    return new ValidationError(
      IoCErrorCode.VALIDATION_ERROR,
      message,
      context,
      [
        'Review the validation requirements',
        'Check input data format',
        'Consult documentation for valid values'
      ]
    );
  }

  // Runtime errors
  static unexpectedError(error: Error, context?: ErrorContext): IoCError {
    return new IoCError(
      IoCErrorCode.UNEXPECTED_ERROR,
      `Unexpected error: ${error.message}`,
      ErrorSeverity.CRITICAL,
      context,
      [
        'Report this issue to the development team',
        'Include the full error stack trace',
        'Provide steps to reproduce the error'
      ]
    );
  }

  // Renderer errors
  static rendererNotFound(rendererName: string): IoCError {
    return new IoCError(
      IoCErrorCode.RENDERER_NOT_FOUND,
      `Renderer not found: ${rendererName}`,
      ErrorSeverity.HIGH,
      undefined,
      [
        'Check if the renderer name is correct',
        'Verify available renderers with --list-renderers',
        'Use a supported renderer (mermaid, plantuml, etc.)'
      ]
    );
  }

  /**
   * Wrap a generic error with IoC error context
   */
  static wrapError(error: Error, code: IoCErrorCode, context?: ErrorContext): IoCError {
    if (error instanceof IoCError) {
      return error;
    }

    return new IoCError(
      code,
      error.message,
      ErrorSeverity.MEDIUM,
      context
    );
  }

  /**
   * Create error from validation result
   */
  static fromValidationResult(property: string, value: any, expectedType: string, context?: ErrorContext): ValidationError {
    return new ValidationError(
      IoCErrorCode.SCHEMA_VALIDATION_ERROR,
      `Validation failed for property '${property}': expected ${expectedType}, got ${typeof value}`,
      { ...context, configProperty: property },
      [
        `Ensure '${property}' is of type ${expectedType}`,
        'Check the schema documentation',
        'Validate your input against the expected format'
      ]
    );
  }
}