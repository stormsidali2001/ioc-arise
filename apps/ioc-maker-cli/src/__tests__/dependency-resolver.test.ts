import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyResolver } from '../analyser/dependency-resolver';
import { ClassInfo } from '../types';

describe('DependencyResolver', () => {
  let resolver: DependencyResolver;
  let mockClasses: ClassInfo[];

  beforeEach(() => {
    mockClasses = [
      {
        name: 'UserService',
        dependencies: ['UserRepository', 'Logger'],
        constructorParams: [
          { name: 'userRepo', type: 'UserRepository', isOptional: false },
          { name: 'logger', type: 'Logger', isOptional: false }
        ],
        scope: 'singleton',
        interfaceName: 'IUserService',
        importPath: './user-service',
        filePath: '/test/user-service.ts'
      },
      {
        name: 'UserRepository',
        dependencies: ['DatabaseConnection'],
        constructorParams: [
          { name: 'db', type: 'DatabaseConnection', isOptional: false }
        ],
        scope: 'singleton',
        interfaceName: 'IUserRepository',
        importPath: './user-repository',
        filePath: '/test/user-repository.ts'
      },
      {
        name: 'DatabaseConnection',
        dependencies: [],
        constructorParams: [],
        scope: 'singleton',
        interfaceName: 'IDatabaseConnection',
        importPath: './database-connection',
        filePath: '/test/database-connection.ts'
      },
      {
        name: 'Logger',
        dependencies: [],
        constructorParams: [],
        scope: 'singleton',
        interfaceName: 'ILogger',
        importPath: './logger',
        filePath: '/test/logger.ts'
      }
    ];
    resolver = new DependencyResolver(mockClasses);
  });

  describe('resolve', () => {
    it('should return topologically sorted classes', () => {
      const result = resolver.resolve();
      
      expect(result.sorted).toHaveLength(4);
      expect(result.cycles).toHaveLength(0);
      
      // Dependencies should come before dependents
      const userServiceIndex = result.sorted.indexOf('UserService');
      const userRepoIndex = result.sorted.indexOf('UserRepository');
      const dbIndex = result.sorted.indexOf('DatabaseConnection');
      const loggerIndex = result.sorted.indexOf('Logger');
      
      expect(dbIndex).toBeLessThan(userRepoIndex);
      expect(userRepoIndex).toBeLessThan(userServiceIndex);
      expect(loggerIndex).toBeLessThan(userServiceIndex);
    });

    it('should handle classes with no dependencies', () => {
      const simpleClasses: ClassInfo[] = [
        {
          name: 'SimpleClass',
          dependencies: [],
          constructorParams: [],
          scope: 'singleton',
          importPath: './simple',
          filePath: '/test/simple.ts'
        }
      ];
      
      const simpleResolver = new DependencyResolver(simpleClasses);
      const result = simpleResolver.resolve();
      
      expect(result.sorted).toEqual(['SimpleClass']);
      expect(result.cycles).toHaveLength(0);
    });

    it('should handle empty class list', () => {
      const emptyResolver = new DependencyResolver([]);
      const result = emptyResolver.resolve();
      
      expect(result.sorted).toHaveLength(0);
      expect(result.cycles).toHaveLength(0);
    });

    it('should detect circular dependencies', () => {
      const circularClasses: ClassInfo[] = [
        {
          name: 'ClassA',
          dependencies: ['ClassB'],
          constructorParams: [
            { name: 'classB', type: 'ClassB', isOptional: false }
          ],
          scope: 'singleton',
          importPath: './class-a',
          filePath: '/test/class-a.ts'
        },
        {
          name: 'ClassB',
          dependencies: ['ClassC'],
          constructorParams: [
            { name: 'classC', type: 'ClassC', isOptional: false }
          ],
          scope: 'singleton',
          importPath: './class-b',
          filePath: '/test/class-b.ts'
        },
        {
          name: 'ClassC',
          dependencies: ['ClassA'],
          constructorParams: [
            { name: 'classA', type: 'ClassA', isOptional: false }
          ],
          scope: 'singleton',
          importPath: './class-c',
          filePath: '/test/class-c.ts'
        }
      ];
      
      const circularResolver = new DependencyResolver(circularClasses);
      const result = circularResolver.resolve();
      
      expect(result.cycles.length).toBeGreaterThan(0);
      expect(result.cycles[0]).toContain('ClassA');
      expect(result.cycles[0]).toContain('ClassB');
      expect(result.cycles[0]).toContain('ClassC');
    });

    it('should handle self-referencing circular dependency', () => {
      const selfRefClasses: ClassInfo[] = [
        {
          name: 'SelfRef',
          dependencies: ['SelfRef'],
          constructorParams: [
            { name: 'self', type: 'SelfRef', isOptional: false }
          ],
          scope: 'singleton',
          importPath: './self-ref',
          filePath: '/test/self-ref.ts'
        }
      ];
      
      const selfRefResolver = new DependencyResolver(selfRefClasses);
      const result = selfRefResolver.resolve();
      
      expect(result.cycles.length).toBeGreaterThan(0);
      expect(result.cycles[0]).toContain('SelfRef');
    });

    it('should ignore external dependencies not in managed classes', () => {
      const classesWithExternal: ClassInfo[] = [
        {
          name: 'ServiceWithExternal',
          dependencies: ['ManagedDep', 'ExternalLibrary'],
          constructorParams: [
            { name: 'managed', type: 'ManagedDep', isOptional: false },
            { name: 'external', type: 'ExternalLibrary', isOptional: false }
          ],
          scope: 'singleton',
          importPath: './service',
          filePath: '/test/service.ts'
        },
        {
          name: 'ManagedDep',
          dependencies: [],
          constructorParams: [],
          scope: 'singleton',
          importPath: './managed',
          filePath: '/test/managed.ts'
        }
      ];
      
      const externalResolver = new DependencyResolver(classesWithExternal);
      const result = externalResolver.resolve();
      
      expect(result.sorted).toHaveLength(2);
      expect(result.cycles).toHaveLength(0);
      
      const serviceIndex = result.sorted.indexOf('ServiceWithExternal');
      const managedIndex = result.sorted.indexOf('ManagedDep');
      
      expect(managedIndex).toBeLessThan(serviceIndex);
    });
  });

  describe('detectCircularDependencies', () => {
    it('should return empty array when no circular dependencies exist', () => {
      const cycles = resolver.detectCircularDependencies();
      expect(cycles).toHaveLength(0);
    });

    it('should detect and return circular dependencies', () => {
      const circularClasses: ClassInfo[] = [
        {
          name: 'A',
          dependencies: ['B'],
          constructorParams: [{ name: 'b', type: 'B', isOptional: false }],
          scope: 'singleton',
          importPath: './a',
          filePath: '/test/a.ts'
        },
        {
          name: 'B',
          dependencies: ['A'],
          constructorParams: [{ name: 'a', type: 'A', isOptional: false }],
          scope: 'singleton',
          importPath: './b',
          filePath: '/test/b.ts'
        }
      ];
      
      const circularResolver = new DependencyResolver(circularClasses);
      const cycles = circularResolver.detectCircularDependencies();
      
      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0]).toContain('A');
      expect(cycles[0]).toContain('B');
    });

    it('should detect multiple separate circular dependencies', () => {
      const multiCircularClasses: ClassInfo[] = [
        // First cycle: A -> B -> A
        {
          name: 'A',
          dependencies: ['B'],
          constructorParams: [{ name: 'b', type: 'B', isOptional: false }],
          scope: 'singleton',
          importPath: './a',
          filePath: '/test/a.ts'
        },
        {
          name: 'B',
          dependencies: ['A'],
          constructorParams: [{ name: 'a', type: 'A', isOptional: false }],
          scope: 'singleton',
          importPath: './b',
          filePath: '/test/b.ts'
        },
        // Second cycle: C -> D -> C
        {
          name: 'C',
          dependencies: ['D'],
          constructorParams: [{ name: 'd', type: 'D', isOptional: false }],
          scope: 'singleton',
          importPath: './c',
          filePath: '/test/c.ts'
        },
        {
          name: 'D',
          dependencies: ['C'],
          constructorParams: [{ name: 'c', type: 'C', isOptional: false }],
          scope: 'singleton',
          importPath: './d',
          filePath: '/test/d.ts'
        }
      ];
      
      const multiResolver = new DependencyResolver(multiCircularClasses);
      const cycles = multiResolver.detectCircularDependencies();
      
      expect(cycles.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('buildDependencyGraph', () => {
    it('should build correct dependency graph', () => {
      // Access private method through type assertion for testing
      const graph = (resolver as any).buildDependencyGraph();
      
      expect(graph['UserService']).toEqual(['UserRepository', 'Logger']);
      expect(graph['UserRepository']).toEqual(['DatabaseConnection']);
      expect(graph['DatabaseConnection']).toEqual([]);
      expect(graph['Logger']).toEqual([]);
    });

    it('should filter out external dependencies', () => {
      const classesWithExternal: ClassInfo[] = [
        {
          name: 'TestClass',
          dependencies: ['ManagedClass', 'ExternalLibrary', 'AnotherExternal'],
          constructorParams: [],
          scope: 'singleton',
          importPath: '/test/test.ts',
          filePath: '/test/test.ts'
        },
        {
          name: 'ManagedClass',
          dependencies: [],
          constructorParams: [],
          scope: 'singleton',
          importPath: '/test/managed.ts',
          filePath: '/test/managed.ts'
        }
      ];
      
      const externalResolver = new DependencyResolver(classesWithExternal);
      const graph = (externalResolver as any).buildDependencyGraph();
      
      expect(graph['TestClass']).toEqual(['ManagedClass']);
      expect(graph['ManagedClass']).toEqual([]);
    });

    it('should handle classes with no dependencies', () => {
      const noDepsClasses: ClassInfo[] = [
        {
          name: 'Standalone',
          dependencies: [],
          constructorParams: [],
          scope: 'singleton',
          importPath: '/test/standalone.ts',
          filePath: '/test/standalone.ts'
        }
      ];
      
      const noDepsResolver = new DependencyResolver(noDepsClasses);
      const graph = (noDepsResolver as any).buildDependencyGraph();
      
      expect(graph['Standalone']).toEqual([]);
    });
  });

  describe('complex dependency scenarios', () => {
    it('should handle diamond dependency pattern', () => {
      const diamondClasses: ClassInfo[] = [
        {
          name: 'Top',
          dependencies: ['Left', 'Right'],
          constructorParams: [
            { name: 'left', type: 'Left', isOptional: false },
            { name: 'right', type: 'Right', isOptional: false }
          ],
          scope: 'singleton',
          importPath: '/test/top.ts',
          filePath: '/test/top.ts'
        },
        {
          name: 'Left',
          dependencies: ['Bottom'],
          constructorParams: [
            { name: 'bottom', type: 'Bottom', isOptional: false }
          ],
          scope: 'singleton',
          importPath: '/test/left.ts',
          filePath: '/test/left.ts'
        },
        {
          name: 'Right',
          dependencies: ['Bottom'],
          constructorParams: [
            { name: 'bottom', type: 'Bottom', isOptional: false }
          ],
          scope: 'singleton',
          importPath: '/test/right.ts',
          filePath: '/test/right.ts'
        },
        {
          name: 'Bottom',
          dependencies: [],
          constructorParams: [],
          scope: 'singleton',
          importPath: '/test/bottom.ts',
          filePath: '/test/bottom.ts'
        }
      ];
      
      const diamondResolver = new DependencyResolver(diamondClasses);
      const result = diamondResolver.resolve();
      
      expect(result.sorted).toHaveLength(4);
      expect(result.cycles).toHaveLength(0);
      
      const topIndex = result.sorted.indexOf('Top');
      const leftIndex = result.sorted.indexOf('Left');
      const rightIndex = result.sorted.indexOf('Right');
      const bottomIndex = result.sorted.indexOf('Bottom');
      
      expect(bottomIndex).toBeLessThan(leftIndex);
      expect(bottomIndex).toBeLessThan(rightIndex);
      expect(leftIndex).toBeLessThan(topIndex);
      expect(rightIndex).toBeLessThan(topIndex);
    });

    it('should handle optional dependencies correctly', () => {
      const optionalDepClasses: ClassInfo[] = [
        {
          name: 'ServiceWithOptional',
          dependencies: ['RequiredDep'],
          constructorParams: [
            { name: 'required', type: 'RequiredDep', isOptional: false },
            { name: 'optional', type: 'OptionalDep', isOptional: true }
          ],
          scope: 'singleton',
          importPath: '/test/service.ts',
          filePath: '/test/service.ts'
        },
        {
          name: 'RequiredDep',
          dependencies: [],
          constructorParams: [],
          scope: 'singleton',
          importPath: '/test/required.ts',
          filePath: '/test/required.ts'
        }
      ];
      
      const optionalResolver = new DependencyResolver(optionalDepClasses);
      const result = optionalResolver.resolve();
      
      expect(result.sorted).toHaveLength(2);
      expect(result.cycles).toHaveLength(0);
      
      const serviceIndex = result.sorted.indexOf('ServiceWithOptional');
      const requiredIndex = result.sorted.indexOf('RequiredDep');
      
      expect(requiredIndex).toBeLessThan(serviceIndex);
    });
  });
});