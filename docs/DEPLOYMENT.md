# Publishing the studio to GitHub Pages

This project **does not modify** `worldlinemuse-lgtm/worldlinemuse-lgtm.github.io` (Muse's existing website). GitHub Pages supports a project-specific static site at its own path.

**Expected site URL when enabled:** https://worldlinemuse-lgtm.github.io/multi-model-ai-platform/

## Owner action (one-time)

1. Open [repository Pages settings](https://github.com/worldlinemuse-lgtm/multi-model-ai-platform/settings/pages), signed in as `worldlinemuse-lgtm`.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Open the [Actions tab](https://github.com/worldlinemuse-lgtm/multi-model-ai-platform/actions), select **Deploy browser studio**, and choose **Run workflow** on `main` if no deployment started automatically.
4. Wait for the workflow's checks and deployment to finish. Then open the expected site URL above. Give the initial deployment time to propagate.

The workflow performs `npm test`, uploads the static source tree and deploys it via GitHub's supported Pages actions. The standard `GITHUB_TOKEN` cannot itself enable Pages in a previously unconfigured repository; the settings step above is necessary.

## If you prefer deploy from a branch

GitHub Pages also serves static files directly from `main` at repository root when **Deploy from a branch → main / (root)** is selected. The included `index.html` has relative links and supports this layout. The workflow-based option adds automated tests and is recommended.

## What hosting does and does not supply

Hosting supplies the interface and browser-local features. No backend server, cloud VM, proprietary paid API, key vault service or server-side code runner is automatically deployed. Browser inference calls send requests directly to the user-selected provider after explicit approval; browser CORS and provider rules may block some routes. The initial Python runtime download requires a separate online connection to jsDelivr.

## Testing after publication

See [manual test protocol](HOW_TO_TEST.md). Never check an actual API key into the public repository. Keys saved in the browser are encrypted at rest and are not automatically shared with the repository.
