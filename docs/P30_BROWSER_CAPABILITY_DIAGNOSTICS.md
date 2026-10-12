# P30 — Live local browser capability signals

Status: branch candidate. Source badge inventory remains architectural documentation, not a provider health report.

## Implemented
- Capabilities screen now includes a separate **Live browser diagnostics** section with a manually refreshable read-only report.
- Observed signals: secure context, IndexedDB API presence (not write success), Web Worker API, minimal WebAssembly module validation, WebGPU API presence (not device/model availability), speech synthesis and recognition API presence, service-worker controller state, Web Crypto API, storage persistence grant and current microphone permission state.
- Permission checks use the read-only Permissions API; they do **not** request microphone access or record audio. Both async checks have a bounded 3.5-second deadline and show UNKNOWN/UNSUPPORTED when blocked.
- Remote provider/account/model/free-plan health remains **NOT VERIFIED** unless a separately authorized live provider test succeeds. No credentials, network calls or account telemetry are used.
- Static architecture capability badges remain separate from live browser observations to avoid conflating implementation scope with particular-device availability.

## Correctness boundaries
- `API PRESENT` is never called a functioning end-to-end result. Microphone `GRANTED` status is **not** an assurance of speech recognition success. WebGPU exposed is **not** confirmation of an adapter, GPU model or browser-local LLM.
- `navigator.storage.persisted() === false` indicates persistent-storage grant is not guaranteed, not that IndexedDB content is necessarily temporary.
- Cross-browser variation and permission-query rejection are reported explicitly, not as a pass.

## Acceptance
- `tests/capability-probes.test.mjs` uses controlled browser objects to verify supported, absent and permission-query-failure labels.
- `tests/full_site_browser.py` checks real Chromium diagnostics, provider NOT VERIFIED, WebAssembly and microphone entries, refresh completion and absence of fatal JavaScript errors.
- Offline shell and hosted integrity include the new module.
