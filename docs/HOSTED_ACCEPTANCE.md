# Hosted GitHub Pages acceptance — B0.3.2

The Actions workflow now checks the actual public website after a successful Pages deployment, not only the local branch. The hosted acceptance job verifies thirteen static app assets byte-for-byte against the exact committed source using SHA-256; it retries during CDN propagation. It then launches real Chromium against the deployed URL using the existing browser smoke script. A deployment is not considered **end-to-end verified** until all three workflow jobs (`checks`, `deploy`, `hosted-acceptance`) pass.

GitHub Pages site: https://worldlinemuse-lgtm.github.io/multi-model-ai-platform/

Scope: exact source delivery, navigation, isolated JavaScript execution, stop control, HTML preview, mobile navigation and browser errors. Out of scope: credentials, arbitrary third-party AI provider inference, actual token quotas, and arbitrary-code isolation against adversarial test programs.

If the hosted job fails, inspect its logs; Pages can have transient cache propagation after deployment. Do not interpret a locally passing smoke test as proof that public deployment works.
