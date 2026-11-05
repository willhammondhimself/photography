// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
  site: 'https://willhammondhimself.github.io',
  base: '/photography',
  trailingSlash: 'always',
  // Keeps the whitespace between inline links instead of stripping it.
  compressHTML: true,
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  image: { breakpoints: [320, 480, 640, 960, 1280, 1920, 2560, 3200] },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Schibsted Grotesk',
      cssVariable: '--font-sans',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    },
  ],
});
