# ADR — Provider connection broker and two-mode product interface

Date: 2026-10-14 | Status: Incremental design, not a deployed proxy or AI agent.

## Product requirement
The existing full-power twelve-screen workbench remains **Developer Mode**. A new everyday interface should become the primary navigation surface using the **same underlying services**. Nothing is removed. One engine, two interfaces: no second disconnected website.

## Independent architectural layers
- **Provider adapters:** Typed contracts for models, requests, HTTP errors, quotas, usage, cancellation, with per-provider differences and fixed approved endpoints.
- **Connection broker:** Check local configuration without network; with a separate explicit user action probe documented read-only capabilities endpoints. Classify 401/403/429/5xx and ambiguous browser network/CORS/TLS; provide evidence and suggestions, never silently change credentials or model.
- **Transport:** Prefer direct browser API requests only where they actually work. If account/browser testing demonstrates blocked cross-origin requests, propose a separately approved trusted per-user relay. Do not bypass CORS or build an open proxy.
- **User secrets:** Encrypted browser vault is the existing storage authority. A server relay introduces new obligations and needs its own authorization: authenticated user boundaries, approved origin and upstream host allowlists, bounded requests, rate limits, no plaintext secret logs, TLS, key rotation, and cost monitoring. Browser-owned user keys may require one-request pass-through rather than shared hosted storage, requiring explicit product decisions.
- **Shared application services:** Chat, editor, workflows, audit, vault, provider discovery and state expose typed internal operations both Everyday and Developer Mode can call.
- **Website controller:** Optional assistant is deliberately narrow: only registered website actions (navigation, opening tools, safe state inspection, preparing proposed edits, displaying diagnostics). Never automatically give it raw secret access, shell, arbitrary URLs, direct GitHub write access, provider billing authority or unbounded workspace edits. Sensitive action requests require explicit human confirmation.
- **Active encapsulation:** Candidate connections carry structured proposed route, evidence, confidence/unknowns, permission requirements, quota expectations and acceptance gates. It proposes; user approves; approved action still goes through deterministic policy and audit.

## Groq vertical slice
1. Official GET https://api.groq.com/openai/v1/models validates metadata availability and lists active models.
2. Require an unlocked local Groq key and a visible opt-in button; send exactly one bounded GET, no inference, no retries.
3. Never echo keys, bearer headers, provider raw error bodies or arbitrary URL values.
4. Parse only active model IDs and explain that listing does not prove the account's free eligibility, chat support, CORS for POST or successful model inference.
5. Synthetic Node and Chromium browser testing must be credential-free, including testing the public hosted site with intercepted requests.
6. A live end-user Groq browser test, explicitly authorized with the test key, can determine actual account+browser connectivity. No honest conclusion about that can be drawn from synthetic tests alone.
7. Only if appropriate, separately design a trusted authorized gateway. Do not assume deployment is free or expose user keys to an unknown third-party relay.

## Owner-maintained references
- Groq Models API: https://console.groq.com/docs/api-reference
- Groq key security / trusted backend: https://console.groq.com/docs/production-readiness/security-onboarding
- Groq OpenAI compatibility: https://console.groq.com/docs/openai
- Cloudflare Workers CORS example (conceptual, NOT production safe by itself): https://developers.cloudflare.com/workers/examples/cors-header-proxy/
- Browser CORS behavior: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

No new dependency, real provider call, proxy infrastructure, secret handling, or autonomous website controller is introduced by this document.
