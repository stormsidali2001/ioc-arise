// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

import partytown from '@astrojs/partytown';
// https://astro.build/config
export default defineConfig({
    site: 'https://ioc-arise.notjustcoders.com',
    markdown: {

    },

    integrations: [starlight({

        title: 'IoC Arise',
        logo: {

            light: "./src/assets/logoLight.svg",
            dark: "./src/assets/logoDark.svg"
        },
        head: [
            {
                tag: "script",
                attrs: {
                    //<!-- Cloudflare Web Analytics --><script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "ba9356f1dad0466f9b34fe81fa15c64b"}'></script><!-- End Cloudflare Web Analytics -->
                    defer: true,
                    type: "text/partytown",
                    src: "https://static.cloudflareinsights.com/beacon.min.js",
                    "data-cf-beacon": '{"token": "ba9356f1dad0466f9b34fe81fa15c64b"}'


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
                label: 'Getting Started',
                items: [
                    { label: 'Quick Start', link: '/guides/getting-started/' },
                    { label: 'Basic Example', link: '/examples/minimal-todo/' },
                ],
            },
            {
                label: 'Core Features',
                items: [
                    { label: 'Module System', link: '/core-features/simple-modules/' },
                    { label: 'Abstract Classes Support', link: '/core-features/abstract-classes-example/' },
                    { label: 'Non-Interface Classes', link: '/core-features/use-cases-example/' },
                    { label: 'Scope Management', link: '/core-features/scope-example/' },
                ],
            },
            {
                label: 'Architecture Patterns',
                items: [
                    { label: 'Clean Architecture', link: '/architecture-patterns/clean-architecture/' },
                ],
            },
            {
                label: 'Error Detection',
                items: [
                    { label: 'Name Collision Detection', link: '/error-detection/name-collision-example/' },
                    { label: 'Duplicate Interface Detection', link: '/error-detection/duplicate-interfaces-example/' },
                    { label: 'Circular Dependencies - Classes', link: '/error-detection/circular-deps-classes/' },
                    { label: 'Circular Dependencies - Modules', link: '/error-detection/circular-deps-modules/' },
                ],
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