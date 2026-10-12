# P04 — Faithful linked virtual assets in HTML preview

Status: implemented in isolated development branch; do not call the release verified until CI and hosted acceptance succeed.

## Supported
- Selected HTML page is previewed inside the existing opaque-origin `iframe sandbox="allow-scripts"` and restrictive CSP.
- Only `<link rel="stylesheet" href="local.css">` and classic `<script src="local.js"></script>` references explicitly written in that HTML are inlined into the preview **at their original positions**. The implementation does not blindly append all CSS/JS in the project.
- Relative project paths, `./`, `../` *within the project root*, optional query/hash and project-root-relative references resolve to virtual filenames under the project root.
- Missing project files, remote URLs, traversal beyond project root, unsupported JavaScript module sources and unsupported script types are excluded; the user sees an example warning rather than silently loading them.
- No preview code can read the application's JavaScript memory, decrypted vault keys or same-origin storage, and network communication remains denied by CSP.
- Unreferenced JS/CSS files are not executed or injected.

## Explicit limitations
- Relative `<img src>`, CSS `url()`, module imports, npm dependencies, source maps, import maps, dynamic imports, HTML templates and binary asset URL rewriting are not yet supported.
- This is a simple static-HTML preview, not a general bundler, filesystem or web server. External `<script>` and referenced stylesheet URLs are deliberately not fetched.
- For ambiguous HTML syntax outside recognized tags, CSP is the safety boundary. Keep the full multi-file browser build in P03/P24 open.

## Tests
- `tests/sandbox.test.mjs`: relative references, inclusion order, skipped unreferenced files, remote/traversal/missing/module rejection, closing-tag safety, CSP.
- `tests/full_site_browser.py`: a real Chromium case creates linked local JS/CSS, checks executed script order and computed styles, and confirms external script omission.
- `tests/hosted_integrity.py`: SHA-256 comparison for `src/preview-assets.js`; service worker caches the new source.
