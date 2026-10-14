"""Verify the live GitHub Pages site is serving the exact committed application assets.

This intentionally runs AFTER deployment from GitHub Actions, rather than testing
localhost or trusting the Pages action's success state. No credentials are read.
"""
import argparse
import hashlib
import sys
import time
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
ASSETS = (
    'index.html', 'styles.css', 'provider-guides.js',
    'src/main.js', 'src/core.js', 'src/labs.js','src/speech-settings.js','src/image-transform.js', 'src/data-tools.js', 'src/project-files.js', 'src/preview-assets.js', 'src/note-tools.js', 'src/snapshot-diff.js', 'src/capability-probes.js', 'src/knowledge.js','src/wasm-policy.js','src/wasm-runner.js','src/wasm-worker.js','src/wasm-ui.js','src/expression-repl.js','src/expression-repl-worker.js','src/expression-repl-ui.js','src/workflow-plan.js','src/workflow-supervisor.js','src/local-evidence.js','src/review-edits.js','src/docx-text.js','src/knowledge-documents.js',
    'src/provider-api.js','src/request-trace.js', 'src/sandbox.js', 'src/module-graph.js', 'src/module-linker.js', 'src/module-runtime.js', 'src/storage.js',
    'src/vault.js', 'src/zip.js', 'sw.js', 'favicon.svg',
)


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def verify_once(base):
    problems = []
    for path in ASSETS:
        expected = (ROOT / path).read_bytes()
        url = urljoin(base, path)
        try:
            request = Request(url, headers={'User-Agent': 'MultiModelStudio-Hosted-Integrity/1.0', 'Cache-Control': 'no-cache'})
            with urlopen(request, timeout=15) as response:
                actual = response.read(2_000_001)
                status = response.status
                final_url = response.url
            if status != 200 or len(actual) > 2_000_000:
                problems.append(f'{path}: HTTP {status} or response exceeds size limit')
            elif sha256(actual) != sha256(expected):
                problems.append(f'{path}: SHA-256 mismatch local={sha256(expected)} hosted={sha256(actual)} url={final_url}')
        except Exception as error:
            problems.append(f'{path}: {type(error).__name__}: {error}')
    return problems


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-url', required=True, help='GitHub Pages output URL (must end in repo root)')
    parser.add_argument('--attempts', type=int, default=18)
    parser.add_argument('--interval', type=float, default=5.0)
    args = parser.parse_args()
    base = args.base_url.rstrip('/') + '/'
    if not base.startswith('https://') or args.attempts < 1 or args.interval < 0:
        parser.error('Use a public HTTPS URL and nonnegative retry limits')
    for attempt in range(1, args.attempts + 1):
        problems = verify_once(base)
        if not problems:
            print(f'PASS: {len(ASSETS)} exact SHA-256 matched hosted assets at {base} (attempt {attempt})')
            return 0
        print(f'Attempt {attempt}/{args.attempts} did not match deployed source ({len(problems)} issues):', flush=True)
        for problem in problems[:5]:
            print('  ' + problem, flush=True)
        if attempt < args.attempts:
            time.sleep(args.interval)
    print('FAIL: hosted GitHub Pages files do not match this checked-out release', flush=True)
    return 1


if __name__ == '__main__':
    sys.exit(main())
