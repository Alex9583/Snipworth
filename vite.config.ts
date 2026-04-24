import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config';

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  resolve: { tsconfigPaths: true },
  build: {
    rollupOptions: {
      input: { tab: 'src/tab/index.html' },
    },
  },
});
