/**
 * Configuration types and helpers for IoC Arise CLI
 */

export interface IoCConfig {
    source?: string;
    output?: string;
    interface?: string;
    exclude?: string[];
    checkCycles?: boolean;
    verbose?: boolean;
    modules?: Record<string, string[]>;
}

/**
 * Type-safe configuration helper for IoC Arise
 * Similar to Vite's defineConfig, provides full TypeScript type safety
 * 
 * @param config - The IoC configuration object
 * @returns The same config object (for type inference)
 * 
 * @example
 * ```typescript
 * import { defineConfig } from '@notjustcoders/ioc-arise/config';
 * 
 * export default defineConfig({
 *   source: '.',
 *   output: 'container.gen.ts',
 *   interface: '^I[A-Z]',
 *   modules: {
 *     UserModule: ['user/**']
 *   }
 * });
 * ```
 */
export function defineConfig(config: IoCConfig): IoCConfig {
    return config;
}

