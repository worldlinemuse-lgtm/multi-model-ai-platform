# Human acceptance protocol — B0.3

Run this on the GitHub Pages URL, using desktop Chrome/Firefox and an Android browser if available. A recorded PASS requires observation on a real browser; unit tests are not substitutes.

1. Open Overview. Navigate the twelve sidebar sections. On a phone, open/close the hamburger overlay. Press Ctrl+K on desktop to open the section chooser.
2. Code studio: edit `main.js`, run it and confirm `Hello from Multi-Model Studio!` and `2 + 2 = 4` appear; verify the button returns to Idle. Replace code with `while(true){}` and confirm **Stop** interrupts the run and the tab remains interactive. Retest an infinite loop without pressing Stop; it should be terminated at 6 seconds.
3. Select `index.html`, use **Preview HTML**, click the embedded test button and confirm the preview changes. Modify `style.css` and preview again. Verify the preview cannot access parent page state.
4. Select `hello.py` and choose Run. First run should indicate Pyodide download. Once loaded, it should print `Python is running inside WebAssembly!` and `2 + 2 = 4`. If CDN download or WASM is blocked, record the exact console error rather than a pass.
5. Create a new project, add `src/util.js`, edit, rename and delete a file, snapshot, restore, export JSON and ZIP, import both. Reload the page and confirm persistence. Confirm malformed projects are rejected without overwriting files.
6. In Providers, verify eight cards, correct official links, setup guides and unknown balances. Create the key vault using a long passphrase. Add a **test key only if approved**, lock/reload/unlock and check that saved slots persist without exposing API key text. Verify wrong passphrase is rejected and keys are excluded from exported application backup.
7. With an actual authorized recurring-free API key, select its eligible model and send a short prompt. Record success or CORS/provider error. A valid key alone does **not** establish free account eligibility or a successful request. Check Usage & audit for actual recorded status and observed token fields.
8. With two independent valid free accounts, select Compare two routes; verify two independently labeled replies or explicit errors. Cancel an in-flight request and verify stopped status.
9. Workflows: edit the default stages to two or four, consent, start, then Stop; verify the run does not continue sending new stages. With approved keys, check each stage's result and audit entries.
10. Knowledge: save a note, import a text file, search it, attach it into Chat (but do not submit without approval). Data lab: paste `name,value\nA,5\nB,10`, run Analyze, inspect the chart and WebAssembly test. Media tools: load a test image, adjust filters and export PNG; try text-to-speech and Stop.
11. Download a full workspace backup, restore in a separate browser profile and confirm source/chat/notes restore. Verify the encrypted credential vault does not transfer with the backup. With network disabled after initial load, reload and check the app shell via its service worker; Python remote load and provider calls are not expected offline.
12. Confirm all controls are keyboard-operable, fonts legible at 360 px phone width, no horizontal viewport overflow, and JS console has no unhandled exceptions. Capture screenshots and browser versions for any failures.

**Acceptance status before this protocol is executed on a real hosted browser: NOT ACCREDITED.**
