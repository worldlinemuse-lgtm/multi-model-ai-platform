# B0.3 static-browser architecture

## Data and trust boundaries

```text
GitHub Pages static files
  └─ Main browser document (no third-party script dependencies)
      ├─ IndexedDB "state.v1": projects/files, conversations, audit, knowledge, workflow history
      ├─ IndexedDB "vault.v1": PBKDF2-salted AES-GCM encrypted provider-key map
      │    └─ Decrypted map + nonexportable derived CryptoKey: MEMORY ONLY while unlocked
      ├─ No-key paths: IDE, ZIP export/import, snapshots, knowledge, data, media
      ├─ RuntimeRunner → iframe sandbox allow-scripts (NO allow-same-origin)
      │    └─ Blob Web Worker executes user JS or lazy-loads Python/Pyodide
      │         └─ Opaque origin; CSP denies network for JS; parent uses nonce+frame-source checks
      ├─ HTML preview → second iframe, sandbox allow-scripts, opaque origin, CSP connect-src none
      └─ On explicitly approved Send / workflow Run
           └─ Fixed-provider HTTPS fetch with ephemeral decrypted key, AbortController
               └─ Provider API, only if CORS, eligibility and account settings permit
```

The source repository never receives a user's API key, decrypted vault, chat or audit data. Project JSON/ZIP and full workspace backup intentionally exclude the separately encrypted vault record. Keys still enter browser memory when unlocked and are supplied to the selected provider over HTTPS; browser extensions, page tampering and machine compromise are outside the local vault's protection boundary.

## Governance

- Provider admission means a documented source exists, **not** that a specific user account is free or connected.
- Saved key means encrypted credential metadata exists, **not** that its model/balance is verified.
- Requests only occur after operator Send or workflow Run actions and a free-plan attestation on the saved key.
- No automatic paid fallback, account cycling or simulated balances.
- User code is isolated from the main page and has a configurable worker termination path, but this is not a separately accredited arbitrary-malware sandbox.
- Model-generated content is only a proposal; no generated code runs automatically.
- Mutable app state is browser-origin-scoped; notebooks are user-exportable rather than remotely synchronized.

## Historical sources

B0.3 was built with the Library's B0.2 provider guides and verified B0.1 published code as references. Historical A2–A2.6 Python/SQLite runtime releases are not silently bundled into the static browser platform. No original project or Muse website sources are changed.
