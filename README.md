<div align="center">

# Snipworth

**Beautiful code snippets, ready to post.**

A Chrome extension for developers who share code on social media. Turn any snippet into a polished image in one click — right from a side panel or a full tab.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![CI](https://img.shields.io/github/actions/workflow/status/Alex9583/Snipworth/ci.yml?branch=main&label=CI)](https://github.com/Alex9583/Snipworth/actions/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/alextdev)

</div>

---

## Features

- Side panel that stays open while you browse, plus a full-tab mode
- Paste or capture code via right-click → _"Snipworth this code"_
- Syntax highlighting with [Shiki](https://shiki.style/) (VS Code-level quality)
- Export PNG or SVG at 1x / 2x / 4x resolution
- 100% local — your data never leaves your machine
- Open source (MIT), no tracking, no analytics

## Install

> **Not yet published** — install from source below, or follow the repo for release announcements.

### From source

1. Clone the repo: `git clone https://github.com/Alex9583/Snipworth.git`
2. Install and build: `npm install && npm run build`
3. In Chrome, open `chrome://extensions/`, enable **Developer mode**, click **Load unpacked**, and select the `dist/` folder.

## Development

Requires Node ≥ 24 (npm ships bundled).

```bash
npm install
npm run dev          # Vite HMR for the extension
npm test             # Vitest + React Testing Library
npm run test:e2e     # Playwright (loads dist/ as unpacked)
npm run build        # production bundle into dist/
```

## Support

If Snipworth saves you time, consider supporting its development:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-Support%20Snipworth-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/alextdev)

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow. Bug reports and feature requests go to [GitHub Issues](https://github.com/Alex9583/Snipworth/issues).

## License

MIT — see [LICENSE](LICENSE).
