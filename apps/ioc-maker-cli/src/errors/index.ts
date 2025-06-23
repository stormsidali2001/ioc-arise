/**
 * IoC Arise CLI Error System
 * 
 * This module provides a comprehensive error handling system with:
 * - Custom error codes for different error categories
 * - Structured error classes with context and suggestions
 * - Factory functions for creating specific errors
 * - Consistent error formatting and logging
 */

import { IoCError } from './IoCError.js';


export {
  IoCError,
  IoCErrorCode,
  ErrorSeverity,
  ConfigError,
  AnalysisError,
  GenerationError,
  ValidationError,
  FileSystemError
} from './IoCError.js';

export type { ErrorContext } from './IoCError.js';

export { ErrorFactory } from './errorFactory.js';

/**
 * Utility functions for error handling
 */
export class ErrorUtils {
  private static IoCError = IoCError;
  /**
   * Check if an error is an IoC error
   */
  static isIoCError(error: any): error is IoCError {
    return error instanceof ErrorUtils.IoCError;
  }

  /**
   * Get error code from any error
   */
  static getErrorCode(error: any): string | undefined {
    if (ErrorUtils.isIoCError(error)) {
      return error.code;
    }
    return undefined;
  }

  /**
   * Format error for console output
   */
  static formatForConsole(error: any): string {
    if (ErrorUtils.isIoCError(error)) {
      return error.getFormattedMessage();
    }
    return error.message || String(error);
  }

  /**
   * Extract stack trace from error
   */
  static getStackTrace(error: any): string | undefined {
    return error.stack;
  }

  /**
   * Check if error is critical
   */
  static isCritical(error: any): boolean {
    if (ErrorUtils.isIoCError(error)) {
      return error.severity === 'critical';
    }
    return false;
  }

  /**
   * Get suggestions from error
   */
  static getSuggestions(error: any): string[] {
    if (ErrorUtils.isIoCError(error)) {
      return error.suggestions || [];
    }
    return [];
  }
}