import { describe, it, expect, beforeEach } from 'vitest';
import { Project } from 'ts-morph';
import type { RawClassData, RawFunctionData } from '../../domain/types';
import { TsMorphTypeParser } from './TsMorphTypeParser';

function makeParser() {
  const project = new Project({ useInMemoryFileSystem: true, skipAddingFilesFromTsConfig: true });
  return new TsMorphTypeParser(project);
}

describe('TsMorphTypeParser', () => {
  let parser: TsMorphTypeParser;

  beforeEach(() => {
    parser = makeParser();
  });

  describe('class extraction', () => {
    it('extracts a class implementing an interface', () => {
      const pf = parser.parseContent('/test/Foo.ts', `
        export interface IFoo { bar(): void; }
        export class Foo implements IFoo { bar() {} }
      `);
      const cls = pf.classes.find(c => c.name === 'Foo') as RawClassData;
      expect(cls).toBeDefined();
      expect(cls.implementsInterface).toBe('IFoo');
      expect(cls.isAbstract).toBe(false);
    });

    it('extracts an abstract class', () => {
      const pf = parser.parseContent('/test/Base.ts', `
        export abstract class AbstractBase { abstract doWork(): void; }
      `);
      const cls = pf.classes.find(c => c.name === 'AbstractBase') as RawClassData;
      expect(cls).toBeDefined();
      expect(cls.isAbstract).toBe(true);
    });

    it('extracts a class extending an abstract class', () => {
      const pf = parser.parseContent('/test/Impl.ts', `
        import { AbstractBase } from './Base';
        export class Impl extends AbstractBase { doWork() {} }
      `);
      const cls = pf.classes.find(c => c.name === 'Impl') as RawClassData;
      expect(cls.extendsClass).toBe('AbstractBase');
    });

    it('extracts constructor parameters', () => {
      const pf = parser.parseContent('/test/Service.ts', `
        export class Service {
          constructor(private repo: IRepository, public name: string) {}
        }
      `);
      const cls = pf.classes.find(c => c.name === 'Service') as RawClassData;
      const params = cls.constructorParams;
      expect(params).toHaveLength(2);
      const [first, second] = params;
      expect(first?.name).toBe('repo');
      expect(first?.type).toBe('IRepository');
      expect(first?.accessModifier).toBe('private');
      expect(second?.accessModifier).toBe('public');
    });

    it('extracts JSDoc @scope annotation', () => {
      const pf = parser.parseContent('/test/Svc.ts', `
        /**
         * @scope transient
         */
        export class Svc {}
      `);
      const cls = pf.classes.find(c => c.name === 'Svc') as RawClassData;
      expect(cls.jsDocScope).toBe('transient');
    });

    it('defaults scope to undefined when no annotation', () => {
      const pf = parser.parseContent('/test/Svc2.ts', `
        export class Svc2 {}
      `);
      const cls = pf.classes.find(c => c.name === 'Svc2') as RawClassData;
      expect(cls.jsDocScope).toBeUndefined();
    });

    it('skips anonymous class expressions', () => {
      const pf = parser.parseContent('/test/anon.ts', `
        export const x = class { };
      `);
      expect(pf.classes).toHaveLength(0);
    });
  });

  describe('interface / token extraction', () => {
    it('extracts interface names (only those with ≥1 method)', () => {
      const pf = parser.parseContent('/test/iface.ts', `
        export interface IFoo { bar(): void; }
        export interface IEmpty {}
      `);
      expect(pf.tokens.interfaces.includes('IFoo')).toBe(true);
      expect(pf.tokens.interfaces.includes('IEmpty')).toBe(false);
    });

    it('extracts abstract class names', () => {
      const pf = parser.parseContent('/test/abs.ts', `
        export abstract class AbstractRepo {}
      `);
      expect(pf.tokens.abstractClassNames.includes('AbstractRepo')).toBe(true);
    });

    it('extracts class names', () => {
      const pf = parser.parseContent('/test/cls.ts', `
        export class FooService {}
      `);
      expect(pf.tokens.classNames.includes('FooService')).toBe(true);
    });
  });

  describe('function extraction', () => {
    it('extracts a factory function with @factory annotation', () => {
      const pf = parser.parseContent('/test/factory.ts', `
        /**
         * @factory
         */
        export function createFoo(): IFoo { return {} as IFoo; }
      `);
      const fn = pf.functions.find(f => f.name === 'createFoo') as RawFunctionData;
      expect(fn).toBeDefined();
      expect(fn.hasFactoryAnnotation).toBe(true);
    });

    it('extracts factory function parameters', () => {
      const pf = parser.parseContent('/test/factory2.ts', `
        /**
         * @factory
         */
        export function createFoo(repo: IRepo, logger: ILogger): IFoo { return {} as IFoo; }
      `);
      const fn = pf.functions.find(f => f.name === 'createFoo') as RawFunctionData;
      expect(fn).toBeDefined();
      const [first, second] = fn.parameters;
      expect(first?.name).toBe('repo');
      expect(first?.type).toBe('IRepo');
      expect(second?.name).toBe('logger');
    });

    it('does not mark regular functions with @factory annotation', () => {
      const pf = parser.parseContent('/test/helper.ts', `
        export function helper(): void {}
      `);
      expect(pf.functions.filter(f => f.hasFactoryAnnotation)).toHaveLength(0);
    });
  });

  describe('value extraction', () => {
    it('extracts a value with @value annotation', () => {
      const pf = parser.parseContent('/test/config.ts', `
        /**
         * @value
         */
        export const appConfig = { host: 'localhost' };
      `);
      const val = pf.values.find(v => v.name === 'appConfig' && v.hasValueAnnotation);
      expect(val).toBeDefined();
    });

    it('does not mark values without @value as annotated', () => {
      const pf = parser.parseContent('/test/plain.ts', `
        export const version = '1.0';
      `);
      const val = pf.values.find(v => v.name === 'version');
      expect(val?.hasValueAnnotation).toBe(false);
    });
  });

  describe('import mapping', () => {
    it('maps imported type names to their import paths', () => {
      const pf = parser.parseContent('/test/Service2.ts', `
        import { IRepo } from '@pkg/repo';
        export class Service2 {
          constructor(private repo: IRepo) {}
        }
      `);
      expect(pf.tokens.importMappings.has('IRepo')).toBe(true);
      expect(pf.tokens.importMappings.get('IRepo')).toBe('@pkg/repo');
    });
  });
});
