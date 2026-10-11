# B0.1 GitHub publication checkpoint

**Date:** 2026-10-11
**Repository:** https://github.com/worldlinemuse-lgtm/multi-model-ai-platform
**Branch:** `main`
**Source publication commit:** [`c99380c2d2bcd3c7a0ccb41da28b815d7d7bd3c0`](https://github.com/worldlinemuse-lgtm/multi-model-ai-platform/commit/c99380c2d2bcd3c7a0ccb41da28b815d7d7bd3c0)

## Source identity and provenance

The source was recovered from the existing Persistent File Library release `/Multi-Model AI Platform/05_releases/multimodel_browser_B0_1_BOOTSTRAP_2026_10_11.zip`, **not regenerated**.

- Exact archive SHA-256: `f31b0a28a7dfdd9a186dfbb436819d1dff24316d592461886e9dea60cac9d9d6`.
- ZIP CRC: passed.
- Internal SHA256SUMS: passed for all nine listed source/evidence files.
- All **10** repository files (including the checksum manifest) were independently compared to their original `git hash-object` blob identifiers, read from the published GitHub tree; **10/10 matches**.
- GitHub `main` readback confirmed the published commit and exact tree.
- The immutable A2.6 Python release was not incorporated or modified.
- Existing Muse website repositories were not modified.

## Tests rerun before source publication

- `node --check app.js`: PASS
- `python tests/static_check.py`: PASS
- `node tests/runner_check.cjs`: PASS
- `sha256sum -c SHA256SUMS.txt`: PASS
- Browser smoke test (Chromium/Playwright, `file://`): BLOCKED by VM administrator
- Browser smoke test (Chromium/Playwright, `http://127.0.0.1`): BLOCKED by VM administrator

The last two are **not** counted as passes. Browser rendering, responsive operation, mobile behavior and interactive acceptance remain unverified.

## Implementation boundaries

This B0.1 frontend includes browser-local file editing and persistence, JSON import/export, a constrained JavaScript runner, HTML preview, and an informational directory of eight recurring-free API routes. It has no live AI provider inference, observed account quotas, API key vault, Python runtime, or multi-model routing. No real credentials or databases were uploaded.

**GitHub Pages deployment has not been enabled or verified.** Source publication does not imply a hosted website.

## Historical status note

`docs/STATUS.md` and `tests/verification.txt` are exact files from the original B0.1 archive. Their references to the earlier GitHub HTTP 403 blocker describe the historical staging checkpoint. This record supersedes those lines **for publication status only**; it does not rewrite the archival source or its test results.

## Persistent state

The source remains archived at `05_releases/multimodel_browser_B0_1_BOOTSTRAP_2026_10_11.zip`. Extracted source copies were additionally persisted under `03_construction/B0_1/`. This publication checkpoint is preserved in `04_verification/B0_1_GITHUB_PUBLICATION_2026_10_11.md` and in the repository under `docs/PUBLICATION_2026_10_11.md`.

**Status: SOURCE PUBLISHED and HASH-VERIFIED. Browser acceptance and Pages hosting are unverified.**
