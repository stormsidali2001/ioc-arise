import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { ASTParser } from '../../analyser/ast-parser';
import { ConstructorParameter, InjectionScope } from '../../types';
import { testFileContents } from './fixtures/ast-parser-fixtures';

describe('ASTParser', () => {
  let parser: ASTParser;
  let tempDir: string;

  beforeEach(() => {
    parser = new ASTParser();
    tempDir = join(__dirname, 'temp-test-files');
    
    // Create temp directory for test files
    try {
      mkdirSync(tempDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  });

  afterEach(() => {
    // Clean up temp files
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('parseFile', () => {
    it('should parse a TypeScript file and return AST root', () => {
      const testFile = join(tempDir, 'test.ts');
      writeFileSync(testFile, testFileContents.basicClass);

      const root = parser.parseFile(testFile);
      
      expect(root).toBeDefined();
      expect(typeof root.text).toBe('function');
      expect(root.text()).toContain('TestClass');
    });

    it('should handle empty files', () => {
      const testFile = join(tempDir, 'empty.ts');
      writeFileSync(testFile, testFileContents.emptyFile);

      const root = parser.parseFile(testFile);
      
      expect(root).toBeDefined();
      expect(root.text()).toBe('');
    });
  });

  describe('findClassesImplementingInterfaces', () => {
    it('should find classes implementing interfaces', () => {
      const testFile = join(tempDir, 'interface-test.ts');
      writeFileSync(testFile, testFileContents.classWithInterface);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      
      expect(classes).toHaveLength(1);
      expect(classes[0].text()).toContain('UserService implements IUserService');
    });

    it('should return empty array when no classes implement interfaces', () => {
      const testFile = join(tempDir, 'no-interface.ts');
      writeFileSync(testFile, testFileContents.regularClassOnly);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      
      expect(classes).toHaveLength(0);
    });

    it('should find multiple classes implementing interfaces', () => {
      const testFile = join(tempDir, 'multiple-interfaces.ts');
      writeFileSync(testFile, testFileContents.multipleInterfaceClasses);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      
      expect(classes).toHaveLength(2);
    });
  });

  describe('findAllClasses', () => {
    it('should find all classes including those without interfaces', () => {
      const testFile = join(tempDir, 'mixed-classes.ts');
      writeFileSync(testFile, testFileContents.mixedClasses);

      const root = parser.parseFile(testFile);
      const classes = parser.findAllClasses(root);
      
      expect(classes).toHaveLength(3);
      const classTexts = classes.map(c => c.text());
      expect(classTexts.some(text => text.includes('UserService implements IUserService'))).toBe(true);
      expect(classTexts.some(text => text.includes('class UserRepository'))).toBe(true);
      expect(classTexts.some(text => text.includes('class EmailService'))).toBe(true);
    });

    it('should find only regular classes when no interfaces are implemented', () => {
      const testFile = join(tempDir, 'only-regular.ts');
      writeFileSync(testFile, testFileContents.onlyRegularClasses);

      const root = parser.parseFile(testFile);
      const classes = parser.findAllClasses(root);
      
      expect(classes).toHaveLength(3);
      const classTexts = classes.map(c => c.text());
      expect(classTexts.some(text => text.includes('class UserRepository'))).toBe(true);
      expect(classTexts.some(text => text.includes('class EmailService'))).toBe(true);
      expect(classTexts.some(text => text.includes('class Logger'))).toBe(true);
    });

    it('should return empty array when no classes exist', () => {
      const testFile = join(tempDir, 'no-classes.ts');
      writeFileSync(testFile, testFileContents.emptyFile);

      const root = parser.parseFile(testFile);
      const classes = parser.findAllClasses(root);
      
      expect(classes).toHaveLength(0);
    });

    it('should find classes with and without interfaces separately', () => {
      const testFile = join(tempDir, 'mixed-test.ts');
      writeFileSync(testFile, testFileContents.mixedClasses);

      const root = parser.parseFile(testFile);
      const allClasses = parser.findAllClasses(root);
      const interfaceClasses = parser.findClassesImplementingInterfaces(root);
      
      expect(allClasses).toHaveLength(3);
      expect(interfaceClasses).toHaveLength(1);
      expect(allClasses.length).toBeGreaterThan(interfaceClasses.length);
    });
  });

  describe('extractClassName', () => {
    it('should extract class name from class node', () => {
      const testFile = join(tempDir, 'class-name.ts');
      writeFileSync(testFile, testFileContents.simpleClassName);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      const className = parser.extractClassName(classes[0]);
      
      expect(className).toBe('UserService');
    });

    it('should handle class names with underscores and numbers', () => {
      const testFile = join(tempDir, 'complex-name.ts');
      writeFileSync(testFile, testFileContents.complexClassName);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      const className = parser.extractClassName(classes[0]);
      
      expect(className).toBe('User_Service_123');
    });

    it('should return undefined for invalid class nodes', () => {
      const testFile = join(tempDir, 'invalid.ts');
      writeFileSync(testFile, testFileContents.interfaceOnly);

      const root = parser.parseFile(testFile);
      // Try to extract class name from a non-class node
      const interfaceNodes = root.findAll({ rule: { kind: 'interface_declaration' } });
      if (interfaceNodes.length > 0) {
        const className = parser.extractClassName(interfaceNodes[0]);
        expect(className).toBeUndefined();
      }
    });
  });

  describe('extractInterfaceName', () => {
    it('should extract interface name from class node', () => {
      const testFile = join(tempDir, 'interface-name.ts');
      writeFileSync(testFile, testFileContents.singleInterface);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      const interfaceName = parser.extractInterfaceName(classes[0]);
      
      expect(interfaceName).toBe('IUserService');
    });

    it('should handle multiple interfaces (first one)', () => {
      const testFile = join(tempDir, 'multiple-interfaces.ts');
      writeFileSync(testFile, testFileContents.multipleInterfaces);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      const interfaceName = parser.extractInterfaceName(classes[0]);
      
      expect(interfaceName).toBe('IUserService');
    });
  });

  describe('extractConstructorParameters', () => {
    it('should extract constructor parameters with types', () => {
      const testFile = join(tempDir, 'constructor-params.ts');
      writeFileSync(testFile, testFileContents.constructorWithParams);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      const params = parser.extractConstructorParameters(classes[0]);
      
      expect(params).toHaveLength(2);
      expect(params[0]).toEqual({
        name: 'userRepo',
        type: 'UserRepository',
        isOptional: false,
        accessModifier: 'private'
      });
      expect(params[1]).toEqual({
        name: 'logger',
        type: 'Logger',
        isOptional: false,
        accessModifier: 'public'
      });
    });

    it('should handle optional parameters', () => {
      const testFile = join(tempDir, 'optional-params.ts');
      writeFileSync(testFile, testFileContents.optionalParameters);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      const params = parser.extractConstructorParameters(classes[0]);
      
      expect(params).toHaveLength(2);
      expect(params[1]).toEqual({
        name: 'logger',
        type: 'Logger',
        isOptional: true,
        accessModifier: undefined
      });
    });

    it('should handle classes without constructors', () => {
      const testFile = join(tempDir, 'no-constructor.ts');
      writeFileSync(testFile, testFileContents.noConstructor);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      const params = parser.extractConstructorParameters(classes[0]);
      
      expect(params).toHaveLength(0);
    });

    it('should handle empty constructors', () => {
      const testFile = join(tempDir, 'empty-constructor.ts');
      writeFileSync(testFile, testFileContents.emptyConstructor);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      const params = parser.extractConstructorParameters(classes[0]);
      
      expect(params).toHaveLength(0);
    });

    it('should handle protected access modifier', () => {
      const testFile = join(tempDir, 'protected-params.ts');
      writeFileSync(testFile, testFileContents.protectedParameter);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      const params = parser.extractConstructorParameters(classes[0]);
      
      expect(params).toHaveLength(1);
      expect(params[0]).toEqual({
        name: 'userRepo',
        type: 'UserRepository',
        isOptional: false,
        accessModifier: 'protected'
      });
    });
  });

  describe('extractJSDocComments', () => {
    it('should extract scope annotations from JSDoc comments', () => {
      const testFile = join(tempDir, 'jsdoc-scope.ts');
      writeFileSync(testFile, testFileContents.jsDocWithScope);

      const root = parser.parseFile(testFile);
      const scopes = parser.extractJSDocComments(root);
      
      expect(scopes.get('UserService')).toBe('singleton');
      expect(scopes.get('EmailService')).toBe('transient');
    });

    it('should handle classes without JSDoc comments', () => {
      const testFile = join(tempDir, 'no-jsdoc.ts');
      writeFileSync(testFile, testFileContents.noJSDoc);

      const root = parser.parseFile(testFile);
      const scopes = parser.extractJSDocComments(root);
      
      expect(scopes.size).toBe(0);
    });

    it('should ignore comments without @scope annotation', () => {
      const testFile = join(tempDir, 'regular-comments.ts');
      writeFileSync(testFile, testFileContents.regularComments);

      const root = parser.parseFile(testFile);
      const scopes = parser.extractJSDocComments(root);
      
      expect(scopes.size).toBe(0);
    });

    it('should handle malformed JSDoc comments gracefully', () => {
      const testFile = join(tempDir, 'malformed-jsdoc.ts');
      writeFileSync(testFile, testFileContents.malformedJSDoc);

      const root = parser.parseFile(testFile);
      const scopes = parser.extractJSDocComments(root);
      
      expect(scopes.size).toBe(0);
    });
  });

  describe('extractScopeFromJSDoc', () => {
    it('should return scope from JSDoc map when available', () => {
      const jsDocScopes = new Map<string, InjectionScope>();
      jsDocScopes.set('UserService', 'transient');
      
      const scope = parser.extractScopeFromJSDoc('UserService', jsDocScopes);
      
      expect(scope).toBe('transient');
    });

    it('should return singleton as default when class not in map', () => {
      const jsDocScopes = new Map<string, InjectionScope>();
      
      const scope = parser.extractScopeFromJSDoc('UserService', jsDocScopes);
      
      expect(scope).toBe('singleton');
    });

    it('should return singleton as default for empty map', () => {
      const jsDocScopes = new Map<string, InjectionScope>();
      
      const scope = parser.extractScopeFromJSDoc('NonExistentClass', jsDocScopes);
      
      expect(scope).toBe('singleton');
    });
  });

  describe('extractTypeAliases', () => {
    it('should extract type aliases from import statements', () => {
      const testFile = join(tempDir, 'type-aliases.ts');
      writeFileSync(testFile, testFileContents.typeAliases);

      const root = parser.parseFile(testFile);
      const aliases = parser.extractTypeAliases(root);
      
      expect(aliases.get('UserRepo')).toBe('UserRepository');
      expect(aliases.get('AppLogger')).toBe('Logger');
      expect(aliases.has('SomeClass')).toBe(false); // No alias
    });

    it('should handle imports without aliases', () => {
      const testFile = join(tempDir, 'no-aliases.ts');
      writeFileSync(testFile, testFileContents.noAliases);

      const root = parser.parseFile(testFile);
      const aliases = parser.extractTypeAliases(root);
      
      expect(aliases.size).toBe(0);
    });

    it('should handle files without imports', () => {
      const testFile = join(tempDir, 'no-imports.ts');
      writeFileSync(testFile, testFileContents.noImports);

      const root = parser.parseFile(testFile);
      const aliases = parser.extractTypeAliases(root);
      
      expect(aliases.size).toBe(0);
    });

    it('should handle complex import statements with whitespace', () => {
      const testFile = join(tempDir, 'complex-imports.ts');
      writeFileSync(testFile, testFileContents.complexImports);

      const root = parser.parseFile(testFile);
      const aliases = parser.extractTypeAliases(root);
      
      expect(aliases.get('UserRepo')).toBe('UserRepository');
      expect(aliases.get('AppLogger')).toBe('Logger');
    });
  });
});