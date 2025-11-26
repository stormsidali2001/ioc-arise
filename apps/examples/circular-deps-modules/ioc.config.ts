import { defineConfig } from '@notjustcoders/ioc-arise/config';

export default defineConfig({
  source: '.',
  output: 'container.gen.ts',
  interface: 'I[A-Z].*',
  exclude: ['**/*.test.ts', '**/*.spec.ts'],
  verbose: true,
  modules: {
    ModuleA: ['services/ServiceA.ts', 'interfaces/IServiceA.ts'],
    ModuleB: ['services/ServiceB.ts', 'interfaces/IServiceB.ts'],
  },
});

