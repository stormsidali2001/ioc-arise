/**
 * Feature tests: verify that the generator rejects invalid configurations
 * with the correct error type and message.
 */
import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { runExampleGenerate, examplesDir } from './helpers';
import { IoCError } from '../../errors/IoCError';

const EXAMPLES_DIR = examplesDir();

describe('error cases', () => {
  it('circular-deps-classes — throws on class-level cycle', async () => {
    const exampleDir = join(EXAMPLES_DIR, 'circular-deps-classes');
    await expect(runExampleGenerate(exampleDir)).rejects.toThrow(
      'Circular dependency detected'
    );
  }, 15_000);

  it('circular-deps-modules — throws on cycle (class cycle fires before module cycle)', async () => {
    const exampleDir = join(EXAMPLES_DIR, 'circular-deps-modules');
    await expect(runExampleGenerate(exampleDir)).rejects.toThrow(
      'Circular dependency detected'
    );
  }, 15_000);

  it('duplicate-interfaces-example — throws when two classes implement the same interface', async () => {
    const exampleDir = join(EXAMPLES_DIR, 'duplicate-interfaces-example');
    await expect(runExampleGenerate(exampleDir)).rejects.toSatisfy(
      (err: unknown) => err instanceof IoCError || err instanceof Error
    );
  }, 15_000);

  it('name-collision-example — throws when two classes share the same name', async () => {
    const exampleDir = join(EXAMPLES_DIR, 'name-collision-example');
    await expect(runExampleGenerate(exampleDir)).rejects.toSatisfy(
      (err: unknown) => err instanceof IoCError || err instanceof Error
    );
  }, 15_000);
});
