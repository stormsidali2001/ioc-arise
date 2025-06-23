// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

import partytown from '@astrojs/partytown';
import logoUrl from '../docs/public/logoDark.png';
import logoUrlLight from '../docs/public/logoLight.png';
// https://astro.build/config
export default defineConfig({
  site: 'https://ioc-arise.notjustcoders.com',
  markdown:{

    },

  integrations: [starlight({
		
      title: 'IoC Arise',
      logo: {
        light: logoUrlLight,
        dark: logoUrl
      },
      head:[
        {
            tag:"script",
            attrs:{
                //<!-- Cloudflare Web Analytics --><script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "ba9356f1dad0466f9b34fe81fa15c64b"}'></script><!-- End Cloudflare Web Analytics -->
                defer:true,
                type:"text/partytown",
                src:"https://static.cloudflareinsights.com/beacon.min.js",
                "data-cf-beacon":'{"token": "ba9356f1dad0466f9b34fe81fa15c64b"}'


            }
        }

      ],
      description: 'A powerful TypeScript IoC container generator CLI tool',
      social: [
          { icon: 'github', label: 'GitHub', href: 'https://github.com/stormsidali2001/ioc-arise' },
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
  }), sitemap(), partytown()],

  vite: {
    //@ts-ignore
    plugins: [tailwindcss()],
  },
});