import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectAnalyzer } from '../../analyser/project-analyzer';
import { ClassAnalyzer } from '../../analyser/class-analyzer';
import { FileDiscovery } from '../../analyser/file-discovery';
import { ClassInfo, AnalyzerOptions } from '../../types';

// Mock the dependencies
vi.mock('../../analyser/class-analyzer');
vi.mock('../../analyser/file-discovery');

const MockedClassAnalyzer = vi.mocked(ClassAnalyzer);
const MockedFileDiscovery = vi.mocked(FileDiscovery);

describe('ProjectAnalyzer', () => {
  let projectAnalyzer: ProjectAnalyzer;
  let mockClassAnalyzer: any;
  let mockFileDiscovery: any;
  let options: AnalyzerOptions;

  beforeEach(() => {
    vi.clearAllMocks();
    
    options = {
      sourceDir: '/test/src',
      interfacePattern: 'I*',
      excludePatterns: ['**/*.spec.ts']
    };

    mockFileDiscovery = {
      findTypeScriptFiles: vi.fn()
    };
    
    mockClassAnalyzer = {
      analyzeFile: vi.fn()
    };

    MockedFileDiscovery.mockImplementation(() => mockFileDiscovery);
    MockedClassAnalyzer.mockImplementation(() => mockClassAnalyzer);

    projectAnalyzer = new ProjectAnalyzer(options);
  });

  describe('analyzeProject', () => {
    it('should analyze project successfully with unique interface implementations', async () => {
      const mockFiles = ['/test/src/service1.ts', '/test/src/service2.ts'];
      const mockClasses: ClassInfo[] = [
        {
          name: 'UserService',
          filePath: '/test/src/service1.ts',
          dependencies: ['UserRepository'],
          constructorParams: [],
          interfaceName: 'IUserService',
          importPath: './service1',
          scope: 'singleton'
        },
        {
          name: 'UserRepository',
          filePath: '/test/src/service2.ts',
          dependencies: [],
          constructorParams: [],
          interfaceName: 'IUserRepository',
          importPath: './service2',
          scope: 'singleton'
        }
      ];

      mockFileDiscovery.findTypeScriptFiles.mockResolvedValue(mockFiles);
      mockClassAnalyzer.analyzeFile
        .mockResolvedValueOnce([mockClasses[0]])
        .mockResolvedValueOnce([mockClasses[1]]);

      const result = await projectAnalyzer.analyzeProject();

      expect(result).toEqual(mockClasses);
      expect(mockFileDiscovery.findTypeScriptFiles).toHaveBeenCalledOnce();
      expect(mockClassAnalyzer.analyzeFile).toHaveBeenCalledTimes(2);
    });

    it('should throw error when multiple classes implement the same interface', async () => {
      const mockFiles = ['/test/src/service1.ts', '/test/src/service2.ts'];
      const mockClasses: ClassInfo[] = [
        {
          name: 'UserService',
          filePath: '/test/src/service1.ts',
          dependencies: [],
          constructorParams: [],
          interfaceName: 'IUserService',
          importPath: './service1',
          scope: 'singleton'
        },
        {
          name: 'AnotherUserService',
          filePath: '/test/src/service2.ts',
          dependencies: [],
          constructorParams: [],
          interfaceName: 'IUserService', // Same interface as above
          importPath: './service2',
          scope: 'singleton'
        }
      ];

      mockFileDiscovery.findTypeScriptFiles.mockResolvedValue(mockFiles);
      mockClassAnalyzer.analyzeFile
        .mockResolvedValueOnce([mockClasses[0]])
        .mockResolvedValueOnce([mockClasses[1]]);

      // Mock console.error to avoid output during tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(projectAnalyzer.analyzeProject()).rejects.toThrow(
        'Multiple classes implement the same interface(s): IUserService. Each interface should only be implemented by one class for proper dependency injection.'
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error: Interface 'IUserService' is implemented by multiple classes:"
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '  - UserService (/test/src/service1.ts)'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '  - AnotherUserService (/test/src/service2.ts)'
      );

      consoleSpy.mockRestore();
    });

    it('should throw error when multiple interfaces have duplicate implementations', async () => {
      const mockFiles = ['/test/src/service1.ts', '/test/src/service2.ts', '/test/src/service3.ts'];
      const mockClasses: ClassInfo[] = [
        {
          name: 'UserService1',
          filePath: '/test/src/service1.ts',
          dependencies: [],
          constructorParams: [],
          interfaceName: 'IUserService',
          importPath: './service1',
          scope: 'singleton'
        },
        {
          name: 'UserService2',
          filePath: '/test/src/service2.ts',
          dependencies: [],
          constructorParams: [],
          interfaceName: 'IUserService', // Duplicate
          importPath: './service2',
          scope: 'singleton'
        },
        {
          name: 'OrderService1',
          filePath: '/test/src/service3.ts',
          dependencies: [],
          constructorParams: [],
          interfaceName: 'IOrderService',
          importPath: './service3',
          scope: 'singleton'
        },
        {
          name: 'OrderService2',
          filePath: '/test/src/service3.ts',
          dependencies: [],
          constructorParams: [],
          interfaceName: 'IOrderService', // Duplicate
          importPath: './service3',
          scope: 'singleton'
        }
      ];

      mockFileDiscovery.findTypeScriptFiles.mockResolvedValue(mockFiles);
      mockClassAnalyzer.analyzeFile
        .mockResolvedValueOnce([mockClasses[0]])
        .mockResolvedValueOnce([mockClasses[1]])
        .mockResolvedValueOnce([mockClasses[2], mockClasses[3]]);

      // Mock console.error to avoid output during tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(projectAnalyzer.analyzeProject()).rejects.toThrow(
        'Multiple classes implement the same interface(s): IUserService, IOrderService. Each interface should only be implemented by one class for proper dependency injection.'
      );

      consoleSpy.mockRestore();
    });

    it('should filter out classes that are not used as dependencies and have no interfaces', async () => {
      const mockFiles = ['/test/src/service1.ts'];
      const mockClasses: ClassInfo[] = [
        {
          name: 'UserService',
          filePath: '/test/src/service1.ts',
          dependencies: ['UnusedClass'],
          constructorParams: [],
          interfaceName: 'IUserService',
          importPath: './service1',
          scope: 'singleton'
        },
        {
          name: 'UnusedClass',
          filePath: '/test/src/service1.ts',
          dependencies: [],
          constructorParams: [],
          interfaceName: undefined, // No interface
          importPath: './service1',
          scope: 'singleton'
        },
        {
          name: 'AnotherUnusedClass',
          filePath: '/test/src/service1.ts',
          dependencies: [],
          constructorParams: [],
          interfaceName: undefined, // No interface and not used as dependency
          importPath: './service1',
          scope: 'singleton'
        }
      ];

      mockFileDiscovery.findTypeScriptFiles.mockResolvedValue(mockFiles);
      mockClassAnalyzer.analyzeFile.mockResolvedValueOnce(mockClasses);

      const result = await projectAnalyzer.analyzeProject();

      // Should include UserService (has interface) and UnusedClass (used as dependency)
      // Should exclude AnotherUnusedClass (no interface and not used as dependency)
      expect(result).toHaveLength(2);
      expect(result.map(c => c.name)).toEqual(['UserService', 'UnusedClass']);
    });
  });
});