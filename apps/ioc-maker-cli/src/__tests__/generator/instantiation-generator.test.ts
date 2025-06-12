import { describe, it, expect, beforeEach } from 'vitest';
import { InstantiationGenerator } from '../../generator/flat/instantiation-generator';
import { ClassInfo, InjectionScope } from '../../types';
import {
  basicManagedClasses,
  transientClasses,
  mixedDependencyClasses,
  circularDependencyClasses,
  unmanagedClassesWithParams
} from './fixtures/dependency-resolver.fixtures';

describe('InstantiationGenerator', () => {
  let instantiationGenerator: InstantiationGenerator;

  describe('constructor', () => {
    it('should create an instance with provided classes', () => {
      instantiationGenerator = new InstantiationGenerator(basicManagedClasses);
      expect(instantiationGenerator).toBeInstanceOf(InstantiationGenerator);
    });

    it('should handle empty classes array', () => {
      instantiationGenerator = new InstantiationGenerator([]);
      expect(instantiationGenerator).toBeInstanceOf(InstantiationGenerator);
    });

    it('should initialize dependency resolver', () => {
      instantiationGenerator = new InstantiationGenerator(basicManagedClasses);
      expect(instantiationGenerator['dependencyResolver']).toBeDefined();
    });
  });

  describe('generateInstantiations', () => {
    describe('with singleton classes only', () => {
      beforeEach(() => {
        instantiationGenerator = new InstantiationGenerator(basicManagedClasses);
      });

      it('should generate singleton instantiations in correct order', () => {
        const sortedClasses = ['UserRepository', 'UserService'];
        const result = instantiationGenerator.generateInstantiations(sortedClasses);

        expect(result).toContain('// Eager singleton instantiation');
        expect(result).toContain('const userService = new UserService(userRepository);');
        expect(result).toContain('const userRepository = new UserRepository();');
        
        // UserRepository should be instantiated before UserService
        const userRepoIndex = result.indexOf('const userRepository');
        const userServiceIndex = result.indexOf('const userService');
        expect(userServiceIndex).toBeLessThan(userRepoIndex);
      });

      it('should handle classes with no dependencies', () => {
        const noDepsClasses: ClassInfo[] = [
          {
            name: 'SimpleService',
            filePath: '/src/services/simple.service.ts',
            dependencies: [],
            constructorParams: [],
            interfaceName: 'ISimpleService',
            importPath: './services/simple.service',
            scope: 'singleton' as InjectionScope
          }
        ];
        
        instantiationGenerator = new InstantiationGenerator(noDepsClasses);
        const result = instantiationGenerator.generateInstantiations(['SimpleService']);
        
        expect(result).toContain('const simpleService = new SimpleService();');
      });
    });

    describe('with transient classes only', () => {
      beforeEach(() => {
        instantiationGenerator = new InstantiationGenerator(transientClasses);
      });

      it('should generate factory functions for transient classes', () => {
        const sortedClasses = ['EmailProvider', 'EmailService'];
        const result = instantiationGenerator.generateInstantiations(sortedClasses);

        expect(result).toContain('// Lazy loading setup for transient dependencies');
        expect(result).toContain('const emailServiceFactory = (): EmailService => new EmailService(emailProviderFactory());');
        expect(result).toContain('const emailProviderFactory = (): EmailProvider => new EmailProvider();');
        expect(result).not.toContain('// Eager singleton instantiation');
      });

      it('should handle transient classes with no dependencies', () => {
        const transientNoDeps: ClassInfo[] = [
          {
            name: 'TransientService',
            filePath: '/src/services/transient.service.ts',
            dependencies: [],
            constructorParams: [],
            interfaceName: 'ITransientService',
            importPath: './services/transient.service',
            scope: 'transient' as InjectionScope
          }
        ];
        
        instantiationGenerator = new InstantiationGenerator(transientNoDeps);
        const result = instantiationGenerator.generateInstantiations(['TransientService']);
        
        expect(result).toContain('const transientServiceFactory = (): TransientService => new TransientService();');
      });
    });

    describe('with mixed scope classes', () => {
      beforeEach(() => {
        // Create a mix of singleton and transient classes
        const mixedScopeClasses = [
          ...basicManagedClasses, // singletons
          ...transientClasses     // transients
        ];
        instantiationGenerator = new InstantiationGenerator(mixedScopeClasses);
      });

      it('should generate both singleton instantiations and transient factories', () => {
        const sortedClasses = ['UserRepository', 'UserService', 'EmailProvider', 'EmailService'];
        const result = instantiationGenerator.generateInstantiations(sortedClasses);

        // Should have both sections
        expect(result).toContain('// Lazy loading setup for transient dependencies');
        expect(result).toContain('// Eager singleton instantiation');
        
        // Should have factory for transient
        expect(result).toContain('const emailServiceFactory = (): EmailService => new EmailService(emailProviderFactory());');
        expect(result).toContain('const emailProviderFactory = (): EmailProvider => new EmailProvider();');
        
        // Should have instantiation for singletons
        expect(result).toContain('const userService = new UserService(userRepository);');
        expect(result).toContain('const userRepository = new UserRepository();');
      });

      it('should separate transient factories from singleton instantiations', () => {
        const sortedClasses = ['UserRepository', 'UserService', 'EmailProvider', 'EmailService'];
        const result = instantiationGenerator.generateInstantiations(sortedClasses);
        
        const factoryIndex = result.indexOf('// Lazy loading setup');
        const singletonIndex = result.indexOf('// Eager singleton instantiation');
        
        expect(factoryIndex).toBeLessThan(singletonIndex);
      });
    });

    describe('with mixed dependencies', () => {
      beforeEach(() => {
        instantiationGenerator = new InstantiationGenerator(mixedDependencyClasses);
      });

      it('should handle classes with mixed managed and unmanaged dependencies', () => {
        const sortedClasses = ['UserRepository', 'UserService', 'OrderService'];
        const result = instantiationGenerator.generateInstantiations(sortedClasses);
        
        // Should properly resolve mixed dependencies
        expect(result).toContain('const orderService = new OrderService(userService, new PaymentGateway(), new Logger());');
        expect(result).toContain('const userService = new UserService(userRepository);');
        expect(result).toContain('const userRepository = new UserRepository();');
      });
    });

    describe('with unmanaged dependencies', () => {
      beforeEach(() => {
        instantiationGenerator = new InstantiationGenerator(unmanagedClassesWithParams);
      });

      it('should handle classes with unmanaged dependencies', () => {
        const sortedClasses = ['DatabaseConnection'];
        const result = instantiationGenerator.generateInstantiations(sortedClasses);

        expect(result).toContain('const databaseConnection = new DatabaseConnection("default", 0, undefined);');
      });

      it('should generate correct default values for different types', () => {
        const classWithMultipleTypes: ClassInfo[] = [
          {
            name: 'TestService',
            filePath: '/src/services/test.service.ts',
            dependencies: [],
            constructorParams: [
              {
                name: 'stringParam',
                type: 'string',
                isOptional: false,
                accessModifier: 'private'
              },
              {
                name: 'numberParam',
                type: 'number',
                isOptional: false,
                accessModifier: 'private'
              },
              {
                name: 'booleanParam',
                type: 'boolean',
                isOptional: false,
                accessModifier: 'private'
              }
            ],
            interfaceName: 'ITestService',
            importPath: './services/test.service',
            scope: 'singleton' as InjectionScope
          }
        ];
        
        instantiationGenerator = new InstantiationGenerator(classWithMultipleTypes);
        const result = instantiationGenerator.generateInstantiations(['TestService']);
        
        expect(result).toContain('const testService = new TestService("default", 0, false);');
      });
    });

    describe('edge cases', () => {
      it('should handle empty sorted classes array', () => {
        instantiationGenerator = new InstantiationGenerator(basicManagedClasses);
        const result = instantiationGenerator.generateInstantiations([]);
        
        expect(result).toBe('');
      });

      it('should handle classes not in the sorted list', () => {
        instantiationGenerator = new InstantiationGenerator(basicManagedClasses);
        const result = instantiationGenerator.generateInstantiations(['NonExistentClass']);
        
        expect(result).toBe('');
      });

      it('should handle circular dependencies gracefully', () => {
        instantiationGenerator = new InstantiationGenerator(circularDependencyClasses);
        const sortedClasses = ['ServiceA', 'ServiceB'];
        const result = instantiationGenerator.generateInstantiations(sortedClasses);
        
        // Should still generate instantiations even with circular dependencies
        expect(result).toContain('const serviceA');
        expect(result).toContain('const serviceB');
      });

      it('should handle mixed dependencies correctly', () => {
        const mixedClasses: ClassInfo[] = [
          {
            name: 'MixedService',
            filePath: '/src/services/mixed.service.ts',
            dependencies: ['IUserRepository'],
            constructorParams: [
              {
                name: 'userRepository',
                type: 'IUserRepository',
                isOptional: false,
                accessModifier: 'private'
              },
              {
                name: 'apiUrl',
                type: 'string',
                isOptional: false,
                accessModifier: 'private'
              }
            ],
            interfaceName: 'IMixedService',
            importPath: './services/mixed.service',
            scope: 'singleton' as InjectionScope
          },
          ...basicManagedClasses
        ];
        
        instantiationGenerator = new InstantiationGenerator(mixedClasses);
        const result = instantiationGenerator.generateInstantiations(['UserRepository', 'MixedService']);
        
        expect(result).toContain('const mixedService = new MixedService(userRepository, "default");');
      });
    });

    describe('output formatting', () => {
      it('should format output with proper sections and spacing', () => {
        const mixedScopeClasses = [
          ...basicManagedClasses, // singletons
          ...transientClasses     // transients
        ];
        instantiationGenerator = new InstantiationGenerator(mixedScopeClasses);
        const sortedClasses = ['UserRepository', 'UserService', 'EmailProvider', 'EmailService'];
        const result = instantiationGenerator.generateInstantiations(sortedClasses);
        
        const lines = result.split('\n');
        
        // Should have proper section headers
        expect(lines).toContain('// Lazy loading setup for transient dependencies');
        expect(lines).toContain('// Eager singleton instantiation');
        
        // Should have empty line between sections
        const factoryHeaderIndex = lines.indexOf('// Lazy loading setup for transient dependencies');
        const singletonHeaderIndex = lines.indexOf('// Eager singleton instantiation');
        expect(lines[singletonHeaderIndex - 1]).toBe('');
      });

      it('should generate proper variable names', () => {
        instantiationGenerator = new InstantiationGenerator(basicManagedClasses);
        const result = instantiationGenerator.generateInstantiations(['UserService', 'UserRepository']);
        
        expect(result).toContain('const userService');
        expect(result).toContain('const userRepository');
        expect(result).not.toContain('const UserService');
        expect(result).not.toContain('const UserRepository');
      });
    });
  });
});