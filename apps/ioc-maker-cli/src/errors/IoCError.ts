/**
 * Error codes for IoC Arise CLI
 */
export enum IoCErrorCode {
  // Configuration errors (1000-1099)
  CONFIG_INVALID = 'IOC_1000',
  CONFIG_FILE_NOT_FOUND = 'IOC_1001',
  CONFIG_PARSE_ERROR = 'IOC_1002',
  CONFIG_VALIDATION_ERROR = 'IOC_1003',
  
  // Source directory errors (1100-1199)
  SOURCE_DIR_NOT_FOUND = 'IOC_1100',
  SOURCE_DIR_NOT_ACCESSIBLE = 'IOC_1101',
  SOURCE_DIR_EMPTY = 'IOC_1102',
  
  // Analysis errors (1200-1299)
  ANALYSIS_FAILED = 'IOC_1200',
  NO_CLASSES_FOUND = 'IOC_1201',
  CIRCULAR_DEPENDENCY = 'IOC_1202',
  DUPLICATE_INTERFACE_IMPLEMENTATION = 'IOC_1203',
  INVALID_INTERFACE_PATTERN = 'IOC_1204',
  
  // Generation errors (1300-1399)
  GENERATION_FAILED = 'IOC_1300',
  OUTPUT_FILE_ERROR = 'IOC_1301',
  TEMPLATE_ERROR = 'IOC_1302',
  
  // Module errors (1400-1499)
  MODULE_CONFIG_INVALID = 'IOC_1400',
  MODULE_PATTERN_INVALID = 'IOC_1401',
  MODULE_DUPLICATE_PATTERN = 'IOC_1402',
  
  // File system errors (1500-1599)
  FILE_NOT_FOUND = 'IOC_1500',
  FILE_READ_ERROR = 'IOC_1501',
  FILE_WRITE_ERROR = 'IOC_1502',
  PERMISSION_DENIED = 'IOC_1503',
  
  // Validation errors (1600-1699)
  VALIDATION_ERROR = 'IOC_1600',
  SCHEMA_VALIDATION_ERROR = 'IOC_1601',
  TYPE_VALIDATION_ERROR = 'IOC_1602',
  
  // Runtime errors (1700-1799)
  RUNTIME_ERROR = 'IOC_1700',
  UNEXPECTED_ERROR = 'IOC_1701',
  INITIALIZATION_ERROR = 'IOC_1702',
  
  // Renderer errors (1800-1899)
  RENDERER_NOT_FOUND = 'IOC_1800',
  RENDERER_ERROR = 'IOC_1801'
}

/**
 * Severity levels for errors
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Additional context for errors
 */
export interface ErrorContext {
  filePath?: string;
  lineNumber?: number;
  columnNumber?: number;
  className?: string;
  interfaceName?: string;
  moduleName?: string;
  configProperty?: string;
  [key: string]: any;
}

/**
 * Base IoC error class with custom error codes
 */
export class IoCError extends Error {
  public readonly code: IoCErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context?: ErrorContext;
  public readonly timestamp: Date;
  public readonly suggestions?: string[];

  constructor(
    code: IoCErrorCode,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: ErrorContext,
    suggestions?: string[]
  ) {
    super(message);
    this.name = 'IoCError';
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date();
    this.suggestions = suggestions;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, IoCError);
    }
  }

  /**
   * Get a formatted error message with code and context
   */
  public getFormattedMessage(): string {
    let message = `[${this.code}] ${this.message}`;
    
    if (this.context) {
      const contextParts: string[] = [];
      
      if (this.context.filePath) {
        contextParts.push(`File: ${this.context.filePath}`);
      }
      
      if (this.context.lineNumber) {
        contextParts.push(`Line: ${this.context.lineNumber}`);
      }
      
      if (this.context.className) {
        contextParts.push(`Class: ${this.context.className}`);
      }
      
      if (this.context.interfaceName) {
        contextParts.push(`Interface: ${this.context.interfaceName}`);
      }
      
      if (this.context.moduleName) {
        contextParts.push(`Module: ${this.context.moduleName}`);
      }
      
      if (contextParts.length > 0) {
        message += `\n   Context: ${contextParts.join(', ')}`;
      }
    }
    
    if (this.suggestions && this.suggestions.length > 0) {
      message += `\n   Suggestions:`;
      this.suggestions.forEach(suggestion => {
        message += `\n     • ${suggestion}`;
      });
    }
    
    return message;
  }

  /**
   * Convert error to JSON for logging or API responses
   */
  public toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      suggestions: this.suggestions,
      stack: this.stack
    };
  }
}

/**
 * Configuration-specific error
 */
export class ConfigError extends IoCError {
  constructor(
    code: IoCErrorCode,
    message: string,
    context?: ErrorContext,
    suggestions?: string[]
  ) {
    super(code, message, ErrorSeverity.HIGH, context, suggestions);
    this.name = 'ConfigError';
  }
}

/**
 * Analysis-specific error
 */
export class AnalysisError extends IoCError {
  constructor(
    code: IoCErrorCode,
    message: string,
    context?: ErrorContext,
    suggestions?: string[]
  ) {
    super(code, message, ErrorSeverity.MEDIUM, context, suggestions);
    this.name = 'AnalysisError';
  }
}

/**
 * Generation-specific error
 */
export class GenerationError extends IoCError {
  constructor(
    code: IoCErrorCode,
    message: string,
    context?: ErrorContext,
    suggestions?: string[]
  ) {
    super(code, message, ErrorSeverity.HIGH, context, suggestions);
    this.name = 'GenerationError';
  }
}

/**
 * Validation-specific error
 */
export class ValidationError extends IoCError {
  constructor(
    code: IoCErrorCode,
    message: string,
    context?: ErrorContext,
    suggestions?: string[]
  ) {
    super(code, message, ErrorSeverity.MEDIUM, context, suggestions);
    this.name = 'ValidationError';
  }
}

/**
 * File system-specific error
 */
export class FileSystemError extends IoCError {
  constructor(
    code: IoCErrorCode,
    message: string,
    context?: ErrorContext,
    suggestions?: string[]
  ) {
    super(code, message, ErrorSeverity.HIGH, context, suggestions);
    this.name = 'FileSystemError';
  }
}