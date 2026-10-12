# Local Data Lab saved datasets and transforms (P18, P19)

Scope: browser-local features only, no external dataset API or server. Added as a new versioned GitHub change, without replacing historical B0.3 releases.

## User-facing behavior

- **Analyze** CSV/JSON as before; data is never automatically submitted to any AI model.
- **Transform** the currently analyzed records using a selected column: case-insensitive contains, exact text, numeric greater/less than, ascending/descending sort or duplicate removal.
- **Undo last change** restores the prior working input in memory. It is not persistent undo history.
- **Save dataset** creates or explicitly replaces a named snapshot of input data in the encrypted-key-independent browser workspace state. The data is stored **unencrypted** in local IndexedDB like the rest of the workspace and included in full workspace JSON backups.
- **Load saved** uses an explicit confirmation when working input is nonempty. **Delete saved** also requires confirmation. Previously exported backups are unaffected.
- Limits: 8 named datasets, each at most 500,000 characters, 2,000,000 combined; CSV/JSON analysis still has the existing 2 MB, 3,000-row, 50-column limits.

## Integrity boundaries

- Schema validation applies on backup restore, including unique dataset IDs, text length and aggregate limits. Older saved B0.3 workspace files without the new field remain valid.
- A save is reported as successful only after the browser's storage write resolves. If persistence fails, in-memory dataset metadata reverts. API keys remain outside these workspace backups.
- Transforms are explicitly user-initiated and act on the working Data Lab textarea, not a saved snapshot. Export a dataset to keep unrestricted raw data; transformed rows are serialized as JSON to preserve numeric/text cell distinctions.
- The browser service worker caches the new data-tools module; hosted integrity verifies its exact bytes after deployment.
- Not implemented in this increment: SQL, joins, cross-dataset queries, dashboards, advanced charts, remote database integration, or AI-assisted analysis.

## Verification

- `tests/data-tools.test.mjs`: filtering, sorting, deduplication, schema boundaries, JSON roundtrip and old-backup compatibility.
- `tests/full_site_browser.py`: Chromium browser flow: analyze → filter → undo → sort → save → export full backup → reload browser state → load → delete.
- Production deployment must pass all three CI jobs: checkout checks, GitHub Pages deploy, and hosted Chromium acceptance.
