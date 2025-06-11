// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	markdown:{

	},
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
					],
				},
				{
					label: 'Guides',
					items: [
					],
				},
				{
					label: 'Reference',
					items: [
					],
				},

				{
					label: 'Examples',
					autogenerate:{directory:"examples"}
				},
			],
		}),
	],
});
