# Contributing to Snipworth

Thanks for your interest. Snipworth is maintained as a side project — expect responses within a month or so.

## Local setup

1. Fork and clone the repo.
2. `npm install`
3. `npm run dev` for HMR, `npm run build` to produce `dist/`, then load `dist/` as an unpacked extension in Chrome (`chrome://extensions/` → Developer mode → Load unpacked).

## Workflow

- Pick an open issue labeled `good-first-issue` or `help-wanted`, or open a new issue describing your proposal before coding.
- Branch naming: `<type>/<slug>` where `<type>` is one of `feat`, `fix`, `chore`, `refactor`, `docs`, `polish`.
- Every PR must pass CI: lint, format check, typecheck, unit tests, build, semver label validation, and `npm audit signatures` (supply-chain check).
- PR title is the line that will appear in `CHANGELOG.md`. Write it in the imperative: `Add X`, `Fix Y`, `Replace Z` — no conventional-commit prefix.
- PR must carry exactly **one** semver label: `patch`, `minor`, or `major`. CI fails otherwise.
- Merges to `main` are squash-only (1 PR = 1 commit on `main`).

## Testing

- **Business logic** (TDD strict): write the failing test first, then the minimum implementation to make it pass.
- **React components**: React Testing Library, focus on behavior and accessibility. Do not test styling or layout.
- **End-to-end flows**: Playwright with the extension loaded unpacked against `dist/`.

Before opening a PR, run locally:

```bash
npm run lint && npm run format:check && npm run typecheck && npm test && npm run build
```

## Code style

- TypeScript strict with `noUncheckedIndexedAccess`.
- No `any`, no `@ts-ignore` without a written justification.
- UI strings live in `src/lib/strings/`. No hardcoded strings in components.
- All `chrome.*` usage goes through wrappers in `src/lib/` — components never call `chrome` APIs directly.

## Security

If you discover a vulnerability, **please do not open a public issue**. See [SECURITY.md](SECURITY.md) for the private reporting channel.
