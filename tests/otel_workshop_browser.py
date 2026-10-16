"""Real-workshop OTel acceptance: the production app (not an isolated harness)
initializes the real SDK, mirrors operations, and renders diagnostics.

Runs on localhost or the deployed GitHub Pages URL. Uses no real providers
and never navigates to other origins.
"""
import argparse
import sys


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-url', default='http://127.0.0.1:8000')
    args = parser.parse_args()
    try:
        from playwright.sync_api import sync_playwright, expect
    except ImportError:
        print('BLOCKED: playwright Python package is not installed.', flush=True)
        return 2
    stage = 'initialize Chromium'
    def checkpoint(name):
        print('CHECK: ' + name, flush=True)
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True, args=['--no-sandbox'])
            page = browser.new_page(viewport={'width': 1360, 'height': 860})
            errors = []
            outgoing = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            def route_handler(route):
                if route.request.url.startswith(args.base_url.rstrip('/') + '/'):
                    route.continue_()
                else:
                    outgoing.append(route.request.url)
                    route.abort()
            page.route('**/*', route_handler)

            checkpoint('open workshop and wait for boot')
            page.goto(args.base_url, wait_until='domcontentloaded', timeout=25000)
            page.wait_for_function("['ready','failed','degraded'].includes(document.documentElement.dataset.mmBoot)", timeout=15000)
            assert page.evaluate('document.documentElement.dataset.mmBoot') == 'ready', 'app boot not ready'

            checkpoint('run code to generate a real operation')
            page.get_by_role('button', name='Open code studio').click()
            expect(page.locator('#view-workspace')).to_be_visible(timeout=10000)
            page.locator('#run-code').click()
            expect(page.locator('#console-output').get_by_text('Execution complete.', exact=False)).to_be_visible(timeout=15000)

            checkpoint('open diagnostics and refresh')
            page.locator('[data-view="capabilities"]').first.click()
            expect(page.locator('#view-capabilities')).to_be_visible(timeout=10000)
            page.locator('#workshop-metrics-refresh').click()
            otel = page.locator('#otel-diagnostics')
            expect(otel).to_contain_text('OpenTelemetry SDK state:', timeout=15000)

            checkpoint('verify SDK reached ready state')
            state_text = otel.inner_text()
            assert 'READY' in state_text, f'OTel SDK not ready in real workshop: {state_text[:300]}'

            checkpoint('verify the code run was mirrored as a real span')
            expect(otel).to_contain_text('workshop.code_run', timeout=10000)
            expect(otel).to_contain_text('workshop.boot', timeout=10000)

            checkpoint('verify no external network and no page errors')
            assert not outgoing, f'unexpected external network: {outgoing[:3]}'
            assert not errors, f'page errors: {errors[:3]}'

            browser.close()
            print('PASS: real workshop OTel SDK ready, operations mirrored, diagnostics rendered, no external network')
            return 0
    except Exception as e:
        print(f'FAIL at stage [{stage}]: {e}', flush=True)
        return 1


if __name__ == '__main__':
    sys.exit(main())
