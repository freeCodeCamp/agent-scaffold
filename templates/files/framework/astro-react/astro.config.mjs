// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Lato',
      cssVariable: '--font-lato',
      weights: [400, 700],
    },
    {
      provider: fontProviders.google(),
      name: 'Inconsolata',
      cssVariable: '--font-inconsolata',
      weights: [400, 700],
    },
  ],
  prefetch: {
    // 'viewport' is quite an aggressive strategy.  'hover' could suffice, but we need to experiment.
    defaultStrategy: "viewport",
    prefetchAll: true
  }
});
