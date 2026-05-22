/**
 * Feature tests: run the full generation pipeline for each happy-path example
 * using an in-memory writer, then compare every output file against the
 * committed golden file sitting next to it in the examples/ directory.
 *
 * To update a golden file after an intentional output change, re-run the
 * corresponding pnpm test*:generate script and commit the result.
 */
import { describe, it, expect } from 'vitest';
import { join, relative } from 'path';
import { runExampleGenerate, examplesDir, readGolden } from './helpers';

const EXAMPLES_DIR = examplesDir();

/**
 * For each example, assert that every file the generator would write
 * matches the committed golden file at the same relative path.
 */
async function assertMatchesGolden(exampleName: string) {
  const exampleDir = join(EXAMPLES_DIR, exampleName);
  const written = await runExampleGenerate(exampleDir);

  expect(written.size).toBeGreaterThan(0);

  for (const [absPath, content] of written.entries()) {
    const rel = relative(exampleDir, absPath);
    const golden = readGolden(absPath);
    expect(content, `mismatch in ${exampleName}/${rel}`).toBe(golden);
  }
}

// ── Flat containers ───────────────────────────────────────────────────────────

describe('flat containers', () => {
  it('minimal-todo', async () => {
    await assertMatchesGolden('minimal-todo');
  }, 15_000);

  it('factory-functions-example', async () => {
    await assertMatchesGolden('factory-functions-example');
  }, 15_000);

  it('use-value-example', async () => {
    await assertMatchesGolden('use-value-example');
  }, 15_000);

  it('scope-example', async () => {
    await assertMatchesGolden('scope-example');
  }, 15_000);

  it('use-cases-example', async () => {
    await assertMatchesGolden('use-cases-example');
  }, 15_000);
});

// ── Instance factories ────────────────────────────────────────────────────────

describe('instance factories', () => {
  it('instance-factories-example', async () => {
    await assertMatchesGolden('instance-factories-example');
  }, 15_000);

  it('instance-factory-with-context-example (context object pattern)', async () => {
    await assertMatchesGolden('instance-factory-with-context-example');
  }, 15_000);

  it('instance-factory-separate-params-example (separate params pattern)', async () => {
    await assertMatchesGolden('instance-factory-separate-params-example');
  }, 15_000);
});

// ── Modular containers ────────────────────────────────────────────────────────

describe('modular containers', () => {
  it('simple-modules', async () => {
    await assertMatchesGolden('simple-modules');
  }, 15_000);

  it('abstract-classes-example', async () => {
    await assertMatchesGolden('abstract-classes-example');
  }, 15_000);

  it('factory-modules-example', async () => {
    await assertMatchesGolden('factory-modules-example');
  }, 15_000);

  it('instance-factories-modules-example', async () => {
    await assertMatchesGolden('instance-factories-modules-example');
  }, 15_000);
});

// ── Advanced / special cases ──────────────────────────────────────────────────

describe('advanced features', () => {
  it('output-subdir-example (output in nested directory)', async () => {
    await assertMatchesGolden('output-subdir-example');
  }, 15_000);

  it('tsconfig-paths-example (path alias resolution)', async () => {
    await assertMatchesGolden('tsconfig-paths-example');
  }, 15_000);

  it('external-types-example (external package types)', async () => {
    await assertMatchesGolden('external-types-example');
  }, 15_000);

  it('word-tracker (large real-world project)', async () => {
    await assertMatchesGolden('word-tracker');
  }, 30_000);
});
