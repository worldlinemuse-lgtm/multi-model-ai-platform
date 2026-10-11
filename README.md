# Multi-Model AI Platform — Browser B0.1

A standalone, static browser workspace for experiments with legitimate, recurring-free AI API access. This repository is independent of Muse's existing website.

## Working features

- Responsive human-facing dashboard and implementation-status panels
- Eight documented recurring-free **candidate** API routes with official key-setup and limits links
- Multi-file browser editor, create/rename/delete, localStorage persistence, JSON import/export
- JavaScript execution in an ephemeral opaque-origin sandboxed iframe; 5-second limit, stop, output/error capture
- HTML/CSS/inline JavaScript previews in an opaque-origin sandboxed iframe with restrictive CSP

## Usage

Serve these static files from any simple HTTP server (for example `python -m http.server 8000` in this folder) and open the page. Static GitHub Pages deployment is compatible with the architecture but is **not** evidence of a deployment.

The project stores editor files in this browser's localStorage. Export JSON regularly. Project imports replace the current project after confirmation.

## Boundaries

This B0.1 frontend does **not** connect to model providers or collect credentials. It has no real quota telemetry, remote inference, multi-model router, or browser Python runtime. Listed plans and resets are research-backed, not live-account verified. No real API keys or user databases belong in this public repository.

Browser code execution is not a Linux VM and is not a guarantee against all browser vulnerabilities. The opaque-origin iframe deliberately does not receive same-origin access; the restrictive CSP blocks network connections. This build is experimental, not security-accredited for arbitrary hostile code.

The separately archived **A2.6** offline Python/SQLite control plane with encrypted local key vault is preserved unchanged in the Persistent File Library under `/Multi-Model AI Platform/05_releases/`. It has not been migrated to or deployed as a public backend.

See `docs/STATUS.md` for source provenance and test status.
