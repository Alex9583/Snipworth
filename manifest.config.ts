import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json' with { type: 'json' };

export default defineManifest({
  manifest_version: 3,
  name: 'Snipworth',
  description: 'Beautiful code snippets, ready to post.',
  version: pkg.version,
  icons: {
    16: 'public/icons/icon-16.png',
    32: 'public/icons/icon-32.png',
    48: 'public/icons/icon-48.png',
    128: 'public/icons/icon-128.png',
  },
  action: { default_title: 'Snipworth' },
  side_panel: { default_path: 'src/adapters/primary/sidepanel/index.html' },
  background: {
    service_worker: 'src/adapters/primary/background/service-worker.ts',
    type: 'module',
  },
  permissions: ['sidePanel', 'contextMenus', 'storage', 'activeTab', 'scripting', 'tabs'],
  minimum_chrome_version: '114',
});
