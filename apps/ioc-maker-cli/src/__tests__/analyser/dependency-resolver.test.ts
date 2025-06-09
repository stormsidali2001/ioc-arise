import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyResolver } from '../../analyser/dependency-resolver';
import { ClassInfo } from '../../types';
import {
  basicMockClasses,
  simpleClasses,
  circularClasses,
  selfRefClasses,
  classesWithExternal,
  simpleBinaryCircular,
  multiCircularClasses,
  externalDependencyClasses,
  standaloneClasses,
  diamondClasses,
  optionalDepClasses
} from './fixtures/dependency-resolver-fixtures';

describe('DependencyResolver', () => {
  let resolver: DependencyResolver;
  let mockClasses: ClassInfo[];

  beforeEach(() => {
    mockClasses = basicMockClasses;
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
      const circularResolver = new DependencyResolver(circularClasses);
      const result = circularResolver.resolve();
      
      expect(result.cycles.length).toBeGreaterThan(0);
      expect(result.cycles[0]).toContain('ClassA');
      expect(result.cycles[0]).toContain('ClassB');
      expect(result.cycles[0]).toContain('ClassC');
    });

    it('should handle self-referencing circular dependency', () => {
      const selfRefResolver = new DependencyResolver(selfRefClasses);
      const result = selfRefResolver.resolve();
      
      expect(result.cycles.length).toBeGreaterThan(0);
      expect(result.cycles[0]).toContain('SelfRef');
    });

    it('should ignore external dependencies not in managed classes', () => {
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
      const circularResolver = new DependencyResolver(simpleBinaryCircular);
      const cycles = circularResolver.detectCircularDependencies();
      
      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0]).toContain('A');
      expect(cycles[0]).toContain('B');
    });

    it('should detect multiple separate circular dependencies', () => {
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
      const externalResolver = new DependencyResolver(externalDependencyClasses);
      const graph = (externalResolver as any).buildDependencyGraph();
      
      expect(graph['TestClass']).toEqual(['ManagedClass']);
      expect(graph['ManagedClass']).toEqual([]);
    });

    it('should handle classes with no dependencies', () => {
      const noDepsResolver = new DependencyResolver(standaloneClasses);
      const graph = (noDepsResolver as any).buildDependencyGraph();
      
      expect(graph['Standalone']).toEqual([]);
    });
  });

  describe('complex dependency scenarios', () => {
    it('should handle diamond dependency pattern', () => {
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