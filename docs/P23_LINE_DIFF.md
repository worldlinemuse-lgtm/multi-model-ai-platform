# P23 — Read-only snapshot line diff (staged)

The snapshot Compare action retains its complete per-file status counts and adds a bounded textual line diff. It compares the saved snapshot with the current in-memory virtual project; it never changes source, snapshots or physical files. Every displayed line is assigned a `-` (snapshot), `+` (current), or space (unchanged) prefix, grouped into context hunks. The UI uses `textContent`, not HTML injection.

**Limits:** each side at most 60,000 characters and 500 lines; comparison at most 200,000 dynamic-programming cells; each file diff at most 16,000 characters; displayed details at most 25,000 characters across 30 files. Files exceeding limits are explicitly marked as omitted; file-status counts remain complete. A bounded display is not an exportable complete patch, and must not be presented as one.

**Testing:** `node --test tests/snapshot-diff.test.mjs` covers edits, insertions, deletions, immutable source, CRLF/trailing newline differences, HTML-looking content, oversized inputs and project output caps. Existing Chromium acceptance adds an assertion that a saved snapshot's changed line is actually displayed. The service-worker shell and hosted SHA-256 integrity manifest include the new module.

**Acceptance boundary:** local Node tests can pass before publication, but the feature is not VERIFIED until the patch is committed on a GitHub branch, branch CI passes, it is merged and post-merge hosted Chromium acceptance succeeds. This staged file is not a claim of deployment.