# Q03 stage 3 — browser module execution, tested but not deployed

## What was built

- `src/module-runtime.js` validates a bounded virtual graph using the existing Q03 stage-2 compiler, serializes it into an opaque-origin sandboxed iframe, and launches a disposable classic Worker which creates and links module Blob URLs inside that isolated origin.
- `src/module-linker.js` now exposes the exact tested rewrite/link functions and their lexical RegExp dependencies as `linkerWorkerSource()`, avoiding a missing-binding runtime failure found in Chromium.
- `src/module-graph.js` rejects comment-obfuscated dynamic imports (`import/*...*/(...)`) discovered during security testing.
- `tools/apply_q03_integration.py` fail-closed patcher wires the new runtime into the existing `src/sandbox.js` and `src/main.js` only when exact compatible anchors are present. Existing classic JS and Pyodide paths remain unchanged; `.mjs` or `.js` with top-level static import/export uses module execution.
- Tests: 21 Node cases, 3 Python patch unit cases, and real local Chromium execution of two-file imports, re-export, opaque Worker globals, CSP-blocked network fetch, and user Stop of an infinite loop.

## Evidence and limits

The browser test uses Playwright `page.set_content()` with source modules injected in isolated closures because this VM's HTTP navigation is blocked by administrator policy (`ERR_BLOCKED_BY_ADMINISTRATOR`). It is **real Chromium execution**, but not an actual hosted site or full checkout. The integration patch is tested against exact source anchors in fixtures; it has **not** been applied and tested against the complete production repository in this VM. No branch CI or public hosted verification. GitHub PR creation remains tool-blocked.

Worker behavior is bounded by the existing RuntimeRunner's 6-second JS timeout, 180-message output cap and parent iframe removal, once integrated. Stage-3 Chromium directly verified Stop and CSP. No claims for npm, import maps, external dependencies, top-level-await persistence, complex multiline imports, dynamic imports, circular dependencies, WebAssembly imports or offline packages. Conservative unsupported syntax is rejected.

## Integration acceptance gate

1. Apply `tools/apply_q03_integration.py` to a fresh main checkout and inspect diff.
2. Copy `src/module-graph.js`, `src/module-linker.js`, `src/module-runtime.js` and Q03 tests into the checkout.
3. Add these three modules to the service-worker SHELL list and increment its cache key; update SHA256SUMS.txt and hosted integrity checks. This has not yet been performed by the stage-3 patcher.
4. Run all existing Node/Python checks, full-site Chromium, Q03 Chromium, and hosted PR CI. Require separate post-merge hosted acceptance before marking Q03 verified.
5. Do not push to main directly or merge without PR checks.

## Known follow-ups

- Q03-SEC-002: comment-obfuscated dynamic import could bypass stage-2 lexical check; fixed in stage-3 source, regression added. This is a staged-only issue, not a deployed exploit.
- Q03-BROWSER-001: first worker serialization omitted linker RegExp constants and failed real Chromium. Fixed with `linkerWorkerSource`, then browser acceptance passed.
- Q03-INTEGRATION-001: full production checkout integration and SW/cache/hashes still required before branch PR and hosted acceptance.