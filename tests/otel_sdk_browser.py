"""Real Chromium smoke for an isolated OTel SDK bundle served on loopback.
Never runs on the public production page, uses no real providers, and never navigates to other origins.
"""
import argparse
import sys
from playwright.sync_api import sync_playwright, expect


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--base-url',default='http://127.0.0.1:8000')
    args=parser.parse_args()
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
        ctx=browser.new_context()
        page=ctx.new_page()
        outgoing=[]
        def route_handler(route):
            if route.request.url.startswith(args.base_url.rstrip('/')+'/'):
                route.continue_()
            else:
                outgoing.append('unexpected-network')
                route.abort()
        page.route('**/*',route_handler)
        errors=[]
        page.on('pageerror',lambda e:errors.append('pageerror'))
        page.goto(args.base_url.rstrip('/')+'/observability/browser-harness.html',wait_until='domcontentloaded',timeout=25000)
        expect(page.locator('#result')).to_have_text('PASS',timeout=15000)
        assert not outgoing,'Unexpected external network request attempted'
        assert not errors,'Browser runtime exception'
        ctx.close()
        browser.close()
        print('PASS: actual OTel SDK browser bundle; local trace; parent-child; no external network')
        return 0

if __name__=='__main__':
    sys.exit(main())
