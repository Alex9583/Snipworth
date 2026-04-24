# Security Policy

## Reporting a Vulnerability

Please do not open a public issue for security reports.

Preferred: open a private **Security Advisory** at https://github.com/Alex9583/Snipworth/security/advisories/new — GitHub notifies the maintainer privately.

Alternative: open a regular issue at https://github.com/Alex9583/Snipworth/issues with the `security` label and no reproduction details; the maintainer will reach out for a private channel.

Response time: best-effort within a month or so. Snipworth is maintained as a side project.

## Scope

Snipworth is a local-first Chrome extension. There is no backend, no server, no data transmitted. Vulnerability surface is:

- Code execution within the extension context
- Clipboard / file system operations triggered by user input
- Third-party dependencies shipped in the bundle

Out of scope: issues in upstream dependencies (report to them), Chrome browser bugs, social engineering.
