// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'IoC Arise',
			description: 'A powerful TypeScript IoC container generator CLI tool',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'index' },
						{ label: 'Getting Started', slug: 'guides/getting-started' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Examples', slug: 'guides/examples' },
						{ label: 'Working with Modules', slug: 'guides/modules' },
						{ label: 'Dependency Scopes', slug: 'guides/dependency-scopes' },
						{ label: 'Best Practices', slug: 'guides/best-practices' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'CLI Reference', slug: 'reference/cli' },
						{ label: 'Configuration', slug: 'reference/configuration' },
					],
				},
			],
		}),
	],
});
