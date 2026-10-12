# Multi-Model AI Platform — Living Development TODO

**Record version:** 2026-10-12 22:23 UTC — autonomous continuation initialization. **Authority:** original 60-item B0.3.2 audit (immutable), repository `worldlinemuse-lgtm/multi-model-ai-platform`, plus latest verified GitHub Actions. **Public main at latest verified time:** `13b3a1b04ed5e5dcdb470973d55b97b5e484ba04`; hosted verification `38318201795` SUCCESS (checks/deploy/hosted Chromium). **User instruction:** perform all independent tasks and testing, expand this list when testing finds more work, save to Library throughout, defer user-only gates until last. No historical releases or other Muse repositories may be altered.

## Status / evidence rules

- `[x] VERIFIED` requires merged source AND passing post-merge production checks, deployment, and public hosted Chromium acceptance where applicable.
- `[-] PARTIAL` has a verified narrower implementation but remaining defined scope.
- `[ ] READY` can be implemented and tested independently, with no user credentials/permissions.
- `[ ] INVESTIGATE` needs source/design/prototype/test discovery, **not** permission from the user unless subsequent investigation shows otherwise.
- `[!] USER GATE` requires user-controlled account, secrets, spending, approvals, actual device or personal data; do not perform or demand it before all other work is exhausted.
- `[~] TESTING` has an open PR/CI result or unverified patch; do not mark verified merely because code was written.

## Immediate independent work queue — ordered

- [-] **Q01 / P04 — faithful HTML preview asset resolution:** resolve referenced local CSS and JS in original document order; reject traversal or missing assets explicitly; preserve opaque-origin CSP, no remote network. Unit/Chromium regression and hosted acceptance. **VERIFIED limited scope: PR #10 commit `dd1d84e9cc49e6f83573fcd2b6ae151db8e0a8fb`, branch CI `38316905725` and post-merge `38317094795` (checks/deploy/hosted Chromium) SUCCESS. Remaining: local binary assets, module graph and bundler.**
- [x] **Q02 / P02 — true browser Python acceptance:** exercise Pyodide in real Chromium with CDN/network and a realistic cold-start bound; surface CDN failure separately from logic failure; do not claim offline Python support until tested. **VERIFIED hosted scope: PR #11 main `de867bacb64026d1763a761b61edcd08b83c874f`, branch run `38317353622` + post-merge run `38317526561` all jobs SUCCESS, real Pyodide stdout and health verified. Remaining: persistent Python kernels, offline packages.**
- [ ] **Q03 / P03 — safe multi-file JS execution:** local relative imports/entrypoint with isolation, strict resource bounds, no npm/install access or live-network escalation. Tests, source import errors and declared limitations. **READY.**
- [ ] **Q04 / P12 + P22 — IDE code-assist review tools:** local diff preview, explicit operator-accepted edit proposal, protected source and snapshot rollback, validation and Chromium acceptance. **READY (provider-free part).**
- [-] **Q05 / P15 — durable knowledge edit/update/deduplication:** edit note with provenance and explicit apply, safe dedupe, structured JSON flattening under size cap. Test retention and backup round-trip. **VERIFIED limited scope: PR #12 main `13b3a1b04ed5e5dcdb470973d55b97b5e484ba04`, CI `38318035400` SUCCESS, post-merge run `38318201795` all three stages SUCCESS. Edit/cancel/confirm, note provenance and exact duplicate report done. Structured JSON flattening, semantic search/deduplication and note history remain.**
- [ ] **Q06 / N10 — local PDF and DOCX text extraction:** investigate browser-local implementation with strict bounds/no remote conversion; only certify formats actually tested, no OCR claim. **INVESTIGATE.**
- [ ] **Q07 / P20 — reusable WASM project runner:** explicit file/bytes input and import/exports diagnostics with CPU/memory and CSP isolation, no execution of arbitrary network instructions. **READY/INVESTIGATE.**
- [ ] **Q08 / P25 — image crop/rotation/undo and save-to-project:** local canvas only; preserve pixel dimensions and export truth. **READY.**
- [ ] **Q09 / P26 — voice selection/rate/pitch and truthful dictation state:** in-browser static tests and supported feature detection; physical-mic acceptance stays gated. **READY, partial device gate.**
- [ ] **Q10 / P29 — traceability:** bounded request ID/model/latency/status/provenance with privacy redaction; no raw secrets/prompts logged without consent; evidence export. **READY.**
- [~] **Q11 / P30 — live browser capability diagnostics:** permission and IndexedDB/Worker/WASM/WebGPU truthful supported/blocked/unknown outcomes; no fabricated live provider checks. **TESTING PR #13, head `d2ff90c66ebb8cb620914318c52ffafbda7c164c`, branch run `38318571218` queued.**
- [ ] **Q12 / P33 — comprehensive acceptance tests:** accessibility/keyboard, offline update, error/fault-injection, profile reset, security regression, screen-state persistence; add targeted tests per new feature. **READY, continuously recurring.**
- [ ] **Q13 / P23 — snapshot full line diff:** bounded and safe textual diff, no silent application. **READY.**
- [ ] **Q14 / P13 — virtual project folder copy/selection, refactor:** maintain collision and traversal protection; must not access physical filesystem. **READY.**
- [ ] **Q15 / P17 + P19 — advanced local data controls:** grouped stats, chart types/export, schema awareness, drilldown, missing-value policy; preserve local-only operation. **READY.**
- [ ] **Q16 / P21 + N09 — interactive local REPL:** assess bounded Worker-backed expression REPL without falsely claiming OS shell. **INVESTIGATE.**
- [ ] **Q17 / P11 — local workflow orchestration:** per-stage roles, branching/conditions, variables, isolated nodes, durable safe resume and explicit permissions. **READY/INVESTIGATE.**
- [ ] **Q18 / P09 — multi-provider workflow stage choices:** test local selection and correct routing with synthetic credentials; live calls separately user-gated. **READY.**
- [ ] **Q19 / P10 + N01 — grounded research:** investigate permissible no-key local source-library retrieval and evidence citation; external search/provider APIs gated. **INVESTIGATE.**
- [ ] **Q20 / P08 — configurable model and comparison settings:** no paid auto-selection or fabricated eligibility. **READY for UI/mocks; real auth gated.**
- [ ] **Q21 / P27 — encrypted vault portability and passphrase rotation:** model threat/security and test encrypted import/export without ever extracting keys to logs/source. **READY with careful testing; real cross-device user gate.**
- [ ] **Q22 / P28 — connection diagnostics/retry policy:** manual-only idempotent retry affordance, deadlines/backoff, no hidden repeat spending; synthetic HTTP tests. **READY; live tests gated.**
- [ ] **Q23 / P31 — robust offline updates:** multi-tab contention, cache failure/partial install reporting and regression tests. **READY.**
- [ ] **Q24 / P14 + P16 — conversation/knowledge lifecycle:** reinforce search pagination, audit/history edge cases, potential local semantic search with explicit cost/size budget. **READY.**
- [ ] **Q25 / P24 — local virtual binary assets:** image/audio MIME allowlist, bounded import, ZIP/export fidelity and preview mapping; memory safety. **INVESTIGATE.**
- [ ] **Q26 / N04 — provider adapter extensibility:** safe local adapter registry schema, no execution of untrusted code, explicit source policies. **INVESTIGATE.**
- [ ] **Q27 / N02 — browser-local model inference feasibility:** memory footprint, supported WebGPU detection, security/isolation, no unsanctioned large model downloads. **INVESTIGATE.**
- [ ] **Q28 / N03 — human-approved GitHub syncing from site:** permissions/security architecture and dry-run UI without storing tokens in public source. **INVESTIGATE; final authorization gated.**
- [ ] **Q29 / N05 — verified free-quota routing:** design conservative quota-provenance model, no automatic paid fallbacks; actual provider quotas gated. **INVESTIGATE + USER GATE.**
- [ ] **Q30 / N06 — remote modality interfaces:** research local input/output adapters and contractual provider support; credentials gated. **INVESTIGATE + USER GATE.**
- [ ] **Q31 / N07 — multi-device collaboration:** privacy/security architecture, explicit human opt-in, no remote sync without authorization. **INVESTIGATE + USER GATE.**
- [ ] **Q32 / N08 — bounded local autonomous agent layer:** explicit operator tasks, action approvals, logs and deterministic recovery; avoid uncontrolled external calls. **INVESTIGATE.**

## Already deployed at verified limited scope (not a blanket closure of the larger P items)

- [x] **D01–D17:** all 17 baseline defect IDs remediated at their documented scope, with D14 a claims correction and later P14 history controls; original tests/reports preserved.
- [x] **P07, P32:** baseline numerical usage fidelity and validated backup scheme at accepted B0.3.3 scope.
- [-] **P13:** folder tree/move accepted in PR #9 `5d4c9cf`; more refactor capabilities open.
- [-] **P14:** search, user-message edit, thread export/delete from PR #3; broader lifecycle remains.
- [-] **P16:** keyword search spans projects from PR #4; no semantic index.
- [-] **P17:** paginated all rows and all columns from PR #2; advanced interaction open.
- [-] **P18:** named saved datasets included in full backups from PR #8; axis/chart state not yet persisted with them.
- [-] **P19:** filters, sorts, dedupe and one-level undo from PR #8; grouping/formulas/charts open.
- [-] **P21:** console accurately relabeled; true REPL not built.
- [-] **P23:** snapshot compare-by-file-status, rename, export, pin, delete from PR #6; line diff open.
- [-] **P28:** bounded request deadline/caller abort from PR #4; richer diagnostics open.
- [-] **P31:** scoped cache cleanup and real warm-offline test from PR #7; update conflicts open.
- [-] **P33:** 20/20 broad browser acceptance plus offline tested from PR #9; remaining scenario coverage open.

## User-only validation / approval queue — defer until independent work exhausted

- [!] **G01 / P01, P05, P06:** real provider account signup/free-plan eligibility, operator-owned API credentials, actual current CORS and quota checks. Do not fabricate live inference results.
- [!] **G02 / N05:** authorization for routing that might incur charges; never assume or auto-spend.
- [!] **G03 / P26:** actual Android microphone permission, dictation accuracy and device-specific playback tests.
- [!] **G04 / P27/N03/N07:** external account/cloud or GitHub authorizations, encryption migration to physical devices, collaboration permissions.
- [!] **G05 / design choices:** any irreversible source-of-truth policy, sensitive data sharing, payment, service signup or user account action.

## Defect queue (append every reproduced regression with reproducer, severity, commit, owner)

- **None open at initialization.** Do not equate this with bug-free. Test discoveries must create a `BUG-###` row and block merge when severe.

## Living worklog

- **2026-10-12 22:23 UTC:** validated latest main `5d4c9cf` and post-merge run `38308404258` (all 3 jobs PASS); no open PRs; read original 60-item audit and the prior Library checkpoint. Created this ongoing task inventory. Twice-daily flexible continuation scheduled for approximately 08:00 and 19:00 America/New_York. Next initial implementation: Q01/P04. At each run read latest saved checkpoints and update a new version of this TODO after test outcomes, source changes, and discovered defects.


- **2026-10-12 22:29 UTC:** opened PR #10 `https://github.com/worldlinemuse-lgtm/multi-model-ai-platform/pull/10` at development head `c9a61c1c398832851bca44193bf458e082b38ec1` for P04 linked asset preview with dedicated unit and Chromium tests. Branch run `38316905725` in progress. Original main remains `5d4c9cf` until CI and merge; no external credentials used. Library checkpoint saved separately.

- **2026-10-12 22:34 UTC:** P04 PR #10 passed branch Chromium, merged as `dd1d84e`; post-merge hosted run `38317094795` is still in progress. Opened P02 PR #11 for real non-mocked Pyodide Python Chromium execution; branch CI run `38317353622` queued. Captured this state in another Library checkpoint; user-account gates remain deferred.

- **2026-10-12 22:41 UTC:** confirmed public P04 run `38317094795` SUCCESS and real Pyodide public P02 run `38317526561` SUCCESS. P15 PR #12 created on `audit-p15-notes-edit-dedupe-20261012` at head `e9de2283129197a319bf3aa40c6d16bd53392bec`, run `38318035400` queued. Saved a new Library checkpoint and kept Q05 TESTING, not verified.

- **2026-10-12 22:47 UTC:** Confirmed P15 hosted run `38318201795` all jobs SUCCESS and main `13b3a1b`. PR #13 for P30 read-only local capabilities created at head `d2ff90c` with branch CI `38318571218` queued; operator/provider connectivity remains intentionally unverified. Saved new Library checkpoint plus revised TODO.