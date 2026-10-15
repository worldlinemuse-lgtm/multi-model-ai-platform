# OpenTelemetry JavaScript SDK — isolated workshop pilot (not deployed/instrumented)

This directory is an **independent opt-in SDK feasibility harness**. No application module imports this prototype. It is **not** a replacement for the existing V6.8 metrics or the unmerged PR46 standalone contract. It does not touch previously blocked telemetry/source writes or alter the production workshop.

### Pinned initial stack (Oct 15, 2026)

- `@opentelemetry/api` 1.9.0
- `@opentelemetry/sdk-trace` 2.12.0 (new consolidated `TracerProvider`, **not deprecated `sdk-trace-web`**)
- `@opentelemetry/resources` 2.12.0
- `esbuild` 0.25.12 (build-only dependency)

`npm install` inside this directory is required once, then `npm test` and `npm run bundle`. A production adoption should commit a generated and audited lockfile, use `npm ci`, perform SBOM/license checks, and verify exact bundle SHA across hosted output before wiring it into the application. These are not yet satisfied by this pilot.

The pilot creates a real `TracerProvider`, an `AlwaysOnSampler`, `SimpleSpanProcessor`, `resourceFromAttributes` with fixed service metadata, and a custom **local-only** OpenTelemetry `SpanExporter` whose export callback returns SUCCESS. No fetch, XMLHttpRequest, localStorage, IndexedDB, console exporter, OTLP exporter, automatic instrumentation, browser global tracer provider, or cross-origin propagation is registered. Parent contexts are explicit handles across async work, which avoids auto-patching user code.

The exporter projects only allowlisted fixed semantic fields; it never stores OTel ReadableSpan objects or arbitrary attributes. Counters and 160 retained events stay in memory. It holds at most 20 active spans. `shutdown()` terminates outstanding spans with `unknown` and flushes/shuts down the SDK. This is deliberately not a general-purpose provider instrumentation SDK or a browser error logger.

`browser-harness.html` uses a locally built JS bundle with a real Chromium smoke. The test fails if the pilot attempts any external request or produces a page exception. It is NOT a browser test of the production main interface.

**Known gaps:** current shell network access is unavailable, so local full-sdk tests and bundling require GitHub-hosted CI. `npm` installation and the real-SDK test must pass there before the integration is called configured. A pinned lockfile, benchmark on all target browsers, independent dependency audit, and production UX connection remain later gates. Never enable remote exports without explicit approval.

Official OpenTelemetry JS consolidated SDK documentation: https://github.com/open-telemetry/opentelemetry-js/tree/main/packages/sdk-trace
