import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config';
import pkg from './package.json' with { type: 'json' };

const repoHttpsUrl = pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
const bmacUrl = pkg.funding;

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  resolve: { tsconfigPaths: true },
  define: {
    __SNIPWORTH_REPO_URL__: JSON.stringify(repoHttpsUrl),
    __SNIPWORTH_BMAC_URL__: JSON.stringify(bmacUrl),
  },
  build: {
    rollupOptions: {
      input: { tab: 'src/adapters/primary/tab/index.html' },
    },
  },
});
