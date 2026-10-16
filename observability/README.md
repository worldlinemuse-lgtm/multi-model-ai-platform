# OpenTelemetry — production workshop integration

The real OpenTelemetry SDK (2.12.0) is wired into the production workshop via
`src/otel-workshop.js`. This directory holds the SDK pilot modules, the
pinned dependency lockfile, tests, and the browser-bundle build.

## Architecture

```
src/main.js ──attachOtel()──▶ src/otel-workshop.js ──dynamic import──▶ observability/dist/*.js
     │                                │                                (built by `npm run bundle`)
     │                                │──▶ WhitelistMemoryExporter (traces, in-memory)
     │                                └──▶ OnDemandReader (metrics, in-memory)
     └──▶ src/request-trace.js (existing local counters; unchanged behavior)
```

- **One tracing provider, one metrics provider**, created once per page load
  by `initOtelBridge()` (async, 5s timeout, never throws, never blocks boot).
- **Decorator pattern**: `attachOtel()` wraps the existing metrics object; every
  `begin`/`finish`/`record` mirrors to the SDK. Zero call-site changes.
- **Local-only**: memory exporters, no OTLP, no fetch/XHR/WebSocket in the
  bundles (pinned by `tests/otel-security.test.mjs`). No global tracer
  provider, no auto-instrumentation.
- **Fixed dictionaries**: only pre-approved operation/outcome/reason labels
  reach the SDK. Invalid labels throw before either SDK sees them.

## Operation coverage matrix

| App operation   | OTel operation            | Instrumented at |
|-----------------|---------------------------|-----------------|
| boot            | workshop.boot             | module init     |
| code-run        | workshop.code_run         | runCode / onStop / supersede |
| save            | workshop.project_save     | saveSoon / saveNow |
| preview         | workshop.preview          | previewPage |
| snapshot        | workshop.snapshot         | snapshot / restoreSnapshot |
| project-import  | workshop.project_import   | importProject / importTextFiles / importBinaryAssets / importAll |
| project-export  | workshop.project_export   | export-json / export-zip / exportAll / snapshot export |
| data-analyze    | workshop.data_analyze     | doAnalyze / group-run / transform-apply |
| offline-refresh | workshop.offline_refresh  | refreshOfflineCache |
| storage-check   | workshop.storage_check    | boot storage read |
| ui-error        | — (not mirrored)          | record only |

## Trace schema (WhitelistMemoryExporter)

Each retained event: `{op, outcome, reason, durationMs, traceId, spanId,
parentSpanId}` — all fixed-format. `traceId` 32 hex chars, `spanId`/`parentSpanId`
16 hex chars (null when absent). Outcomes: `ok, error, timeout, cancelled,
warning, unknown`. Reasons: `none, invalid-input, worker-failed, runtime-failed,
time-limit, user-stop, superseded, parent-closed, storage-failed,
offline-unavailable, resource-limit, unsupported, unobserved`.

## Metric schema (OnDemandReader)

Instruments: `mm.workshop.operation.completed` (counter),
`mm.workshop.operation.duration` (histogram, ms),
`mm.workshop.operation.active` (up-down counter). Attributes are fixed
`mm.operation` / `mm.outcome` pairs only. Collected on demand via `collect()`;
no periodic exporter.

## Resource limits

- 20 max active spans (excess starts rejected, counted as `discardedStarts`)
- 160 max retained trace events (oldest dropped, counted as `discarded`)
- Durations clipped at 600,000 ms
- Metrics: 80 cardinality limit, 64 KiB max diagnostic report

## Failure recovery

| Condition | Behavior |
|---|---|
| Bundle missing (404) | state `unavailable`; workshop runs normally |
| Bundle corrupt / factory throws | state `failed`; half-created pilot shut down |
| Import > 5s | state `unavailable` (timeout) |
| SDK throws at runtime | guarded; workshop behavior never affected |
| User disables toggle | state `disabled`; mirror gated, base counters follow toggle |
| Clear diagnostics | active OTel spans finished, both SDKs cleared |

## Build & deploy

- `npm ci` (pinned `package-lock.json`) → `npm test` → `npm run bundle`
- CI builds `observability/dist/` in `checks`, uploads as the `otel-dist`
  artifact, and `deploy` restores it before publishing to GitHub Pages.
- `dist/` is gitignored; the bundles are verified byte-for-byte against the
  deployed site by `tests/hosted_integrity.py`.
- Production dependencies: `@opentelemetry/api`, `@opentelemetry/resources`,
  `@opentelemetry/sdk-trace`, `@opentelemetry/sdk-metrics` (all Apache-2.0).
  Build-only: `esbuild` (MIT).

## Privacy

No user content ever reaches the SDK: no code, prompts, filenames, URLs,
keys, or raw error text. The exporter allowlists span names and drops foreign
spans. Nothing is transmitted off-device. Telemetry faults cannot affect
application behavior (every mirror call is guarded).
