import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { ClassAnalyzer } from '../analyser/class-analyzer';
import { ASTParser } from '../analyser/ast-parser';
import { InjectionScope } from '../types';
import { container } from '../container';
import {
  mockConstructorParams,
  importPathTestCases,
  generateImportPathTestCases,
  dependencyResolutionTestParams,
  typeAliasesForDependencyTest,
  constructorParamsWithAliases
} from './fixtures/class-analyzer-fixtures';

// Mock the container
vi.mock('../container', () => ({
  container: {
    astParser: {
      parseFile: vi.fn(),
      extractTypeAliases: vi.fn(),
      extractJSDocComments: vi.fn(),
      findClassesImplementingInterfaces: vi.fn(),
      extractClassName: vi.fn(),
      extractInterfaceName: vi.fn(),
      extractConstructorParameters: vi.fn(),
      extractScopeFromJSDoc: vi.fn()
    }
  }
}));

// Mock console methods to avoid noise in tests
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {})
};

describe('ClassAnalyzer', () => {
  let classAnalyzer: ClassAnalyzer;
  let mockAstParser: {
    parseFile: Mock;
    extractTypeAliases: Mock;
    extractJSDocComments: Mock;
    findClassesImplementingInterfaces: Mock;
    extractClassName: Mock;
    extractInterfaceName: Mock;
    extractConstructorParameters: Mock;
    extractScopeFromJSDoc: Mock;
  };

  beforeEach(() => {
    mockAstParser = container.astParser as any;
    
    // Reset all mocks
    Object.values(mockAstParser).forEach(mock => mock.mockReset());
    
    // Reset console spies
    consoleSpy.log.mockClear();
    consoleSpy.warn.mockClear();
    
    classAnalyzer = new ClassAnalyzer('/src', 'I.*Service');
  });

  describe('constructor', () => {
    it('should initialize with source directory and interface pattern', () => {
      const analyzer = new ClassAnalyzer('/test/src', 'I.*Repository');
      expect(analyzer).toBeInstanceOf(ClassAnalyzer);
    });

    it('should initialize without interface pattern', () => {
      const analyzer = new ClassAnalyzer('/test/src');
      expect(analyzer).toBeInstanceOf(ClassAnalyzer);
    });
  });

  describe('analyzeFile', () => {
    const mockFilePath = '/src/services/user.service.ts';
    const mockRoot = { kind: 'SourceFile' };
    const mockClassNode = { kind: 'ClassDeclaration' };

    beforeEach(() => {
      mockAstParser.parseFile.mockReturnValue(mockRoot);
      mockAstParser.extractTypeAliases.mockReturnValue(new Map());
      mockAstParser.extractJSDocComments.mockReturnValue(new Map());
      mockAstParser.findClassesImplementingInterfaces.mockReturnValue([mockClassNode]);
      mockAstParser.extractClassName.mockReturnValue('UserService');
      mockAstParser.extractInterfaceName.mockReturnValue('IUserService');
      mockAstParser.extractConstructorParameters.mockReturnValue(mockConstructorParams);
      mockAstParser.extractScopeFromJSDoc.mockReturnValue('transient' as InjectionScope);
    });

    it('should analyze a basic class file successfully', async () => {
      const result = await classAnalyzer.analyzeFile(mockFilePath);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'UserService',
        filePath: mockFilePath,
        interfaceName: 'IUserService',
        dependencies: ['IUserRepository', 'ILogger'],
        importPath: './services/user.service',
        scope: 'transient' as InjectionScope
      });
    });

    it('should handle multiple classes in one file', async () => {
      const mockClassNodes = [
        { kind: 'ClassDeclaration', name: 'UserService' },
        { kind: 'ClassDeclaration', name: 'AdminService' }
      ];
      
      mockAstParser.findClassesImplementingInterfaces.mockReturnValue(mockClassNodes);
      mockAstParser.extractClassName
        .mockReturnValueOnce('UserService')
        .mockReturnValueOnce('AdminService');
      mockAstParser.extractInterfaceName
        .mockReturnValueOnce('IUserService')
        .mockReturnValueOnce('IAdminService');
      mockAstParser.extractConstructorParameters
        .mockReturnValueOnce([mockConstructorParams[0]])
        .mockReturnValueOnce([mockConstructorParams[1]]);

      const result = await classAnalyzer.analyzeFile(mockFilePath);

      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe('UserService');
      expect(result[1]?.name).toBe('AdminService');
    });

    it('should filter classes by interface pattern', async () => {
      mockAstParser.extractInterfaceName.mockReturnValue('IUserRepository'); // Doesn't match 'I.*Service' pattern
      
      const result = await classAnalyzer.analyzeFile(mockFilePath);

      expect(result).toHaveLength(0);
    });

    it('should include classes when no interface pattern is specified', async () => {
      const analyzerWithoutPattern = new ClassAnalyzer('/src');
      mockAstParser.extractInterfaceName.mockReturnValue('IInternalService');
      
      const result = await analyzerWithoutPattern.analyzeFile(mockFilePath);

      expect(result).toHaveLength(1);
    });

    it('should skip classes without class name', async () => {
      mockAstParser.extractClassName.mockReturnValue(null);
      
      const result = await classAnalyzer.analyzeFile(mockFilePath);

      expect(result).toHaveLength(0);
    });

    it('should skip classes without interface name', async () => {
      mockAstParser.extractInterfaceName.mockReturnValue(null);
      
      const result = await classAnalyzer.analyzeFile(mockFilePath);

      expect(result).toHaveLength(0);
    });

    it('should handle type aliases correctly', async () => {
      const typeAliases = new Map([
        ['NotificationSvc', 'INotificationService'],
        ['Log', 'ILogger']
      ]);
      const paramsWithAliases = [
        { name: 'notification', type: 'NotificationSvc', isOptional: false },
        { name: 'logger', type: 'Log', isOptional: false },
        { name: 'config', type: 'string', isOptional: false }
      ];
      
      mockAstParser.extractTypeAliases.mockReturnValue(typeAliases);
      mockAstParser.extractConstructorParameters.mockReturnValue(paramsWithAliases);
      
      const result = await classAnalyzer.analyzeFile(mockFilePath);

      expect(result[0]?.dependencies).toEqual(['INotificationService', 'ILogger']);
    });

    it('should extract JSDoc scope correctly', async () => {
      const jsDocScopes = new Map([['UserService', 'singleton' as InjectionScope]]);
      mockAstParser.extractJSDocComments.mockReturnValue(jsDocScopes);
      mockAstParser.extractScopeFromJSDoc.mockReturnValue('singleton' as InjectionScope);
      
      const result = await classAnalyzer.analyzeFile(mockFilePath);

      expect(result[0]?.scope).toBe('singleton');
    });

    it('should handle parsing errors gracefully', async () => {
      mockAstParser.parseFile.mockImplementation(() => {
        throw new Error('Syntax error');
      });
      
      const result = await classAnalyzer.analyzeFile(mockFilePath);

      expect(result).toHaveLength(0);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Could not parse'),
        expect.any(Error)
      );
    });

    it('should generate correct import paths', async () => {
      for (const testCase of importPathTestCases) {
        const result = await classAnalyzer.analyzeFile(testCase.filePath);
        expect(result[0]?.importPath).toBe(testCase.expected);
      }
    });
  });

  describe('resolveDependencies (private method testing via public interface)', () => {
    it('should resolve dependencies correctly', async () => {
      const mockFilePath = '/src/services/test.service.ts';
      const mockRoot = { kind: 'SourceFile' };
      const mockClassNode = { kind: 'ClassDeclaration' };
      
      const constructorParams = dependencyResolutionTestParams;
      
      mockAstParser.parseFile.mockReturnValue(mockRoot);
      mockAstParser.extractTypeAliases.mockReturnValue(new Map());
      mockAstParser.extractJSDocComments.mockReturnValue(new Map());
      mockAstParser.findClassesImplementingInterfaces.mockReturnValue([mockClassNode]);
      mockAstParser.extractClassName.mockReturnValue('TestService');
      mockAstParser.extractInterfaceName.mockReturnValue('ITestService');
      mockAstParser.extractConstructorParameters.mockReturnValue(constructorParams);
      mockAstParser.extractScopeFromJSDoc.mockReturnValue('transient' as InjectionScope);
      
      const result = await classAnalyzer.analyzeFile(mockFilePath);

      expect(result[0]?.dependencies).toEqual(['IUserRepository', 'ILogger']);
    });

    it('should resolve type aliases in dependencies', async () => {
      const mockFilePath = '/src/services/test.service.ts';
      const mockRoot = { kind: 'SourceFile' };
      const mockClassNode = { kind: 'ClassDeclaration' };
      
      const typeAliases = typeAliasesForDependencyTest;
      
      const constructorParams = constructorParamsWithAliases;
      
      mockAstParser.parseFile.mockReturnValue(mockRoot);
      mockAstParser.extractTypeAliases.mockReturnValue(typeAliases);
      mockAstParser.extractJSDocComments.mockReturnValue(new Map());
      mockAstParser.findClassesImplementingInterfaces.mockReturnValue([mockClassNode]);
      mockAstParser.extractClassName.mockReturnValue('TestService');
      mockAstParser.extractInterfaceName.mockReturnValue('ITestService');
      mockAstParser.extractConstructorParameters.mockReturnValue(constructorParams);
      mockAstParser.extractScopeFromJSDoc.mockReturnValue('transient' as InjectionScope);
      
      const result = await classAnalyzer.analyzeFile(mockFilePath);

      expect(result[0]?.dependencies).toEqual(['IUserRepository', 'ILogger']);
    });
  });

  describe('generateImportPath (private method testing via public interface)', () => {
    it('should generate correct relative import paths', async () => {
      for (const testCase of generateImportPathTestCases) {
        const analyzer = new ClassAnalyzer(testCase.sourceDir);
        const mockRoot = { kind: 'SourceFile' };
        const mockClassNode = { kind: 'ClassDeclaration' };
        
        mockAstParser.parseFile.mockReturnValue(mockRoot);
        mockAstParser.extractTypeAliases.mockReturnValue(new Map());
        mockAstParser.extractJSDocComments.mockReturnValue(new Map());
        mockAstParser.findClassesImplementingInterfaces.mockReturnValue([mockClassNode]);
        mockAstParser.extractClassName.mockReturnValue('TestClass');
        mockAstParser.extractInterfaceName.mockReturnValue('ITestClass');
        mockAstParser.extractConstructorParameters.mockReturnValue([]);
        mockAstParser.extractScopeFromJSDoc.mockReturnValue('transient' as InjectionScope);
        
        const result = await analyzer.analyzeFile(testCase.filePath);
        expect(result[0]?.importPath).toBe(testCase.expected);
      }
    });
  });

  describe('integration scenarios', () => {
    it('should handle empty constructor parameters', async () => {
      const mockFilePath = '/src/services/simple.service.ts';
      const mockRoot = { kind: 'SourceFile' };
      const mockClassNode = { kind: 'ClassDeclaration' };
      
      mockAstParser.parseFile.mockReturnValue(mockRoot);
      mockAstParser.extractTypeAliases.mockReturnValue(new Map());
      mockAstParser.extractJSDocComments.mockReturnValue(new Map());
      mockAstParser.findClassesImplementingInterfaces.mockReturnValue([mockClassNode]);
      mockAstParser.extractClassName.mockReturnValue('SimpleService');
      mockAstParser.extractInterfaceName.mockReturnValue('ISimpleService');
      mockAstParser.extractConstructorParameters.mockReturnValue([]);
      mockAstParser.extractScopeFromJSDoc.mockReturnValue('transient' as InjectionScope);
      
      const result = await classAnalyzer.analyzeFile(mockFilePath);

      expect(result).toHaveLength(1);
      expect(result[0]?.dependencies).toEqual([]);
      expect(result[0]?.constructorParams).toEqual([]);
    });

    it('should handle complex interface patterns', async () => {
      const complexPatternAnalyzer = new ClassAnalyzer('/src', '^I[A-Z].*Service$');
      const mockFilePath = '/src/services/user.service.ts';
      const mockRoot = { kind: 'SourceFile' };
      const mockClassNode = { kind: 'ClassDeclaration' };
      
      mockAstParser.parseFile.mockReturnValue(mockRoot);
      mockAstParser.extractTypeAliases.mockReturnValue(new Map());
      mockAstParser.extractJSDocComments.mockReturnValue(new Map());
      mockAstParser.findClassesImplementingInterfaces.mockReturnValue([mockClassNode]);
      mockAstParser.extractClassName.mockReturnValue('UserService');
      mockAstParser.extractInterfaceName.mockReturnValue('IUserService');
      mockAstParser.extractConstructorParameters.mockReturnValue([]);
      mockAstParser.extractScopeFromJSDoc.mockReturnValue('transient' as InjectionScope);
      
      const result = await complexPatternAnalyzer.analyzeFile(mockFilePath);

      expect(result).toHaveLength(1);
      expect(result[0]?.interfaceName).toBe('IUserService');
    });

    it('should reject interfaces that do not match complex patterns', async () => {
      const complexPatternAnalyzer = new ClassAnalyzer('/src', '^I[A-Z].*Service$');
      const mockFilePath = '/src/repositories/user.repository.ts';
      const mockRoot = { kind: 'SourceFile' };
      const mockClassNode = { kind: 'ClassDeclaration' };
      
      mockAstParser.parseFile.mockReturnValue(mockRoot);
      mockAstParser.extractTypeAliases.mockReturnValue(new Map());
      mockAstParser.extractJSDocComments.mockReturnValue(new Map());
      mockAstParser.findClassesImplementingInterfaces.mockReturnValue([mockClassNode]);
      mockAstParser.extractClassName.mockReturnValue('UserRepository');
      mockAstParser.extractInterfaceName.mockReturnValue('IUserRepository'); // Doesn't end with 'Service'
      mockAstParser.extractConstructorParameters.mockReturnValue([]);
      mockAstParser.extractScopeFromJSDoc.mockReturnValue('transient' as InjectionScope);
      
      const result = await complexPatternAnalyzer.analyzeFile(mockFilePath);

      expect(result).toHaveLength(0);
    });
  });
});