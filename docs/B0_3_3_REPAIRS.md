# B0.3.3 remediation batch — code-level disposition

**Source baseline:** B0.3.2, commit `1da377eeb5c8c71903d7a21363440a9c7fbaf353`. **Preserve original 60-finding audit.**

## Addressed in this batch (source + test)

| Audit ID | Implemented work | Verification |
|---|---|---|
| D01, P32 | Validate references, preferences, chat, projects, notes, snapshots, audit and workflow schemas before replacing state | Node malformed-backup fixtures; browser invalid restore |
| D02 | Persist new state first; no success if IndexedDB write fails; cancel queued timer | Chromium injected IndexedDB transaction failure for restore/reset |
| D03 | Blank, booleans and invalid values excluded from numeric stats, zeros remain legitimate | Node numeric cases and browser 10/blank/20 |
| D04, D05 | Correct workflow stage indices and reject >6 stages visibly | Source + browser stage-cap test |
| D06, D07 | Explicit second provider; provider-specific assistant histories | Node isolated history test and Chromium chooser |
| D08 | Versioned note export/import plus legacy note-array import, atomic batch validation | Node roundtrip and Chromium export/delete/import |
| D10 | Restore Cloudflare account ID when managing its key via provider card | Chromium fake-key vault navigation |
| D11 | Remove stale analysis on parse failure, reset axes and chart | Chromium valid-then-invalid data test |
| D12 | Distinguish volatile memory from IndexedDB in save indicator | Node volatile memory test; browser storage failures |
| P07 | Keep absent provider token fields as unknown/null, no fabricated zeros | Node API parser cases |
| D14, P21 (claim only) | Correct misleading history edit/search description and relabel log output, not claim a working shell | Static inspection |
| P33 (partial) | Add targeted browser regression test in both checkout and hosted workflows | CI test run required |

## Remains open

Other findings in the original audit are **not** silently marked fixed. Real provider accounts/CORS, workflow research retrieval, per-stage model assignment, Python WASM browser execution, richer tooling, PDF/DOCX extraction, web search, real quota feed and all unrepaired D/P/N items remain open.

## Trust model

An unused API key slot or unknown quota is a valid waiting state. No mock provider replies are shown as real; fake keys in tests stay in an isolated browser context and trigger **no inference request**. Source tests alone are not proof of deployment.
