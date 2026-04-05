/**
 * Tests for DI token resolution when types originate in external packages.
 *
 * Covers three shapes:
 *  1. Direct external import:  import type { IFoo } from 'some-package'
 *  2. Local re-export stub:    export type { IFoo } from 'some-package'  (chain)
 *  3. Mixed: local + external deps in the same factory / class
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ClassAnalyzer } from './class-analyzer';
import { FactoryAnalyzer } from './factory-analyzer';
import { ASTParser } from './ast-parser';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tmpDir(prefix: string): string {
  const dir = join(tmpdir(), `ioc-arise-test-${prefix}-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function write(dir: string, relativePath: string, content: string): string {
  const full = join(dir, relativePath);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, content, 'utf-8');
  return full;
}

// ---------------------------------------------------------------------------
// ASTParser.extractExternalReExports
// ---------------------------------------------------------------------------

describe('ASTParser.extractExternalReExports', () => {
  let parser: ASTParser;
  let dir: string;

  beforeEach(() => {
    parser = new ASTParser();
    dir = tmpDir('ast-parser');
  });

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('extracts names from export type { X } from external package', () => {
    const file = write(dir, 'stub.ts', `export type { ITombstoneRepository } from '@word-tracker/sync';`);
    const root = parser.parseFile(file);
    const names = parser.extractExternalReExports(root);
    expect(names).toContain('ITombstoneRepository');
  });

  it('extracts multiple names from a single export statement', () => {
    const file = write(dir, 'stub.ts', `export type { IFoo, IBar } from 'some-package';`);
    const root = parser.parseFile(file);
    const names = parser.extractExternalReExports(root);
    expect(names).toContain('IFoo');
    expect(names).toContain('IBar');
  });

  it('handles export with alias: export type { Foo as IFoo } from pkg', () => {
    const file = write(dir, 'stub.ts', `export type { InternalFoo as IFoo } from 'some-package';`);
    const root = parser.parseFile(file);
    const names = parser.extractExternalReExports(root);
    expect(names).toContain('IFoo');
    expect(names).not.toContain('InternalFoo');
  });

  it('ignores re-exports from local (relative) paths', () => {
    const file = write(dir, 'stub.ts', `export type { IFoo } from './local-file';`);
    const root = parser.parseFile(file);
    const names = parser.extractExternalReExports(root);
    expect(names).toHaveLength(0);
  });

  it('returns empty array for a file with no re-exports', () => {
    const file = write(dir, 'stub.ts', `export interface IFoo { doSomething(): void; }`);
    const root = parser.parseFile(file);
    const names = parser.extractExternalReExports(root);
    expect(names).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// FactoryAnalyzer — direct external import
// ---------------------------------------------------------------------------

describe('FactoryAnalyzer — external package types as DI tokens', () => {
  let dir: string;

  beforeEach(() => { dir = tmpDir('factory-analyzer'); });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('resolves a dep typed as an interface imported directly from node_modules', async () => {
    // Local interface that resolves fine
    write(dir, 'ILocalRepo.ts', `export interface ILocalRepo { find(): void; }`);

    // Factory that depends on both a local and an external interface
    write(dir, 'MyUseCase.ts', `
import type { ILocalRepo } from './ILocalRepo';
import type { IExternalService } from 'some-external-package';

/** @factory */
export function createMyUseCase(localRepo: ILocalRepo, externalService: IExternalService) {
  return { localRepo, externalService };
}
`);

    const analyzer = new FactoryAnalyzer(dir);
    const filePaths = [join(dir, 'ILocalRepo.ts'), join(dir, 'MyUseCase.ts')];
    const factories = await analyzer.analyzeFiles(filePaths);

    const uc = factories.find(f => f.name === 'createMyUseCase');
    expect(uc).toBeDefined();

    const depNames = uc!.dependencies.map(d => d.name);
    expect(depNames).toContain('ILocalRepo');
    expect(depNames).toContain('IExternalService');
  });

  it('resolves a dep typed via a local re-export stub for an external package', async () => {
    // Re-export stub: local file that only re-exports from external
    write(dir, 'ports/ITombstoneRepository.ts',
      `export type { ITombstoneRepository } from '@word-tracker/sync';`);

    // Local interface
    write(dir, 'IWordEntryRepository.ts',
      `export interface IWordEntryRepository { find(): void; }`);

    // Factory using both
    write(dir, 'PermanentlyDeleteWordUseCase.ts', `
import type { IWordEntryRepository } from './IWordEntryRepository';
import type { ITombstoneRepository } from './ports/ITombstoneRepository';

/** @factory */
export function createPermanentlyDeleteWordUseCase(deps: {
  wordEntryRepository: IWordEntryRepository;
  tombstoneRepository: ITombstoneRepository;
}) {
  return deps;
}
`);

    const analyzer = new FactoryAnalyzer(dir);
    const filePaths = [
      join(dir, 'ports/ITombstoneRepository.ts'),
      join(dir, 'IWordEntryRepository.ts'),
      join(dir, 'PermanentlyDeleteWordUseCase.ts'),
    ];
    const factories = await analyzer.analyzeFiles(filePaths);

    const uc = factories.find(f => f.name === 'createPermanentlyDeleteWordUseCase');
    expect(uc).toBeDefined();

    const depNames = uc!.dependencies.map(d => d.name);
    expect(depNames).toContain('IWordEntryRepository');
    expect(depNames).toContain('ITombstoneRepository');
  });

  it('mixed: local deps and external deps both appear in dependencies[]', async () => {
    write(dir, 'ILocalA.ts', `export interface ILocalA { a(): void; }`);
    write(dir, 'ILocalB.ts', `export interface ILocalB { b(): void; }`);
    write(dir, 'MyService.ts', `
import type { ILocalA } from './ILocalA';
import type { ILocalB } from './ILocalB';
import type { IExternal } from 'external-pkg';

/** @factory */
export function createMyService(a: ILocalA, b: ILocalB, ext: IExternal) {
  return { a, b, ext };
}
`);

    const analyzer = new FactoryAnalyzer(dir);
    const filePaths = [
      join(dir, 'ILocalA.ts'),
      join(dir, 'ILocalB.ts'),
      join(dir, 'MyService.ts'),
    ];
    const factories = await analyzer.analyzeFiles(filePaths);

    const svc = factories.find(f => f.name === 'createMyService');
    expect(svc).toBeDefined();

    const depNames = svc!.dependencies.map(d => d.name);
    expect(depNames).toContain('ILocalA');
    expect(depNames).toContain('ILocalB');
    expect(depNames).toContain('IExternal');
  });
});

// ---------------------------------------------------------------------------
// ClassAnalyzer — external package types as DI tokens
// ---------------------------------------------------------------------------

describe('ClassAnalyzer — external package types as DI tokens', () => {
  let dir: string;

  beforeEach(() => { dir = tmpDir('class-analyzer'); });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('resolves a constructor dep imported directly from an external package', async () => {
    write(dir, 'ILocalDep.ts', `export interface ILocalDep { doLocal(): void; }`);
    write(dir, 'MyService.ts', `
import type { ILocalDep } from './ILocalDep';
import type { IExternalDep } from 'some-external-lib';
import type { IMyService } from './IMyService';

export class MyService implements IMyService {
  constructor(private local: ILocalDep, private ext: IExternalDep) {}
}
`);
    write(dir, 'IMyService.ts', `export interface IMyService { run(): void; }`);

    const analyzer = new ClassAnalyzer(dir);
    const filePaths = [
      join(dir, 'ILocalDep.ts'),
      join(dir, 'IMyService.ts'),
      join(dir, 'MyService.ts'),
    ];
    const classes = await analyzer.analyzeFiles(filePaths);

    const svc = classes.find(c => c.name === 'MyService');
    expect(svc).toBeDefined();

    const depNames = svc!.dependencies.map(d => d.name);
    expect(depNames).toContain('ILocalDep');
    expect(depNames).toContain('IExternalDep');
  });

  it('resolves a constructor dep coming via a local re-export stub', async () => {
    // Re-export stub
    write(dir, 'ports/IExternalPort.ts',
      `export type { IExternalPort } from 'monorepo-pkg';`);

    write(dir, 'IMyService.ts', `export interface IMyService { run(): void; }`);
    write(dir, 'MyService.ts', `
import type { IExternalPort } from './ports/IExternalPort';
import type { IMyService } from './IMyService';

export class MyService implements IMyService {
  constructor(private port: IExternalPort) {}
  run() {}
}
`);

    const analyzer = new ClassAnalyzer(dir);
    const filePaths = [
      join(dir, 'ports/IExternalPort.ts'),
      join(dir, 'IMyService.ts'),
      join(dir, 'MyService.ts'),
    ];
    const classes = await analyzer.analyzeFiles(filePaths);

    const svc = classes.find(c => c.name === 'MyService');
    expect(svc).toBeDefined();

    const depNames = svc!.dependencies.map(d => d.name);
    expect(depNames).toContain('IExternalPort');
  });
});
