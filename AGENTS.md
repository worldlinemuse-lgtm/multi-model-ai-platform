# Repository instructions for Codex and other development assistants

## Scope and continuity
This repository is **only** `worldlinemuse-lgtm/multi-model-ai-platform`. Never modify the owner's other Muse repositories, historical release archives, or unrelated projects. Continue the existing browser-first platform; do not rebuild it from memory.

## Established GitHub write access — DO NOT FORGET
The user installed the official Codex Connector GitHub App for the `worldlinemuse-lgtm` owner account on 2026-10-11, selecting **only this repository**. The owner-connected app was live-verified on 2026-10-14 (installation ID `170172667`) and successfully performed feature-branch creation, guarded source commits, a PR, authorized merge, and production deployment.

Proof: [PR #40](https://github.com/worldlinemuse-lgtm/multi-model-ai-platform/pull/40) merged as `f73fb9a72c0b2cb5d631a0a0e1770f9711cd600e`; [postmerge Actions run 38602358771](https://github.com/worldlinemuse-lgtm/multi-model-ai-platform/actions/runs/38602358771) passed checks, Pages deployment, hosted file integrity, and real browser acceptance.

**Do not conclude that GitHub writing is unavailable because one other connector action was denied or a particular sandbox's native `git` lacks DNS.** Check and use the existing authorized owner GitHub App connection first. When a specific tool action is denied, report the exact denial; **do not** bypass it using another account, tool or pathway. The previous PR38 merge and a vault module update were denied separately and must not be retried through alternatives.

## Correct development/release flow
1. Read the current `main` SHA and existing source/tests. Consult the user's Persistent File Library authority `/Multi-Model AI Platform/00_authority/00_READ_FIRST_GITHUB_WRITE_CAPABILITY_2026_10_14.md` when available.
2. Reconcile changes against fresh `main`, **preserving PR39 startup/Cloudflare/Node24 and PR40 offline-cache fixes**. Pages-derived local ZIP releases are staging; do not overwrite main with them.
3. Use the existing authorized `worldlinemuse-lgtm` connection, create a feature branch from the pinned main SHA, and make source-guarded changes with regression tests. Never push directly to `main`.
4. Open a PR, inspect diff, require fresh unit/static and real Chromium CI, independent review, normal permitted merge with pinned PR head.
5. Re-read merged main SHA, postmerge GitHub Pages deploy, exact published asset integrity and public Chromium acceptance. Make no production claim without those observations.
6. Save checkpoint, source guards, test evidence, hash manifest and Library readback under `/Multi-Model AI Platform/04_verification/`. Keep the scheduled continuation current.

## Product boundaries
No live AI provider calls, keys, secrets, charges or inferred quota claims without explicit user authorization; user-controlled real provider setup deferred until October 15, 2026. No invented product features. Treat `main` + verified GitHub deployment as the executable source of truth; Library as the durable project decision/evidence record. One PR40 fix deployed; remaining V5–V6 hardening staging still requires separate integration.

More detail: [`docs/GITHUB_OPERATIONS.md`](docs/GITHUB_OPERATIONS.md). These repository instructions are contextual; higher-priority user/system instructions and current access policies prevail.
