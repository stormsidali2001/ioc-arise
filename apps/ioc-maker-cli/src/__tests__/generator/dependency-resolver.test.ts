import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyResolver } from '../../generator/dependency-resolver';
import {
  basicManagedClasses,
  transientClasses,
  mixedDependencyClasses,
  unmanagedClassesWithParams,
  classesWithoutInterfaces,
  circularDependencyClasses,
  testClassForResolution,
  expectedResults
} from './fixtures/dependency-resolver.fixtures';
import { ClassInfo } from '../../types';

describe('DependencyResolver', () => {
  let dependencyResolver: DependencyResolver;

  describe('constructor', () => {
    it('should create an instance with provided classes', () => {
      dependencyResolver = new DependencyResolver(basicManagedClasses);
      expect(dependencyResolver).toBeInstanceOf(DependencyResolver);
    });

    it('should handle empty classes array', () => {
      dependencyResolver = new DependencyResolver([]);
      expect(dependencyResolver).toBeInstanceOf(DependencyResolver);
    });
  });

  describe('createInterfaceToClassMap', () => {
    describe('with classes that have interface names', () => {
      beforeEach(() => {
        dependencyResolver = new DependencyResolver(basicManagedClasses);
      });

      it('should create correct interface to class mapping', () => {
        const result = dependencyResolver.createInterfaceToClassMap();
        
        expect(result.get('IUserService')).toBe('UserService');
        expect(result.get('IUserRepository')).toBe('UserRepository');
        expect(result.size).toBe(2);
      });

      it('should match expected interface mapping', () => {
        const result = dependencyResolver.createInterfaceToClassMap();
        
        expectedResults.basicInterfaceToClassMap.forEach((className, interfaceName) => {
          expect(result.get(interfaceName)).toBe(className);
        });
      });
    });

    describe('with classes without interface names', () => {
      beforeEach(() => {
        dependencyResolver = new DependencyResolver(classesWithoutInterfaces);
      });

      it('should return empty map when no interfaces are defined', () => {
        const result = dependencyResolver.createInterfaceToClassMap();
        
        expect(result.size).toBe(0);
      });
    });

    describe('with mixed classes (some with interfaces, some without)', () => {
      beforeEach(() => {
        const mixedClasses = [...basicManagedClasses, ...classesWithoutInterfaces];
        dependencyResolver = new DependencyResolver(mixedClasses);
      });

      it('should only map classes that have interface names', () => {
        const result = dependencyResolver.createInterfaceToClassMap();
        
        expect(result.get('IUserService')).toBe('UserService');
        expect(result.get('IUserRepository')).toBe('UserRepository');
        expect(result.has('UtilityService')).toBe(false);
        expect(result.has('HelperService')).toBe(false);
        expect(result.size).toBe(2);
      });
    });

    describe('with empty classes array', () => {
      beforeEach(() => {
        dependencyResolver = new DependencyResolver([]);
      });

      it('should return empty map', () => {
        const result = dependencyResolver.createInterfaceToClassMap();
        
        expect(result.size).toBe(0);
      });
    });
  });

  describe('resolveDependencies', () => {
    describe('with singleton managed dependencies', () => {
      beforeEach(() => {
        dependencyResolver = new DependencyResolver(basicManagedClasses);
      });

      it('should resolve interface dependencies to variable names', () => {
        const interfaceToClassMap = dependencyResolver.createInterfaceToClassMap();
        const classMap = new Map(basicManagedClasses.map(c => [c.name, c]));
        
        const result = dependencyResolver.resolveDependencies(
          basicManagedClasses[0]!, // UserService
          interfaceToClassMap,
          classMap
        );
        
        expect(result).toBe('userRepository');
      });

      it('should handle class with no dependencies', () => {
        const interfaceToClassMap = dependencyResolver.createInterfaceToClassMap();
        const classMap = new Map(basicManagedClasses.map(c => [c.name, c]));
        
        const result = dependencyResolver.resolveDependencies(
          basicManagedClasses[1]!, // UserRepository (no dependencies)
          interfaceToClassMap,
          classMap
        );
        
        expect(result).toBe('');
      });
    });

    describe('with transient managed dependencies', () => {
      beforeEach(() => {
        dependencyResolver = new DependencyResolver(transientClasses);
      });

      it('should resolve transient dependencies with factory calls', () => {
        const interfaceToClassMap = dependencyResolver.createInterfaceToClassMap();
        const classMap = new Map(transientClasses.map(c => [c.name, c]));
        
        const result = dependencyResolver.resolveDependencies(
          transientClasses[0]!, // EmailService
          interfaceToClassMap,
          classMap
        );
        
        expect(result).toBe('emailProviderFactory()');
      });
    });

    describe('with mixed managed and unmanaged dependencies', () => {
      beforeEach(() => {
        dependencyResolver = new DependencyResolver(mixedDependencyClasses);
      });

      it('should resolve mixed dependencies correctly', () => {
        const interfaceToClassMap = dependencyResolver.createInterfaceToClassMap();
        const classMap = new Map(mixedDependencyClasses.map(c => [c.name, c]));
        
        const result = dependencyResolver.resolveDependencies(
          mixedDependencyClasses[0]!, // OrderService
          interfaceToClassMap,
          classMap
        );
        
        expect(result).toBe('userService, new PaymentGateway(), new Logger()');
      });
    });

    describe('with direct class name dependencies', () => {
      beforeEach(() => {
        dependencyResolver = new DependencyResolver(classesWithoutInterfaces);
      });

      it('should resolve direct class dependencies', () => {
        const interfaceToClassMap = dependencyResolver.createInterfaceToClassMap();
        const classMap = new Map(classesWithoutInterfaces.map(c => [c.name, c]));
        
        const result = dependencyResolver.resolveDependencies(
          classesWithoutInterfaces[1]!, // HelperService depends on UtilityService
          interfaceToClassMap,
          classMap
        );
        
        expect(result).toBe('utilityService');
      });
    });

    describe('with circular dependencies', () => {
      beforeEach(() => {
        dependencyResolver = new DependencyResolver(circularDependencyClasses);
      });

      it('should handle circular dependencies without infinite loops', () => {
        const interfaceToClassMap = dependencyResolver.createInterfaceToClassMap();
        const classMap = new Map(circularDependencyClasses.map(c => [c.name, c]));
        
        const resultA = dependencyResolver.resolveDependencies(
          circularDependencyClasses[0]!, // ServiceA
          interfaceToClassMap,
          classMap
        );
        
        const resultB = dependencyResolver.resolveDependencies(
          circularDependencyClasses[1]!, // ServiceB
          interfaceToClassMap,
          classMap
        );
        
        expect(resultA).toBe('serviceB');
        expect(resultB).toBe('serviceA');
      });
    });

    describe('with unmanaged dependencies', () => {
      it('should create instances for unmanaged dependencies', () => {
        const testClasses = [testClassForResolution, ...basicManagedClasses, ...transientClasses];
        dependencyResolver = new DependencyResolver(testClasses);
        
        const interfaceToClassMap = dependencyResolver.createInterfaceToClassMap();
        const classMap = new Map(testClasses.map(c => [c.name, c]));
        
        const result = dependencyResolver.resolveDependencies(
          testClassForResolution,
          interfaceToClassMap,
          classMap
        );
        
        expect(result).toBe('userService, emailServiceFactory(), new UnmanagedClass()');
      });
    });
  });

  describe('createUnmanagedDependencyInstance (private method testing via public interface)', () => {
    describe('with classes that have constructor parameters', () => {
      beforeEach(() => {
        dependencyResolver = new DependencyResolver(unmanagedClassesWithParams);
      });

      it('should generate constructor calls with default values for primitive types', () => {
        const testClass: ClassInfo = {
          name: 'TestClass',
          filePath: '/test.ts',
          dependencies: ['DatabaseConnection'],
          constructorParams: [],
          importPath: './test',
          scope: 'singleton'
        };
        
        const interfaceToClassMap = new Map<string, string>();
        const classMap = new Map<string, ClassInfo>();
        
        const result = dependencyResolver.resolveDependencies(
          testClass,
          interfaceToClassMap,
          classMap
        );
        
        expect(result).toBe('new DatabaseConnection("default", 0, undefined)');
      });

      it('should handle classes with mixed parameter types', () => {
        const testClass: ClassInfo = {
          name: 'TestClass',
          filePath: '/test.ts',
          dependencies: ['ConfigService'],
          constructorParams: [],
          importPath: './test',
          scope: 'singleton'
        };
        
        const interfaceToClassMap = new Map<string, string>();
        const classMap = new Map<string, ClassInfo>();
        
        const result = dependencyResolver.resolveDependencies(
          testClass,
          interfaceToClassMap,
          classMap
        );
        
        expect(result).toBe('new ConfigService(new Config(), undefined)');
      });
    });

    describe('with classes that have no constructor parameters', () => {
      it('should generate simple constructor calls', () => {
        const testClass: ClassInfo = {
          name: 'TestClass',
          filePath: '/test.ts',
          dependencies: ['SimpleClass'],
          constructorParams: [],
          importPath: './test',
          scope: 'singleton'
        };
        
        dependencyResolver = new DependencyResolver([testClass]);
        const interfaceToClassMap = new Map<string, string>();
        const classMap = new Map<string, ClassInfo>();
        
        const result = dependencyResolver.resolveDependencies(
          testClass,
          interfaceToClassMap,
          classMap
        );
        
        expect(result).toBe('new SimpleClass()');
      });
    });
  });

  describe('getDefaultValueForType (private method testing via public interface)', () => {
    beforeEach(() => {
      dependencyResolver = new DependencyResolver([]);
    });

    it('should return correct default values for primitive types', () => {
      const testCases = [
        { type: 'string', expected: '"default"' },
        { type: 'number', expected: '0' },
        { type: 'boolean', expected: 'false' },
        { type: 'Date', expected: 'new Date()' }
      ];

      testCases.forEach(({ type, expected }) => {
        const testClass: ClassInfo = {
          name: 'TestClass',
          filePath: '/test.ts',
          dependencies: ['ParamClass'],
          constructorParams: [],
          importPath: './test',
          scope: 'singleton'
        };

        const paramClass: ClassInfo = {
          name: 'ParamClass',
          filePath: '/param.ts',
          dependencies: [],
          constructorParams: [
            {
              name: 'param',
              type: type,
              isOptional: false,
              accessModifier: 'private'
            }
          ],
          importPath: './param',
          scope: 'singleton'
        };

        const resolver = new DependencyResolver([testClass, paramClass]);
        const result = resolver.resolveDependencies(
          testClass,
          new Map(),
          new Map()
        );

        expect(result).toBe(`new ParamClass(${expected})`);
      });
    });

    it('should return undefined for optional parameters', () => {
      const testClass: ClassInfo = {
        name: 'TestClass',
        filePath: '/test.ts',
        dependencies: ['OptionalParamClass'],
        constructorParams: [],
        importPath: './test',
        scope: 'singleton'
      };

      const optionalParamClass: ClassInfo = {
        name: 'OptionalParamClass',
        filePath: '/optional.ts',
        dependencies: [],
        constructorParams: [
          {
            name: 'optionalParam',
            type: 'string',
            isOptional: true,
            accessModifier: 'private'
          }
        ],
        importPath: './optional',
        scope: 'singleton'
      };

      const resolver = new DependencyResolver([testClass, optionalParamClass]);
      const result = resolver.resolveDependencies(
        testClass,
        new Map(),
        new Map()
      );

      expect(result).toBe('new OptionalParamClass(undefined)');
    });

    it('should handle custom class types as parameters', () => {
      const testClass: ClassInfo = {
        name: 'TestClass',
        filePath: '/test.ts',
        dependencies: ['ClassWithCustomParam'],
        constructorParams: [],
        importPath: './test',
        scope: 'singleton'
      };

      const classWithCustomParam: ClassInfo = {
        name: 'ClassWithCustomParam',
        filePath: '/custom.ts',
        dependencies: [],
        constructorParams: [
          {
            name: 'customParam',
            type: 'CustomType',
            isOptional: false,
            accessModifier: 'private'
          }
        ],
        importPath: './custom',
        scope: 'singleton'
      };

      const resolver = new DependencyResolver([testClass, classWithCustomParam]);
      const result = resolver.resolveDependencies(
        testClass,
        new Map(),
        new Map()
      );

      expect(result).toBe('new ClassWithCustomParam(new CustomType())');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null dependencies gracefully', () => {
      const testClass: ClassInfo = {
        name: 'TestClass',
        filePath: '/test.ts',
        dependencies: [],
        constructorParams: [],
        importPath: './test',
        scope: 'singleton'
      };

      dependencyResolver = new DependencyResolver([testClass]);
      const result = dependencyResolver.resolveDependencies(
        testClass,
        new Map(),
        new Map()
      );

      expect(result).toBe('');
    });

    it('should filter out null dependencies', () => {
      // This tests the .filter(dep => dep !== null) part of resolveDependencies
      const testClass: ClassInfo = {
        name: 'TestClass',
        filePath: '/test.ts',
        dependencies: ['ValidDep'],
        constructorParams: [],
        importPath: './test',
        scope: 'singleton'
      };

      dependencyResolver = new DependencyResolver([testClass]);
      const result = dependencyResolver.resolveDependencies(
        testClass,
        new Map(),
        new Map()
      );

      expect(result).toBe('new ValidDep()');
    });
  });
});