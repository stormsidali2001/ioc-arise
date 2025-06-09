import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { ASTParser } from '../analyser/ast-parser';
import { ConstructorParameter, InjectionScope } from '../types';

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
      const content = `
class TestClass {
  constructor() {}
}
`;
      writeFileSync(testFile, content);

      const root = parser.parseFile(testFile);
      
      expect(root).toBeDefined();
      expect(typeof root.text).toBe('function');
      expect(root.text()).toContain('TestClass');
    });

    it('should handle empty files', () => {
      const testFile = join(tempDir, 'empty.ts');
      writeFileSync(testFile, '');

      const root = parser.parseFile(testFile);
      
      expect(root).toBeDefined();
      expect(root.text()).toBe('');
    });
  });

  describe('findClassesImplementingInterfaces', () => {
    it('should find classes implementing interfaces', () => {
      const testFile = join(tempDir, 'interface-test.ts');
      const content = `
interface IUserService {
  getUser(): string;
}

class UserService implements IUserService {
  getUser(): string {
    return 'user';
  }
}

class RegularClass {
  doSomething() {}
}
`;
      writeFileSync(testFile, content);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      
      expect(classes).toHaveLength(1);
      expect(classes[0].text()).toContain('UserService implements IUserService');
    });

    it('should return empty array when no classes implement interfaces', () => {
      const testFile = join(tempDir, 'no-interface.ts');
      const content = `
class RegularClass {
  doSomething() {}
}
`;
      writeFileSync(testFile, content);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      
      expect(classes).toHaveLength(0);
    });

    it('should find multiple classes implementing interfaces', () => {
      const testFile = join(tempDir, 'multiple-interfaces.ts');
      const content = `
interface IUserService {
  getUser(): string;
}

interface IEmailService {
  sendEmail(): void;
}

class UserService implements IUserService {
  getUser(): string {
    return 'user';
  }
}

class EmailService implements IEmailService {
  sendEmail(): void {}
}
`;
      writeFileSync(testFile, content);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      
      expect(classes).toHaveLength(2);
    });
  });

  describe('extractClassName', () => {
    it('should extract class name from class node', () => {
      const testFile = join(tempDir, 'class-name.ts');
      const content = `
class UserService implements IUserService {
  constructor() {}
}
`;
      writeFileSync(testFile, content);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      const className = parser.extractClassName(classes[0]);
      
      expect(className).toBe('UserService');
    });

    it('should handle class names with underscores and numbers', () => {
      const testFile = join(tempDir, 'complex-name.ts');
      const content = `
class User_Service_123 implements IUserService {
  constructor() {}
}
`;
      writeFileSync(testFile, content);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      const className = parser.extractClassName(classes[0]);
      
      expect(className).toBe('User_Service_123');
    });

    it('should return undefined for invalid class nodes', () => {
      const testFile = join(tempDir, 'invalid.ts');
      const content = `
interface IUserService {
  getUser(): string;
}
`;
      writeFileSync(testFile, content);

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
      const content = `
class UserService implements IUserService {
  constructor() {}
}
`;
      writeFileSync(testFile, content);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      const interfaceName = parser.extractInterfaceName(classes[0]);
      
      expect(interfaceName).toBe('IUserService');
    });

    it('should handle multiple interfaces (first one)', () => {
      const testFile = join(tempDir, 'multiple-interfaces.ts');
      const content = `
class UserService implements IUserService, ILoggable {
  constructor() {}
}
`;
      writeFileSync(testFile, content);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      const interfaceName = parser.extractInterfaceName(classes[0]);
      
      expect(interfaceName).toBe('IUserService');
    });
  });

  describe('extractConstructorParameters', () => {
    it('should extract constructor parameters with types', () => {
      const testFile = join(tempDir, 'constructor-params.ts');
      const content = `
class UserService implements IUserService {
  constructor(private userRepo: UserRepository, public logger: Logger) {}
}
`;
      writeFileSync(testFile, content);

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
      const content = `
class UserService implements IUserService {
  constructor(private userRepo: UserRepository, logger?: Logger) {}
}
`;
      writeFileSync(testFile, content);

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
      const content = `
class UserService implements IUserService {
  getUser(): string {
    return 'user';
  }
}
`;
      writeFileSync(testFile, content);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      const params = parser.extractConstructorParameters(classes[0]);
      
      expect(params).toHaveLength(0);
    });

    it('should handle empty constructors', () => {
      const testFile = join(tempDir, 'empty-constructor.ts');
      const content = `
class UserService implements IUserService {
  constructor() {}
}
`;
      writeFileSync(testFile, content);

      const root = parser.parseFile(testFile);
      const classes = parser.findClassesImplementingInterfaces(root);
      const params = parser.extractConstructorParameters(classes[0]);
      
      expect(params).toHaveLength(0);
    });

    it('should handle protected access modifier', () => {
      const testFile = join(tempDir, 'protected-params.ts');
      const content = `
class UserService implements IUserService {
  constructor(protected userRepo: UserRepository) {}
}
`;
      writeFileSync(testFile, content);

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
      const content = `
/**
 * @scope singleton
 */
class UserService implements IUserService {
  constructor() {}
}

/**
 * @scope transient
 */
class EmailService implements IEmailService {
  constructor() {}
}
`;
      writeFileSync(testFile, content);

      const root = parser.parseFile(testFile);
      const scopes = parser.extractJSDocComments(root);
      
      expect(scopes.get('UserService')).toBe('singleton');
      expect(scopes.get('EmailService')).toBe('transient');
    });

    it('should handle classes without JSDoc comments', () => {
      const testFile = join(tempDir, 'no-jsdoc.ts');
      const content = `
class UserService implements IUserService {
  constructor() {}
}
`;
      writeFileSync(testFile, content);

      const root = parser.parseFile(testFile);
      const scopes = parser.extractJSDocComments(root);
      
      expect(scopes.size).toBe(0);
    });

    it('should ignore comments without @scope annotation', () => {
      const testFile = join(tempDir, 'regular-comments.ts');
      const content = `
/**
 * This is a regular comment
 * @param something
 */
class UserService implements IUserService {
  constructor() {}
}
`;
      writeFileSync(testFile, content);

      const root = parser.parseFile(testFile);
      const scopes = parser.extractJSDocComments(root);
      
      expect(scopes.size).toBe(0);
    });

    it('should handle malformed JSDoc comments gracefully', () => {
      const testFile = join(tempDir, 'malformed-jsdoc.ts');
      const content = `
/**
 * @scope invalid_scope
 */
class UserService implements IUserService {
  constructor() {}
}
`;
      writeFileSync(testFile, content);

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
      const content = `
import { UserRepository as UserRepo } from './user-repository';
import { Logger as AppLogger } from './logger';
import { SomeClass } from './some-class';

class UserService implements IUserService {
  constructor(private userRepo: UserRepo, private logger: AppLogger) {}
}
`;
      writeFileSync(testFile, content);

      const root = parser.parseFile(testFile);
      const aliases = parser.extractTypeAliases(root);
      
      expect(aliases.get('UserRepo')).toBe('UserRepository');
      expect(aliases.get('AppLogger')).toBe('Logger');
      expect(aliases.has('SomeClass')).toBe(false); // No alias
    });

    it('should handle imports without aliases', () => {
      const testFile = join(tempDir, 'no-aliases.ts');
      const content = `
import { UserRepository } from './user-repository';
import { Logger } from './logger';

class UserService implements IUserService {
  constructor(private userRepo: UserRepository) {}
}
`;
      writeFileSync(testFile, content);

      const root = parser.parseFile(testFile);
      const aliases = parser.extractTypeAliases(root);
      
      expect(aliases.size).toBe(0);
    });

    it('should handle files without imports', () => {
      const testFile = join(tempDir, 'no-imports.ts');
      const content = `
class UserService implements IUserService {
  constructor() {}
}
`;
      writeFileSync(testFile, content);

      const root = parser.parseFile(testFile);
      const aliases = parser.extractTypeAliases(root);
      
      expect(aliases.size).toBe(0);
    });

    it('should handle complex import statements with whitespace', () => {
      const testFile = join(tempDir, 'complex-imports.ts');
      const content = `
import {   UserRepository   as   UserRepo   } from './user-repository';
import {Logger as AppLogger} from './logger';

class UserService implements IUserService {
  constructor() {}
}
`;
      writeFileSync(testFile, content);

      const root = parser.parseFile(testFile);
      const aliases = parser.extractTypeAliases(root);
      
      expect(aliases.get('UserRepo')).toBe('UserRepository');
      expect(aliases.get('AppLogger')).toBe('Logger');
    });
  });
});