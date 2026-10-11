# Multi-Model Studio · B0.3

A **browser-first, free-tier-first AI workbench** built in the dedicated repository [worldlinemuse-lgtm/multi-model-ai-platform](https://github.com/worldlinemuse-lgtm/multi-model-ai-platform). This is an experimental static web application; Muse's existing website is separate.

## Open the application

After **GitHub Pages** has been enabled for this repository, visit:

**https://worldlinemuse-lgtm.github.io/multi-model-ai-platform/**

If that URL does not open the studio, follow [GitHub Pages setup](docs/DEPLOYMENT.md). The source can also run from any static HTTP server:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`. It requires no npm build command. For code checks, install Node 20+ and run `npm test`.

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
| `provider-guides.js` | Archived A2.6 descriptive free provider setup content |
| `sw.js` | Offline cache for the local application shell |
| `tests/` | Offline unit, sandbox worker, crypto, API, ZIP, parser and static checks |
| `docs/` | Architecture, user testing and deployment truth |

## Project provenance

The original project and immutable historical releases A2–A2.6, B0.1 and B0.2 remain preserved in the user's Persistent File Library at `/Multi-Model AI Platform/`. B0.1 was published byte-for-byte in the Git history before this B0.3 development. B0.2 was retrieved from the Library as reference, including the provider guide registry; **B0.3 is a separately developed version and does not silently overwrite any archival release**.

No API secrets, saved vault databases or real credentials are committed to GitHub. This code is experimental: run untrusted code only after reviewing the sandbox boundary; it has not received independent adversarial browser security accreditation.
