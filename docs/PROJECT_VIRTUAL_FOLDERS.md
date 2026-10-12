# P13 — Virtual project folder operations

These are **browser-local virtual project paths** stored in the active project JSON record; they are not folders on the user's operating system or on GitHub.

Implemented in this change:
- Hierarchical folder headings and appropriately indented file names in Code Studio Explorer.
- A **Move folder** action that prompts for a source and destination relative path, previews the number of affected files, and requires confirmation before changing any project data.
- All matching nested files are moved together. The active file follows its new path and is still editable.
- Destination collisions, invalid/traversal paths, moving a folder within itself and project size/capacity violations are rejected atomically (no partial rewrite).
- Existing per-file rename works as a single-file move by entering a relative path.
- Project JSON/ZIP exports and snapshots continue to refer to fully qualified file keys, not merely the displayed basename.

Boundaries: no access to operating-system folders, no genuine binary file import, no automatic code import rewriting, no version-control filesystem synchronization, no drag/drop tree reordering. Preserve all past project release archives without mutation.

Tests: `tests/project-files.test.mjs` verifies hierarchy, nested moves, active-file relocation, collisions and immutability. `tests/full_site_browser.py` verifies folder UI, two-file relocation and exported source bytes. The offline service worker caches the new module, and hosted integrity hashes it. Merge only with passing CI and verify deployed site separately.
