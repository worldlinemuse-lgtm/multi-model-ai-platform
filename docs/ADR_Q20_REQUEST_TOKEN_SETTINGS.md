# Q20 — Explicit per-request output-token caps

Date: 2026-10-14. Add a user-selectable cap of 128, 256, 512 (default) or 1024 output tokens. Apply the cap consistently to OpenAI-compatible `max_tokens`, Gemini REST `generationConfig.maxOutputTokens`, and Cloudflare Workers AI `max_tokens`. Keep one explicitly selected route or two intentionally selected comparison routes; never auto-route, auto-pay, auto-fallback or auto-retry. Real eligibility, pricing and remaining free balance are unverified; the cap is *not* a cost guarantee.

Official primary API sources: Groq https://console.groq.com/docs/api-reference (reports `max_tokens` deprecated in favor of `max_completion_tokens`; retain broad compatibility in this existing adapter while separately tracking migration); Google generateContent REST https://ai.google.dev/gemini-api/docs/generate-content/text-generation ; Cloudflare model parameters https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fp8/ . No third-party code copied.

Negative tests reject unsupported caps before dispatch. Browser chat dropdown persists locally with backward-compatible default 512; both compared routes use same explicit setting. Hosted CI/browser acceptance required before release claim.
