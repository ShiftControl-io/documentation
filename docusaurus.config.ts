import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
    title: 'ShiftControl Documentation',
    tagline: 'Manage identities, groups, and SaaS applications from one platform.',
    favicon: 'img/favicon.png',

    url: 'https://docs.shiftcontrol.io',
    baseUrl: '/',

    // Cloudflare Pages forces trailing slashes via 308 redirect.
    // This ensures Docusaurus-generated links match the final URL,
    // eliminating redirect chains and fixing canonical URL consistency.
    trailingSlash: true,

    onBrokenLinks: 'throw',
    markdown: {
        hooks: {
            onBrokenMarkdownLinks: 'warn',
        }
    },

    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },

    headTags: [
        {
            tagName: 'script',
            attributes: {
                type: 'application/ld+json',
            },
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org/',
                '@type': 'Organization',
                name: 'ShiftControl',
                url: 'https://shiftcontrol.io/',
                logo: 'https://docs.shiftcontrol.io/img/logo/light.svg',
                sameAs: [
                    'https://www.linkedin.com/company/shift-control-io',
                    'https://github.com/shiftcontrol-io',
                ],
            }),
        },
        {
            tagName: 'script',
            attributes: {
                type: 'application/ld+json',
            },
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org/',
                '@type': 'WebSite',
                name: 'ShiftControl Documentation',
                url: 'https://docs.shiftcontrol.io/',
            }),
        },
    ],

    presets: [
        [
            'classic',
            {
                docs: {
                    routeBasePath: '/',
                    sidebarPath: './sidebars.ts',
                    editUrl:
                        'https://github.com/ShiftControl-io/documentation/edit/main',
                },
                blog: false,
                sitemap: {
                    lastmod: 'date',
                    changefreq: 'weekly',
                    priority: 0.5,
                    filename: 'sitemap.xml',
                },
                theme: {
                    customCss: './src/css/custom.css',
                },
            } satisfies Preset.Options,
        ],
    ],

    themeConfig: {
        colorMode: {
            defaultMode: 'dark',
            disableSwitch: false,
            respectPrefersColorScheme: true,
        },
        image: 'img/shiftcontrol_social.png',
        metadata: [
            {name: 'keywords', content: 'ShiftControl, identity management, SaaS management, JumpCloud, Google Workspace, user provisioning, group management, IT administration'},
            {name: 'twitter:card', content: 'summary_large_image'},
            {property: 'og:type', content: 'website'},
            {property: 'og:site_name', content: 'ShiftControl Documentation'},
        ],
        navbar: {
            title: 'Documentation',
            logo: {
                alt: 'ShiftControl',
                src: '/img/logo/light.svg',
                srcDark: '/img/logo/dark.svg',
            },
            items: [
                {
                    type: 'docSidebar',
                    sidebarId: 'mainSideBar',
                    position: 'left',
                    label: 'Quickstart',
                },
                {
                    type: 'docSidebar',
                    sidebarId: 'onboardingSidebar',
                    position: 'left',
                    label: 'Onboarding',
                },
                {
                    type: 'docSidebar',
                    sidebarId: 'appGuidesSideBar',
                    position: 'left',
                    label: 'App Guides',
                },
                {
                    type: 'search',
                    position: 'right',
                },
            ],
        },
        footer: {
            links: [
                {
                    html: '<a href="https://www.linkedin.com/company/shift-control-io" target="_blank" rel="noopener noreferrer">\n' +
                        '        <svg\n' +
                        '            xmlns="http://www.w3.org/2000/svg"\n' +
                        '            width="1.5em"\n' +
                        '            height="1.5em"\n' +
                        '            viewBox="0 0 24 24"\n' +
                        '        >\n' +
                        '            <path fill="currentColor" d="M20.47 2H3.53a1.45 1.45 0 0 0-1.47 1.43v17.14A1.45 1.45 0 0 0 3.53 22h16.94a1.45 1.45 0 0 0 1.47-1.43V3.43A1.45 1.45 0 0 0 20.47 2M8.09 18.74h-3v-9h3ZM6.59 8.48a1.56 1.56 0 1 1 0-3.12a1.57 1.57 0 1 1 0 3.12m12.32 10.26h-3v-4.83c0-1.21-.43-2-1.52-2A1.65 1.65 0 0 0 12.85 13a2 2 0 0 0-.1.73v5h-3v-9h3V11a3 3 0 0 1 2.71-1.5c2 0 3.45 1.29 3.45 4.06Z" />\n' +
                        '        </svg>\n' +
                        '    </a>',
                },
                {
                    html: '<a href="https://github.com/shiftcontrol-io" target="_blank" rel="noopener noreferrer">\n' +
                        '<svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24">\n' +
                        '    <g fill="none">\n' +
                        '        <g clip-path="url(#akarIconsGithubFill0)">\n' +
                        '            <path fill="currentColor" fill-rule="evenodd" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385c.6.105.825-.255.825-.57c0-.285-.015-1.23-.015-2.235c-3.015.555-3.795-.735-4.035-1.41c-.135-.345-.72-1.41-1.23-1.695c-.42-.225-1.02-.78-.015-.795c.945-.015 1.62.87 1.845 1.23c1.08 1.815 2.805 1.305 3.495.99c.105-.78.42-1.305.765-1.605c-2.67-.3-5.46-1.335-5.46-5.925c0-1.305.465-2.385 1.23-3.225c-.12-.3-.54-1.53.12-3.18c0 0 1.005-.315 3.3 1.23c.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23c.66 1.65.24 2.88.12 3.18c.765.84 1.23 1.905 1.23 3.225c0 4.605-2.805 5.625-5.475 5.925c.435.375.81 1.095.81 2.22c0 1.605-.015 2.895-.015 3.3c0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12" clip-rule="evenodd" />\n' +
                        '        </g>\n' +
                        '        <defs>\n' +
                        '            <clipPath id="akarIconsGithubFill0">\n' +
                        '                <path fill="#fff" d="M0 0h24v24H0z" />\n' +
                        '            </clipPath>\n' +
                        '        </defs>\n' +
                        '    </g>\n' +
                        '</svg>' +
                        '</a>',
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} Shift Control Pte. Ltd.`,
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
        },
        zoom: {
            selector: '.markdown img',
            background: {
                light: 'rgb(255, 255, 255)',
                dark: 'rgb(50, 50, 50)'
            },
            config: {
                // options you can specify via https://github.com/francoischalifour/medium-zoom#usage
            }
        }
    } satisfies Preset.ThemeConfig,
    plugins: [
        'docusaurus-plugin-image-zoom',
        [
            require.resolve('docusaurus-lunr-search'), {
            indexBaseUrl: true,
            maxHits: 5,
        }
        ],
        [
            "posthog-docusaurus",
            {
                apiKey: "phc_gx4HhxsAs4ycvgq2uOlG6Q2sAgUBgvUm7OGrOOpXZcO",
                appUrl: "https://velocity.shiftcontrol.io",
                enableInDevelopment: false,
            },
        ],
    ],
};

export default config;
