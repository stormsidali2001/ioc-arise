import { describe, it, expect, beforeEach } from 'vitest';
import { ImportGenerator } from '../../generator/import-generator';
import {
  mockClassInfos,
  mockClassInfoWithNoDependencies,
  mockClassInfoWithUnmanagedDependencies,
  duplicateClassesFixture,
  circularClassesFixture,
  mixedClassesFixture
} from './fixtures/import-generator.fixtures';

describe('ImportGenerator', () => {
  let importGenerator: ImportGenerator;

  describe('constructor', () => {
    it('should create an instance with provided classes', () => {
      importGenerator = new ImportGenerator(mockClassInfos);
      expect(importGenerator).toBeInstanceOf(ImportGenerator);
    });

    it('should handle empty classes array', () => {
      importGenerator = new ImportGenerator([]);
      expect(importGenerator).toBeInstanceOf(ImportGenerator);
    });
  });

  describe('generateImports', () => {
    describe('with managed classes only', () => {
      beforeEach(() => {
        importGenerator = new ImportGenerator(mockClassInfos);
      });

      it('should generate imports for all managed classes', () => {
        const result = importGenerator.generateImports();
        
        expect(result).toContain("import { UserService } from './services/user.service';");
        expect(result).toContain("import { EmailService } from './services/email.service';");
        expect(result).toContain("import { ProductService } from './services/product.service';");
      });

      it('should not duplicate imports for the same class', () => {
        const result = importGenerator.generateImports();
        const userServiceImports = result.split('\n').filter(line => 
          line.includes('UserService')
        );
        
        expect(userServiceImports).toHaveLength(1);
      });

      it('should not generate imports for interfaces (starting with I)', () => {
        const result = importGenerator.generateImports();
        
        expect(result).not.toContain('IUserRepository');
        expect(result).not.toContain('IEmailProvider');
        expect(result).not.toContain('IProductRepository');
      });

      it('should generate imports for managed dependencies', () => {
        const result = importGenerator.generateImports();
        
        // UserService depends on EmailService, and EmailService is a managed class
        // So EmailService should be imported
        expect(result).toContain("import { EmailService } from './services/email.service';");
      });
    });

    describe('with no dependencies', () => {
      beforeEach(() => {
        importGenerator = new ImportGenerator([mockClassInfoWithNoDependencies]);
      });

      it('should generate import only for the class itself', () => {
        const result = importGenerator.generateImports();
        
        expect(result).toBe("import { LoggerService } from './services/logger.service';");
      });
    });

    describe('with unmanaged dependencies', () => {
      beforeEach(() => {
        const classesWithUnmanaged = [...mockClassInfos, mockClassInfoWithUnmanagedDependencies];
        importGenerator = new ImportGenerator(classesWithUnmanaged);
      });

      it('should generate imports for unmanaged dependencies that are not interfaces', () => {
        const result = importGenerator.generateImports();
        
        // Connection is an unmanaged dependency and doesn't start with 'I'
        expect(result).toContain("import { Connection } from './services/database.service';");
        
        // IConfig is an interface (starts with 'I') so should not be imported
        expect(result).not.toContain('IConfig');
      });

      it('should include imports for all managed classes', () => {
        const result = importGenerator.generateImports();
        
        expect(result).toContain("import { UserService } from './services/user.service';");
        expect(result).toContain("import { EmailService } from './services/email.service';");
        expect(result).toContain("import { ProductService } from './services/product.service';");
        expect(result).toContain("import { DatabaseService } from './services/database.service';");
      });
    });

    describe('with empty classes array', () => {
      beforeEach(() => {
        importGenerator = new ImportGenerator([]);
      });

      it('should return empty string', () => {
        const result = importGenerator.generateImports();
        
        expect(result).toBe('');
      });
    });

    describe('with complex dependency scenarios', () => {
      it('should handle circular dependencies correctly', () => {
        importGenerator = new ImportGenerator(circularClassesFixture);
        const result = importGenerator.generateImports();
        
        expect(result).toContain("import { ServiceA } from './services/service-a';");
        expect(result).toContain("import { ServiceB } from './services/service-b';");
      });

      it('should handle mixed managed and unmanaged dependencies', () => {
        const mixedClasses = [...mixedClassesFixture, mockClassInfos[0]!]; // UserService - non-null assertion since we know the array has items
        
        importGenerator = new ImportGenerator(mixedClasses);
        const result = importGenerator.generateImports();
        
        // Should import the managed class
        expect(result).toContain("import { UserService } from './services/user.service';");
        // Should import the unmanaged non-interface dependency
        expect(result).toContain("import { ExternalLibrary } from './services/mixed.service';");
        // Should NOT import the interface
        expect(result).not.toContain('IConfig');
        // Should import the MixedService itself
        expect(result).toContain("import { MixedService } from './services/mixed.service';");
      });
    });

    describe('import deduplication', () => {
      it('should deduplicate imports from the same path', () => {
        importGenerator = new ImportGenerator(duplicateClassesFixture);
        const result = importGenerator.generateImports();
        const lines = result.split('\n');
        
        // Should have imports for both services
        expect(result).toContain("import { ServiceA } from './services/shared.service';");
        expect(result).toContain("import { ServiceB } from './services/shared.service';");
        
        // Should only have one import for SharedDependency
        const sharedDepImports = lines.filter(line => 
          line.includes('SharedDependency')
        );
        expect(sharedDepImports).toHaveLength(1);
      });
    });
  });
});