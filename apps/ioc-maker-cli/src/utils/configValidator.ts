import { IoCConfig } from './configManager';
import { ModuleResolver } from './moduleResolver';
import { ErrorFactory } from '../errors/errorFactory';
import { ErrorUtils, ValidationError, ConfigError, IoCError } from '../errors/IoCError';

export interface ValidationResult {
  isValid: boolean;
  errors: IoCError[];
  warnings: string[];
}

export class ConfigValidator {
  /**
   * Validates the complete IoC configuration
   * @param config The configuration to validate
   * @returns Validation result with errors and warnings
   */
  public static validateConfig(config: IoCConfig): ValidationResult {
    const errors: IoCError[] = [];
    const warnings: string[] = [];

    // Validate source directory
    if (config.source !== undefined) {
      if (typeof config.source !== 'string' || config.source.trim() === '') {
        errors.push(ErrorFactory.configValidationError('source', config.source, 'non-empty string'));
      }
    }

    // Validate output file
    if (config.output !== undefined) {
      if (typeof config.output !== 'string' || config.output.trim() === '') {
        errors.push(ErrorFactory.configValidationError('output', config.output, 'non-empty string'));
      } else if (!config.output.endsWith('.ts') && !config.output.endsWith('.js')) {
        warnings.push('Output file should have .ts or .js extension');
      }
    }

    // Validate interface pattern
    if (config.interface !== undefined) {
      if (typeof config.interface !== 'string') {
        errors.push(ErrorFactory.configValidationError('interface', config.interface, 'string'));
      } else {
        try {
          new RegExp(config.interface);
        } catch (error) {
          errors.push(ErrorFactory.validationError(
            `Invalid interface pattern regex: ${config.interface}`,
            { configProperty: 'interface' }
          ));
        }
      }
    }

    // Validate exclude patterns
    if (config.exclude !== undefined) {
      if (!Array.isArray(config.exclude)) {
        errors.push(ErrorFactory.configValidationError('exclude', config.exclude, 'array'));
      } else {
        config.exclude.forEach((pattern, index) => {
          if (typeof pattern !== 'string') {
            errors.push(ErrorFactory.validationError(
              `Exclude pattern at index ${index} must be a string`,
              { configProperty: 'exclude' }
            ));
          }
        });
      }
    }

    // Validate boolean flags
    if (config.checkCycles !== undefined && typeof config.checkCycles !== 'boolean') {
      errors.push(ErrorFactory.configValidationError('checkCycles', config.checkCycles, 'boolean'));
    }

    if (config.verbose !== undefined && typeof config.verbose !== 'boolean') {
      errors.push(ErrorFactory.configValidationError('verbose', config.verbose, 'boolean'));
    }

    // Validate modules configuration
    if (config.modules !== undefined) {
      if (typeof config.modules !== 'object' || config.modules === null || Array.isArray(config.modules)) {
        errors.push(ErrorFactory.configValidationError('modules', config.modules, 'object'));
      } else {
        const moduleErrors = ModuleResolver.validateModuleConfig(config.modules);
        errors.push(...moduleErrors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates configuration and logs results
   * @param config The configuration to validate
   * @param configPath Optional path to config file for better error messages
   * @returns true if valid, false otherwise
   */
  public static validateAndLog(config: IoCConfig, configPath?: string): boolean {
    const result = this.validateConfig(config);

    if (result.warnings.length > 0) {
      const { Logger } = require('./logger');
      Logger.warn('Configuration warnings:');
      result.warnings.forEach(warning => {
        Logger.log(`   ${warning}`);
      });
    }

    if (!result.isValid) {
      const { Logger } = require('./logger');
      const configSource = configPath ? ` in ${configPath}` : '';
      Logger.error(`Configuration validation failed${configSource}`);
      Logger.log('\n   Validation errors:');
      result.errors.forEach(error => {
        Logger.log(`   • ${ErrorUtils.formatForConsole(error)}`);
      });
      return false;
    }

    return true;
  }

  /**
   * Validates specific configuration properties
   * @param config The configuration to validate
   * @param properties Array of property names to validate
   * @returns Validation result for specified properties only
   */
  public static validateProperties(config: IoCConfig, properties: (keyof IoCConfig)[]): ValidationResult {
    const fullResult = this.validateConfig(config);
    
    // Filter errors and warnings to only include those related to specified properties
    const filteredErrors = fullResult.errors.filter(error => 
      properties.some(prop => 
        error.context?.configProperty === prop || 
        error.message.toLowerCase().includes(prop.toLowerCase())
      )
    );
    
    const filteredWarnings = fullResult.warnings.filter(warning => 
      properties.some(prop => warning.toLowerCase().includes(prop.toLowerCase()))
    );

    return {
      isValid: filteredErrors.length === 0,
      errors: filteredErrors,
      warnings: filteredWarnings
    };
  }
}