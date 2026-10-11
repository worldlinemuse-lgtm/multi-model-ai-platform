# Implementation truth — B0.3 browser studio

Date: 2026-10-11. Current GitHub code is a new static-browser development increment, built after recovering the verified B0.1 and B0.2 historical sources from the Persistent File Library.

## Implemented and testable without an API key

- Twelve responsive user-facing sections with navigation overlay and keyboard section search.
- IndexedDB state containing separate projects, files, snapshots, threads, notes, audit entries and workflow records; legacy B0.1/B0.2 project migration; JSON/ZIP project import and export; browser storage backup and confirmation-based restore.
- JavaScript code editor, local file management and worker execution in a sandboxed iframe with opaque origin, worker termination, output flood bound and six-second JS timeout; HTML/CSS/JS project preview in an opaque-origin iframe with network-denying CSP.
- Local knowledge note import/search, CSV/JSON analysis and bar charts, browser WebAssembly arithmetic capability check, canvas image brightness/contrast/saturation and PNG export, browser speech playback and optional dictation.
- Service worker for caching local application shell after site is loaded over HTTP(S).
- AES-GCM encrypted local key vault unlocked with an operator passphrase (PBKDF2 SHA-256 260,000 iterations). Decrypted keys only live in active page memory; public GitHub repository and all nonsecret backups exclude keys.
- Dated guided setup records for 8 recurring-free provider routes, sourced from the archived A2.6 `free_key_registry.json` provider-guide data. No trial-credit catalog entries.

## Implemented request paths, conditional on user-owned keys/network/CORS

| Provider | Fixed endpoint | Capability boundary |
|---|---|---|
| GroqCloud | `https://api.groq.com/openai/v1/chat/completions` | Model/account rate limits apply |
| OpenRouter | `https://openrouter.ai/api/v1/chat/completions` | Only `openrouter/free` or `:free` model IDs accepted by the client |
| Gemini | `https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent` | Free model eligibility must be verified in the account |
| Cloudflare Workers AI | `https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/ai/run/{MODEL}` | A Workers AI account ID is required; model must be `@cf/*` |
| Mistral Studio | `https://api.mistral.ai/v1/chat/completions` | Free Studio mode and supported free model required |
| Ollama Cloud | `https://ollama.com/v1/chat/completions` | Available free cloud model must be supplied by user |
| Hugging Face | `https://router.huggingface.co/v1/chat/completions` | Included credit may exhaust; no automatic paid fallback; select route carefully |
| Aion Labs | `https://api.aionlabs.ai/v1/chat/completions` | Free allowance, eligibility and model need current verification |

Eight transport request shapes are locally unit-tested with **synthetic fake credentials only**. No live provider credentials, account balance lookups, CORS integration or real provider replies are claimed. Explicit human action required for each request and supervised workflow.

Provider API token usage, when actually returned, is labeled `provider_reported`, never invented; no precise remaining balance is displayed unless a separately validated endpoint returns one (not implemented).

## Experimental / partial

- Python on Pyodide (CDN v0.28.3) runs inside a dedicated worker within an opaque-origin frame if the browser permits the CDN and WASM initialization. Python browser runtime has not been real-browser accepted.
- HTML preview runs local JS/CSS and blocks remote network by CSP; it is not a general-purpose hosted server, npm environment or Linux VM.
- Workflow builder supports 2–6 editable textual stages, sequential request execution, stop/error and outcome logs. No drag-and-drop arbitrary tool workflow graph, background scheduling, or independent agent permission system.
- OpenRouter free-only ID validation is enforced; other provider plans cannot be remotely certified. The user must confirm plan/limits and disable overage on the provider side where possible.
- A fixed provider registry is included. Third-party provider plugin API and automatic quota-based fallback are not ready.

## Unimplemented

On-device LLM/WebGPU weights, full Monaco-class IDE completion/diagnostics, local PDF text extraction, full modality API support, repo writes from the public page, remote search API, precise provider remaining allowance, cross-device synchronization, arbitrary virtual machine provisioning, automatic code modification based on model output.

## Verification

Run `npm test` for Node unit and static checks. Tests include module format, ZIP archive CRC and file validation, the AES-GCM vault (create/unlock/wrong password/delete), API request shapes and mock provider responses, isolated Worker execution/termination in Node threads, document CSP construction, and local CSV/JSON analysis.

**Browser GUI acceptance:** Chromium navigation in the controlled VM returns `net::ERR_BLOCKED_BY_ADMINISTRATOR` for loopback pages. No interactive browser screenshot or live website/mobile/device accreditation claimed here. Until a person tests the GitHub Pages-hosted page, visuals and browser-specific sandbox/CORS/Pyodide/IndexedDB edge cases remain unverified.

## Hosting

The repo has a Pages deployment workflow and a standalone static root. GitHub Pages requires owner enabling the GitHub Actions publishing source in repository settings; publication is not established until the workflow succeeds and the public URL loads. See [deployment guide](DEPLOYMENT.md).

## Verified B0.3.1 continuation (2026-10-11)

- Source B0.3 first published at commit `2c91bbb9c672749b2c7db49593be156eb5a4212d`; 31 original source file Git blob hashes exactly matched the archived B0.3 ZIP.
- GitHub Actions run `38172520278`: Node 22 unit/static checks passed; a **real Linux Chromium Playwright** smoke test passed browser navigation, isolated JavaScript runner, HTML preview, stop controls, mobile menu and JS error guard.
- At that point the deploy job failed in `actions/configure-pages@v5` because Pages had not been enabled. That historical failure was subsequently resolved.
- B0.3.1 adds the real-browser test gate to the workflow and a network-first/offline-fallback service worker with three new Node unit tests. The B0.3.1 workflow was rerun and passed locally and in Chromium.

## Pages activation and B0.3.2 hosted acceptance (2026-10-11)

- GitHub Pages was successfully deployed for commit `30c66a241d7ba9576322539f1c21ec87f1144b60` in run `38173064846`, with both `checks` and `deploy` concluding `success`. Deployment output URL: `https://worldlinemuse-lgtm.github.io/multi-model-ai-platform/`. This is attested by GitHub Actions; user-device manual acceptance remains open.
- B0.3.2 adds live-hosted verification after the deploy step. Exact deployed asset hashes and real Chromium user interactions must pass on the public Pages address; see `docs/HOSTED_ACCEPTANCE.md`. Mark B0.3.2 hosted acceptance verified **only after** this new run passes.
- No actual user API keys, real provider responses, account balances, cross-origin provider CORS behavior, or adversarial sandbox audits have been verified.
