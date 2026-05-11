import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import pkg from './package.json' with { type: 'json' };

const repoHttpsUrl = pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
const bmacUrl = pkg.funding;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  define: {
    __SNIPWORTH_REPO_URL__: JSON.stringify(repoHttpsUrl),
    __SNIPWORTH_BMAC_URL__: JSON.stringify(bmacUrl),
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/index.ts'],
    },
  },
});
