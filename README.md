# Multi-Model Studio · B0.4.0 development

A **browser-first, free-tier-first AI workbench** built in the dedicated repository [worldlinemuse-lgtm/multi-model-ai-platform](https://github.com/worldlinemuse-lgtm/multi-model-ai-platform). This is an experimental static web application; Muse's existing website is separate.

## Open the application

**GitHub Pages deployment succeeded** on 2026-10-11 (run `38173064846`). Visit:

**https://worldlinemuse-lgtm.github.io/multi-model-ai-platform/**

If that URL does not open the studio, follow [GitHub Pages setup](docs/DEPLOYMENT.md). The source can also run from any static HTTP server:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`. It requires no npm build command. For code checks, use supported Node 22+ (CI tests with Node 24) and run `npm test`.

## Getting started

1. **Code studio** — Open an existing project, edit `main.js`, click **Run code** and inspect the console. JavaScript runs inside a worker created in an opaque-origin sandboxed iframe. Open `index.html` and select **Preview HTML**. The starter Python file `hello.py` works when Pyodide finishes downloading in a supported online browser.
2. **Projects** — Add files and folders by filename, create/rename projects, take snapshots and restore them, import/export `.json` and `.zip`. Files, notes and conversations persist in this browser via IndexedDB. Use **Settings → Download workspace backup** to export state without secrets.
3. **Free providers** — Browse eight documented recurring-free onboarding routes. Their official signup/key/limits links explain how to obtain an eligible key; **unknown remaining allowance remains unknown**.
4. **Key vault** — Choose a long passphrase to create an AES-256-GCM browser-local vault, check the provider's free plan and model eligibility, then save a key. Keys are encrypted at rest with a PBKDF2-derived key and are unlocked only for the current page session. They are never included in project or workspace exports.
5. **Model chat** — Once a key is unlocked, select its route and click **Send**. The browser makes a direct request to the provider, if that provider supports CORS for this origin. Select **Compare two routes** for parallel replies from two explicitly connected providers. Calls only occur after you click Send.
6. **Workflows** — Choose or edit 2–6 stages, an eligible route, and a goal; explicitly approve model requests. Stop at any time. Results and nonsecret usage events remain on your device. Generated code is never executed automatically.
7. **Knowledge, data and media** — Save/search local notes, analyze CSV/JSON and chart numeric values, run a WebAssembly capability check, edit an image with browser canvas, and use speech playback / optional dictation.

## Real implementation boundaries

- **Working locally:** Static interface/navigation, project editor, IndexedDB persistence, snapshots, JSON/ZIP import/export, JS Worker execution harness, HTML/CSS/JS preview, encrypted key storage, local conversation/history management, keyword notes retrieval, data calculations/charting, canvas image filters, Web Speech bindings, WebAssembly capability test, controls and audit.
- **Dependent on outside services:** First Python/Pyodide download; actual model inference, live comparison and multi-step provider workflows. Every provider connection additionally depends on valid user-owned credentials, plan eligibility, a supported model, browser networking and provider CORS. No live user account or provider inference has been verified by this release.
- **Partial or not built:** Token-aware automatic routing/fallback, exact remaining per-account quotas, on-device model inference, external search, code-generation autoapply, graphical drag-and-drop flow editing, PDF text extraction, GitHub repository write integration inside the published site, third-party plugin SDK. The capability registry displays these honestly.
- **No cost guarantee:** The app never initiates a provider call without an explicit Send/Run action. A free-plan attestation gate and OpenRouter `:free` route restriction reduce mistakes but cannot prove an external account will never bill. Confirm account settings and any spending cap at the provider.

## Source layout

| File | Purpose |
|---|---|
| `index.html`, `styles.css` | Responsive dark-theme studio interface and overlays |
| `src/main.js` | UI/controller, project, model, workflow and audit wiring |
| `src/core.js` | Versioned state, validation, provider registry and capability truth |
| `src/storage.js`, `src/vault.js` | IndexedDB and encrypted private key storage |
| `src/provider-api.js` | Eight fixed outgoing model-API transports (conditional) |
| `src/sandbox.js` | Worker in opaque-origin sandbox, run/stop/timeout, HTML preview |
| `src/zip.js` | Bounded ZIP creation and extraction with CRC checks |
| `src/labs.js` | CSV/JSON, bar charts, images, speech, WebAssembly test |
| `src/knowledge.js` | Versioned, validated knowledge note archive import/export |
| `provider-guides.js` | Archived A2.6 descriptive free provider setup content |
| `sw.js` | Offline cache for the local application shell |
| `tests/` | Offline unit, sandbox worker, crypto, API, ZIP, parser and static checks |
| `docs/` | Architecture, user testing and deployment truth |

## Project provenance

The original project and immutable historical releases A2–A2.6, B0.1 and B0.2 remain preserved in the user's Persistent File Library at `/Multi-Model AI Platform/`. B0.1 was published byte-for-byte in the Git history before this B0.3 development. B0.2 was retrieved from the Library as reference, including the provider guide registry; **B0.3 is a separately developed version and does not silently overwrite any archival release**.

No API secrets, saved vault databases or real credentials are committed to GitHub. This code is experimental: run untrusted code only after reviewing the sandbox boundary; it has not received independent adversarial browser security accreditation.

## Reliability update B0.3.1

GitHub Actions now runs the full unit suite **and** a Chromium/Playwright browser smoke acceptance before attempting Pages deployment. The service worker uses a network-first strategy within this project scope so new website versions are fetched when online, with cached shell fallback offline. The initial Chromium CI run completed successfully on 2026-10-11. GitHub Pages was enabled and the B0.3.1 deployment succeeded in run `38173064846`.

## B0.3.2: live hosted acceptance

The deploy workflow now adds an independent **hosted-acceptance** job after GitHub Pages reports success. It checks 13 deployed assets against the exact source using SHA-256, then runs the real Chromium smoke test at the publicly served website URL. A release counts as end-to-end verified only when `checks`, `deploy`, and `hosted-acceptance` all pass. See [hosted acceptance](docs/HOSTED_ACCEPTANCE.md). This confirms public web delivery and selected UI interactions, not real AI API provider connectivity.


## B0.3.3: audited functionality repairs (2026-10-12)

This release addresses a first controlled subset of the 60-item functional completeness audit.

- **Safer state:** Validate full active project/thread references and render-critical record fields; prevent malformed backup replacement. Restore/reset write persistent state **before** swapping the in-memory UI; storage errors are surfaced instead of being declared successful.
- **Correct data:** Blank or nonnumeric CSV values do not become zero; parsing failures clear old analysis rather than continuing to display stale results.
- **Truthful usage and storage:** Unreported token fields remain unknown. Distinguish temporary-memory fallback from durable IndexedDB.
- **Actual model comparison controls:** Users select the second saved provider explicitly; a provider receives only its own past assistant replies, not another provider's replies. This is not a claim of live provider-CORS acceptance.
- **Sequential workflow correctness:** More than six stages are rejected visibly instead of silently dropped; stage numbers in model instructions match the actual stage.
- **Knowledge roundtrip:** Exported note archives can be reimported with schema validation; prior exported arrays also work. Cloudflare account ID is restored when navigating from its provider card.
- **No false labels:** The output panel is labeled *Execution log* rather than terminal; conversation search/edit is not falsely claimed as implemented.
- **Regression coverage:** new Node tests and isolated real-Chromium workflows on checkout and deployed Pages, including simulated IndexedDB write failure with fake data and fake key slots. No real credentials are sent in tests.

**Still incomplete:** Actual provider end-to-end inference; backend search; per-account quota observation; multi-stage independent model assignment; complex language runtimes, Python acceptance; richer IDE, images, media and document extraction; agent workflows. The remaining audit findings are preserved unchanged.


## Development status and 2026-10-14 startup reliability work

**Deployment truth:** The last separately verified production revision before this repair was `078672e7b35a3f34a8f8bde05885804fec1a92ab` (GitHub Actions run `38510367623`: checks, deploy, hosted browser acceptance passed). This B0.4.0 source increment must not be called released until its own post-merge production deployment and hosted browser checks pass. It does not establish live provider/account connectivity.

The Q17–Q27 development series delivered **limited, tested scope** in the browser workbench:

- **Q17/Q18/Q19:** supervised workflow stages with explicit route selection and local-evidence retrieval. Provider requests require operator-owned credentials and browser CORS support.
- **Q20/Q21:** explicit output-token cap, encrypted-only vault export/import, passphrase rotation and authenticated backup import before replacement.
- **Q22/Q23:** local-only connection diagnosis, manual retry drafting and staged offline cache refresh with failure preservation.
- **Q24/Q25:** paginated local knowledge results and bounded per-project image/audio binary assets.
- **Q26/Q27:** validated declarative provider presets and read-only WebGPU compatibility probes. **No on-device LLM engine or model weights are shipped.**

**Known limitation:** No authenticated live provider response has yet been independently accepted. The system does not claim real remaining free quotas, provider CORS verification, automatic paid fallback, cross-device collaboration, or autonomous code writes.

**Startup hardening in this development increment:** the app records an explicit document-level `data-mm-boot` state (`starting`, `ready`, `degraded`, or `failed`). If specific optional UI controls are missing from a partially updated/cached HTML document, those features report degradation instead of throwing a null `hidden` property exception. Browser acceptance fails unless the boot state is fully `ready`, including when initialization errors were caught rather than emitted as uncaught page errors. This is a defensive mitigation; a specific root cause for an externally reported live-site error is not yet independently reproduced.

**Cloudflare Workers AI:** the request adapter now preserves `system` messages as Cloudflare's documented chat-format models accept them, including workflow instructions. Newly created key slots default to the supported FP8 Llama 3.1 model; existing saved model selections are not rewritten. Neither change constitutes a successful live API test.

**GitHub Actions:** first-party checkout/setup-node/setup-python actions use Node 24-compatible official major releases; application unit checks run under Node 24. The hosted Chromium suite includes normal startup and a deliberately mismatched HTML fixture. The older versioned release archives remain unchanged.
