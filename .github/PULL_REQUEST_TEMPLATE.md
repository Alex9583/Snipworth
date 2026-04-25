## Title convention

Imperative English sentence, no Conventional-Commit prefix. The title lands verbatim in `CHANGELOG.md`. Start with a classifying verb (Add/Introduce → Added, Change/Update/Replace → Changed, Fix → Fixed, Remove/Drop → Removed) so `release.yml` classifies it correctly.

## Summary

<!-- One paragraph: what this PR does and why. -->

## Changes

<!-- Bulleted list of concrete changes. -->

## Test plan

- [ ] `npm run lint`
- [ ] `npm run format:check`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm audit signatures`
- [ ] Manual check: <!-- describe if the change is user-facing -->

## Labels

Choose ONE semver label (required): `patch`, `minor`, or `major`.
Optional: `publish` (triggers Chrome Web Store upload), `skip-release` (no version bump), `breaking` (requires `major`). `publish` and `skip-release` are mutually exclusive.
