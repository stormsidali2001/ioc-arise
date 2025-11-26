import { defineConfig } from '@notjustcoders/ioc-arise/config';

export default defineConfig({
    source: '.',
    output: 'container.gen.ts',
    exclude: ['**/*.test.ts', '**/*.spec.ts'],
    verbose: true,
    modules: {
        UserModule: ['**/**/*User*'],
        ProductModule: ['**/**/*Product*'],
    },
});

