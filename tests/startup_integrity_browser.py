"""Browser regression: a mixed-version HTML shell must surface a degraded boot, not a silent success.
Uses a synthetic missing optional DOM element. No API credentials or provider requests.
"""
import argparse
import sys
from playwright.sync_api import sync_playwright

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--base-url',required=True)
    args=parser.parse_args()
    stage='launch'
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
            context=browser.new_context(service_workers='block')
            page=context.new_page()
            altered=[]
            def alter_html(route):
                if route.request.resource_type!='document':
                    return route.continue_()
                response=route.fetch()
                html=response.text()
                needle='id="recovery-tools"'
                if needle not in html:
                    raise AssertionError('No expected recovery-tools markup in served HTML')
                altered.append(True)
                return route.fulfill(response=response,body=html.replace(needle,'data-qa-missing-id="recovery-tools"',1))
            page.route('**/*',alter_html)
            stage='load intentionally mismatched HTML'
            page.goto(args.base_url,wait_until='domcontentloaded',timeout=25000)
            page.wait_for_function("['ready','degraded','failed'].includes(document.documentElement.dataset.mmBoot)",timeout=15000)
            status=page.evaluate('document.documentElement.dataset.mmBoot')
            assert altered,'HTML mismatch fixture was not applied'
            assert status=='degraded',f'Expected explicit degraded state, got {status}'
            assert 'recovery-tools' in page.locator('#toast').inner_text(),'Missing DOM control was not reported'
            stage='verify unaffected navigation still functions'
            page.locator('[data-view="chat"]').first.click()
            assert page.locator('[data-screen="chat"]').is_visible()
            context.close()
            browser.close()
            print('PASS: startup reports mixed-revision DOM and unaffected navigation remains usable',flush=True)
            return 0
    except Exception as exc:
        blocked='ERR_BLOCKED_BY_ADMINISTRATOR' in str(exc)
        print(('BLOCKED' if blocked else 'FAIL')+': startup integrity '+stage+': '+str(exc)[:1600],flush=True)
        return 2 if blocked else 1

if __name__=='__main__':
    sys.exit(main())
