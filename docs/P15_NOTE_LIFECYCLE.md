# P15 — Local Knowledge note editing and exact duplicate reporting

Status: development branch. Do not mark hosted verified before branch CI, merge and post-merge hosted-browser acceptance pass.

## Implemented
- Users can select an existing **saved note**, choose **Edit selected note**, edit its title/content, **Save changes** with a confirmation or **Cancel editing** with no mutation.
- Edits preserve the original note ID and creation timestamp and record an optional `updated` timestamp; all fields remain bounded and participate in validated full-workspace backups.
- Updated note timestamps round-trip through the separate Knowledge note archive import/export. Older archives without `updated` remain valid.
- **Find exact duplicates** groups identical note bodies (line-ending and outside whitespace normalized only), discloses titles and partial IDs, and does not automatically remove or merge anything.
- Project source files cannot be edited through Knowledge note controls; Code Studio remains the source of truth. The duplicate report never sends content to a model or external service.

## Limitations
- Not a content-diff editor, version history, semantic similarity ranking, PDF/DOCX extractor, or autonomous deduplication mechanism.
- Clicking to edit is explicit and overwriting a saved note requires confirmation. A Cancel action keeps the prior persisted content.
- No binary inputs, encryption of normal notes, or remote sync are introduced. Personal workspace content remains local unless the operator explicitly sends it to a selected API.

## Verification
- `tests/note-tools.test.mjs`: immutability, conservative duplicate grouping, preservation of IDs/timestamps, rejected invalid edits and archive/back-up compatibility.
- `tests/full_site_browser.py`: two notes, duplicate report, edit, cancel, confirm save, post-edit report update, exported archive metadata and browser reload persistence.
- Service worker includes `src/note-tools.js` in the cached shell, and hosted asset integrity covers the module.
