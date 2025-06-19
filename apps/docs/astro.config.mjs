// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://stormsidali2001.github.io',
  base: '/ioc-arise',
  markdown:{

	},

  integrations: [
      starlight({
		
          
          title: 'IoC Arise',
          description: 'A powerful TypeScript IoC container generator CLI tool',
          social: [
              { icon: 'github', label: 'GitHub', href: 'https://github.com/spithacode/ioc-maker' },
              { icon: 'external', label: 'NotJustCoders', href: 'https://notjustcoders.com' }
          ],
          customCss: [
              // Path to your Tailwind base styles:
              './src/styles/global.css',
          ],
          components: {
              Footer: './src/components/Footer.astro',
              SocialIcons: './src/components/SocialIcons.astro',
              SiteTitle: './src/components/SiteTitle.astro',
          },
          sidebar: [
              {
                  label: 'Guides',
                  items: [
                      { label: 'Getting Started', link: '/guides/getting-started/' },
                  ],
              },
              {
                  label: 'Examples',
                  autogenerate:{directory:"examples"}
              },
              {
                  label: 'Reference',
                  items: [
                      { label: 'CLI Reference', link: '/reference/cli-reference/' },
                      { label: 'Configuration', link: '/reference/configuration/' },
                  ],
              },
          ],
      }),
	],

  vite: {
	//@ts-ignore
    plugins: [tailwindcss()],
  },
});