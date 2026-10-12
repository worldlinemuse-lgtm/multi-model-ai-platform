# P02 — Real browser-side Python via Pyodide (operator-free acceptance)

Status: candidate branch. Only mark as verified if both local-checkout and post-deployment public-site Chromium jobs succeed using an actual CDN-loaded Pyodide WebAssembly runtime.

## Runtime
- The existing sandboxed opaque-origin iframe creates a dedicated worker for each run; Python requires a real Pyodide runtime downloaded from `https://cdn.jsdelivr.net/pyodide/v0.28.3/full/` on first execution.
- Network is allowed **only** to the official configured CDN origin for the Python sandbox. The main application and non-Python JS sandbox do not gain internet privileges. The worker can be forcibly stopped.
- An explicit 120-second browser-local cold-start/execution deadline prevents indefinite waiting. Python is **not guaranteed offline**; no offline Python claim is made. Download failure, unsupported WASM, CSP/CORS errors, runtime exceptions, manual Stop and timeout should not be reported as successful Python execution.
- Overview Python status starts `UNTESTED`. Only a genuine Python Worker completion event sets `EXECUTED THIS SESSION`. Other outcomes display running, failed, stopped or timeout statuses.

## Browser acceptance
- `tests/python_acceptance.py` runs the committed `hello.py` in actual Chromium and waits for genuine output, including the Pyodide runtime-loaded status and Python 2 + 2 = 4 result. No mocked fetch, generated output or provider credentials.
- It verifies the runner releases the Stop control and that Overview reflects actual completed Python execution.
- CI runs the same test against both checkout localhost and the final hosted GitHub Pages URL. A CDN network failure is a failed/blocked acceptance, not a pass.

## Remaining scope
- Persistent interactive Python kernels, package installation, local WASM binary project imports, offline Python caches, npm/project Python dependency resolution, and Python/Javascript mixed multi-file execution are not built here. Keep those gaps on the TODO.
