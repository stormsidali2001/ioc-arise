import { describe, it, expect, beforeEach } from 'vitest';
import { ContainerGenerator } from '../../generator/container-generator';
import { ClassInfo, InjectionScope } from '../../types';
import {
  basicManagedClasses,
  transientClasses,
  mixedDependencyClasses
} from './fixtures/dependency-resolver.fixtures';

describe('ContainerGenerator', () => {
  let containerGenerator: ContainerGenerator;

  describe('constructor', () => {
    it('should create an instance with provided classes', () => {
      containerGenerator = new ContainerGenerator(basicManagedClasses);
      expect(containerGenerator).toBeInstanceOf(ContainerGenerator);
    });

    it('should handle empty classes array', () => {
      containerGenerator = new ContainerGenerator([]);
      expect(containerGenerator).toBeInstanceOf(ContainerGenerator);
    });

    it('should store classes internally', () => {
      containerGenerator = new ContainerGenerator(basicManagedClasses);
      expect(containerGenerator['classes']).toBe(basicManagedClasses);
    });
  });

  describe('generateContainerObject', () => {
    describe('with singleton classes only', () => {
      beforeEach(() => {
        containerGenerator = new ContainerGenerator(basicManagedClasses);
      });

      it('should generate container object with singleton properties', () => {
        const result = containerGenerator.generateContainerObject();
        
        expect(result).toContain('export const container = {');
        expect(result).toContain('IUserService: userService,');
        expect(result).toContain('IUserRepository: userRepository,');
        expect(result).toContain('};');
      });

      it('should use interface names as property keys', () => {
        const result = containerGenerator.generateContainerObject();
        
        expect(result).toContain('IUserService:');
        expect(result).toContain('IUserRepository:');
      });

      it('should use variable names as property values', () => {
        const result = containerGenerator.generateContainerObject();
        
        expect(result).toContain(': userService,');
        expect(result).toContain(': userRepository,');
      });
    });

    describe('with transient classes only', () => {
      beforeEach(() => {
        containerGenerator = new ContainerGenerator(transientClasses);
      });

      it('should generate container object with getter properties for transients', () => {
        const result = containerGenerator.generateContainerObject();
        
        expect(result).toContain('export const container = {');
        expect(result).toContain('get IEmailService(): EmailService {');
        expect(result).toContain('return emailServiceFactory();');
        expect(result).toContain('get IEmailProvider(): EmailProvider {');
        expect(result).toContain('return emailProviderFactory();');
        expect(result).toContain('};');
      });

      it('should use factory functions in getter return statements', () => {
        const result = containerGenerator.generateContainerObject();
        
        expect(result).toContain('return emailServiceFactory();');
        expect(result).toContain('return emailProviderFactory();');
      });

      it('should use class names as return types in getters', () => {
        const result = containerGenerator.generateContainerObject();
        
        expect(result).toContain('get IEmailService(): EmailService {');
        expect(result).toContain('get IEmailProvider(): EmailProvider {');
      });
    });

    describe('with mixed scope classes', () => {
      const mixedScopeClasses: ClassInfo[] = [
        ...basicManagedClasses,
        ...transientClasses
      ];

      beforeEach(() => {
        containerGenerator = new ContainerGenerator(mixedScopeClasses);
      });

      it('should generate container object with both singleton and transient properties', () => {
        const result = containerGenerator.generateContainerObject();
        
        // Singleton properties
        expect(result).toContain('IUserService: userService,');
        expect(result).toContain('IUserRepository: userRepository,');
        
        // Transient properties
        expect(result).toContain('get IEmailService(): EmailService {');
        expect(result).toContain('return emailServiceFactory();');
        expect(result).toContain('get IEmailProvider(): EmailProvider {');
        expect(result).toContain('return emailProviderFactory();');
      });

      it('should place singleton properties before transient properties', () => {
        const result = containerGenerator.generateContainerObject();
        
        const singletonIndex = result.indexOf('IUserService: userService,');
        const transientIndex = result.indexOf('get IEmailService(): EmailService {');
        
        expect(singletonIndex).toBeLessThan(transientIndex);
      });
    });

    describe('with classes without interface names', () => {
      const classesWithoutInterfaces: ClassInfo[] = [
        {
          name: 'SimpleService',
          filePath: '/src/services/simple.service.ts',
          dependencies: [],
          constructorParams: [],
          interfaceName: undefined,
          importPath: './services/simple.service',
          scope: 'singleton' as InjectionScope
        }
      ];

      beforeEach(() => {
        containerGenerator = new ContainerGenerator(classesWithoutInterfaces);
      });

      it('should use class name when interface name is not provided', () => {
        const result = containerGenerator.generateContainerObject();
        
        expect(result).toContain('SimpleService: simpleService,');
      });
    });

    describe('with empty classes array', () => {
      beforeEach(() => {
        containerGenerator = new ContainerGenerator([]);
      });

      it('should generate empty container object', () => {
        const result = containerGenerator.generateContainerObject();
        
        expect(result).toBe('export const container = {\n\n};');
      });
    });

    describe('output formatting', () => {
      beforeEach(() => {
        containerGenerator = new ContainerGenerator(basicManagedClasses);
      });

      it('should have proper indentation for properties', () => {
        const result = containerGenerator.generateContainerObject();
        
        expect(result).toContain('  IUserService: userService,');
        expect(result).toContain('  IUserRepository: userRepository,');
      });

      it('should start with export statement', () => {
        const result = containerGenerator.generateContainerObject();
        
        expect(result).toMatch(/^export const container = \{/);
      });

      it('should end with closing brace and semicolon', () => {
        const result = containerGenerator.generateContainerObject();
        
        expect(result).toMatch(/\};$/);
      });
    });
  });

  describe('generateTypeExport', () => {
    beforeEach(() => {
      containerGenerator = new ContainerGenerator(basicManagedClasses);
    });

    it('should generate type export statement', () => {
      const result = containerGenerator.generateTypeExport();
      
      expect(result).toBe('export type Container = typeof container;');
    });

    it('should return consistent output regardless of classes', () => {
      const emptyGenerator = new ContainerGenerator([]);
      const mixedGenerator = new ContainerGenerator([...basicManagedClasses, ...transientClasses]);
      
      const result1 = containerGenerator.generateTypeExport();
      const result2 = emptyGenerator.generateTypeExport();
      const result3 = mixedGenerator.generateTypeExport();
      
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(result1).toBe('export type Container = typeof container;');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex mixed dependency classes', () => {
      containerGenerator = new ContainerGenerator(mixedDependencyClasses);
      const containerResult = containerGenerator.generateContainerObject();
      const typeResult = containerGenerator.generateTypeExport();
      
      expect(containerResult).toContain('export const container = {');
      expect(containerResult).toContain('IOrderService: orderService,');
      expect(containerResult).toContain('};');
      expect(typeResult).toBe('export type Container = typeof container;');
    });

    it('should generate valid TypeScript code structure', () => {
      containerGenerator = new ContainerGenerator([...basicManagedClasses, ...transientClasses]);
      const containerResult = containerGenerator.generateContainerObject();
      const typeResult = containerGenerator.generateTypeExport();
      
      // Check that the generated code has valid structure
      expect(containerResult).toMatch(/^export const container = \{[\s\S]*\};$/);
      expect(typeResult).toMatch(/^export type Container = typeof container;$/);
      
      // Check that singleton and transient properties are properly formatted
      expect(containerResult).toMatch(/\s+\w+: \w+,/); // Singleton pattern
      expect(containerResult).toMatch(/\s+get \w+\(\): \w+ \{[\s\S]*?\}/); // Transient pattern
    });
  });
});