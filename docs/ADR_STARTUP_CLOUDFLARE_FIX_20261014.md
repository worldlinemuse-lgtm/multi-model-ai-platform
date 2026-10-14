# ADR — Startup observability and Cloudflare request correctness (2026-10-14)

## Evidence and scope

An external reviewer reported a production startup console error: `Cannot set properties of null (setting 'hidden')`. The currently committed `index.html` contains the direct DOM targets used for startup visibility toggles, so a specific missing element in the public user's runtime is **not independently established**. A mixed HTML/module revision via service-worker or browser cache is a hypothesis, not a demonstrated root cause. GitHub's existing hosted Chromium suite previously passed the same source revision without detecting this externally observed symptom.

The prior `boot().catch` logged initialization failures and displayed a toast, but `tests/browser_smoke.py` captured only unhandled page exceptions; caught failures could evade `pageerror`-only assertions. The fix adds document boot-state assertions to distinguish fully ready from explicitly failed or degraded initialization. Missing optional controls for recovery tools, comparison route and duplicate-note reporting no longer crash the remainder of startup, but instead trigger a visible degraded state. The browser suite fails any run not reaching `ready`. A synthetic mismatched-HTML fixture proves the degraded behavior without depending on stale browser caches or user data.

## Cloudflare instruction integrity

Workers AI's official chat-format example sends a `system` message alongside `user` messages. Our Cloudflare adapter removed `system` entries even while other providers retained them. This update forwards simplified messages in their original ordered roles, with bounded content and an explicit max token setting. Synthetic tests confirm role order and system-only messages. It does not prove live model responses or real provider compatibility with every possible model family.

Official model docs:
https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fp8/

## Action runtime

The repository previously used `actions/checkout@v4`, `actions/setup-node@v4`, and `actions/setup-python@v5`. Supported official v7 releases use Node24 internals; GitHub-hosted runners are compatible. Keep application Node minimum 22 and test Node24 in CI.

Official references:
https://github.com/actions/checkout
https://github.com/actions/setup-node
https://github.com/actions/setup-python
https://github.blog/changelog/2026-09-23-node-20-is-no-longer-available-in-github-actions/

## Acceptance and non-claims

- Node tests for Cloudflare system role and existing provider behaviors.
- Chromium normal startup must reach `data-mm-boot=ready`; previously caught `boot` exceptions make the test fail.
- Synthetic HTML missing `recovery-tools` must reach `degraded`, report it, and retain navigation.
- GitHub branch CI must pass before merging, and fresh main checks + deployment + exact hosted acceptance must pass before saying released.
- No live provider keys, model calls, quota evidence or new hosting services are used.
- Root cause of the original external error still requires device-specific console trace and cache/revision evidence if the symptom persists.
