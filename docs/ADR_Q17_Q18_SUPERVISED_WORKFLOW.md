# Q17/Q18 — supervised browser-local workflow plan (ADR, 2026-10-14)

## Context
Existing Workflows performs 2–6 sequential external requests, all via one route. Add strict declarative stage roles, conditional branches, named output variables, per-stage provider routing, and durable checkpoints; never execute workflow text as code or auto-select a paid provider.

## Decision
Allow optional pipe directives on a named stage: `Stage label | route=groq | when=contains:text | input=previous | save=variable`. If directives are omitted, preserve existing sequential 2–6 stage behavior and default route. Parse via a strict allowlist and reject unavailable providers prior to any request. Conditions inspect only prior successful plain-text results. Named stage outputs are bounded; a skipped stage makes zero provider calls. Workflows remain explicitly authorized; no automatic trigger or background agent. Save checkpoint before a provider call and after each result; after a tab interruption, offer explicit manual resume, warning that a stage may have been charged before the tab closed.

## Security constraints
No eval, code execution, arbitrary expressions, URL overrides, credential serialization, paid fallback, or automatic resumption. The model text is marked untrusted reference. Cancellation uses AbortController; logs contain stage metadata and capped result text, never vault key. Persisted plans are validated on import. If browser storage fails before a call, abort safely. No claim of live provider connectivity without human credentials.

## Upstream basis
- GitHub Actions conditional jobs: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-jobs-with-conditions (conditions must be explicit; skipped is distinguishable).
- MDN AbortController: https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort (signal cancellation, not transaction rollback).
- MDN structured-clone algorithm: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm (plain serializable checkpoint state; functions are noncloneable).

## Acceptance
Node planner/negative tests; existing browser 3-request workflow backward compatibility; synthetic multi-stage conditions/provider route tests; persistent restart+manual resume; hosted Chromium same-commit SHA and offline shell.
