# Execution recovery and GitHub CI reliability

Updated: 2026-10-12 UTC.

## Problem and evidence

- Local model-side VM navigation previously returned `ERR_BLOCKED_BY_ADMINISTRATOR`, including localhost tests. These are infrastructure restrictions; they are **not proof of application failure**.
- GitHub Actions is the supported independent real-Chromium test environment for this repository. Branch checks, production deployment, and public hosted acceptance are distinct events.
- On 2026-10-12, the merge of PR #4 (`acf9b3d`) passed branch tests but post-merge hosted run [38280806433](https://github.com/worldlinemuse-lgtm/multi-model-ai-platform/actions/runs/38280806433) failed at `tests/browser_smoke.py` with only `FAIL` and no stage. Asset hash integrity and deployment jobs had succeeded. This is **not** sufficient evidence to attribute the failure to a particular browser control or service worker.

## Recovery and reliability changes

1. `tests/browser_smoke.py` logs the current operation and a full exception traceback on failure, avoiding opaque `FAIL` output.
2. Immediate `.count()` assertions and race-prone visibility tests are replaced by bounded Playwright expectations. They cannot silently pass missing UI and they allow asynchronous browser state to settle.
3. The workflow separates pull-request concurrency from production `main` concurrency, preventing an unrelated PR update from canceling a production deployment or another PR.
4. Python runs unbuffered for incremental logs; browser steps and deploy have explicit timeouts. These limits are meant to stop stalled jobs, not to convert failure into a pass.
5. The immutable original 60-item audit in the Persistent File Library remains authoritative for baseline findings. `docs/AUDIT_REMEDIATION_TRACKER.md` records subsequent code dispositions.

## Repeatable continuation protocol

1. Read GitHub `main` HEAD and the latest `docs/AUDIT_REMEDIATION_TRACKER.md` before modifying files. Do not use a stale VM release as the current source.
2. Work in a narrowly scoped branch. Keep unrelated Muse repositories, accepted release ZIPs and original Library records untouched.
3. Commit small changes and add specific unit/Chromium tests using synthetic account data only; never record external credentials in Git.
4. Merge only when PR checks succeed. Require a separate passing **post-merge** `checks`, `deploy`, and `hosted-acceptance` run before reporting a public release as verified.
5. If a run fails, inspect the exact failing job and step logs; reproduce or add diagnostics, then fix the actual issue. Do not rerun indefinitely or suppress exceptions.
6. Save confirmed new GitHub SHAs and verification evidence in the tracker, and explicitly label anything still pending.
7. Real provider authentication, user permission prompts, and physical-device-specific acceptance remain user-controlled gates.

## Scope of this fix

This work can improve repository CI resilience, surface failures and avoid the blocked model-side VM. It does **not** repair the underlying ChatGPT service's hosted VM or guarantee the chat interface itself will never freeze.
