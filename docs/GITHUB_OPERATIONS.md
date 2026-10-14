# Existing GitHub App write access and safe release workflow

**This is an operational project authority, not a new credential setup guide.**
Repository: https://github.com/worldlinemuse-lgtm/multi-model-ai-platform

## Verified account and access
The user configured the Codex Connector GitHub App on October 11, 2026. On October 14 the owner-installed GitHub App (installation ID `170172667`, account `worldlinemuse-lgtm`) was directly enumerated and exposed only the intended selected repository. Metadata reported `push: true`, and actual authorized writes proved functionality.

We successfully created branch `codex/integrate-v60-20261014` from production `f0f3a3ecf4f9f94f867910419a39b9b6fdfefc14`, updated `sw.js` (`d616163bff8be77ecdc0f93cffc73a0b94d5b4b5`), added tests (`f1f2034255c5af0be5df14c1b0f0158ee8e3e0ed`), opened [PR40](https://github.com/worldlinemuse-lgtm/multi-model-ai-platform/pull/40), obtained green [PR CI 38601909212](https://github.com/worldlinemuse-lgtm/multi-model-ai-platform/actions/runs/38601909212), merged normally as `f73fb9a72c0b2cb5d631a0a0e1770f9711cd600e`, and verified green [postmerge production run 38602358771](https://github.com/worldlinemuse-lgtm/multi-model-ai-platform/actions/runs/38602358771), including actual Pages deployment, exact published-asset integrity, and public-site real Chromium tests.

## Use the authorized method
- Discover the *existing owner-linked* GitHub App connection and verify its current installation/repository selection; do not assume its dynamic connector ID remains stable.
- Read the *current* main commit and Git blobs, check relevant previous PRs, preserve accepted production changes.
- For each separately proven defect: create a feature branch, make guarded minimal source and regression-test updates, read back and compare the source/diff.
- Open a PR, run project tests (`npm test`) and hosted Chromium in existing GitHub Actions, review, merge **only if authorized**, verify deployment and hosted acceptance on exact resulting SHA.
- Archive source/evidence hashes to the user's Persistent File Library. Historical ZIPs and older Pages-derived candidates are not current GitHub checkout snapshots.

## Do not repeat the October 14 error
Previous sessions mistakenly treated historical per-operation denials and a local container's inability to resolve `github.com` as general repo access failure; this was disproved by the real October 14 GitHub commits/PR/CI/merge. An independently blocked OpenAI safety-check operation involving vault source is **not** permission to retry via another identity/tool/path. PR38 denied merge likewise must remain untouched.

No secrets or verification codes are in this repo. The separate archived Library operational runbook contains full evidence and release/continuity controls. This guidance should be revisited against fresh GitHub state rather than assuming the October 14 commit remains latest forever.
