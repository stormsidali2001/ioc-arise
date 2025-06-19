// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
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

  vite: {
	//@ts-ignore
    plugins: [tailwindcss()],
  },
});