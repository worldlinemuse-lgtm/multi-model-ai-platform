"""Real Chromium acceptance of the warm offline application shell.

No provider credentials or external API requests. Validates behavior after a
successful online installation, not offline-first installation on a new device.
"""
import argparse
import sys
import traceback

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--base-url',default='http://127.0.0.1:8000')
    args=parser.parse_args()
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print('BLOCKED: Playwright not installed',flush=True)
        return 2
    stage='open browser'
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
            context=browser.new_context(service_workers='allow',viewport={'width':1280,'height':800})
            page=context.new_page()
            errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            stage='install application shell online'
            print('OFFLINE CHECK:',stage,flush=True)
            page.goto(args.base_url,wait_until='domcontentloaded',timeout=25000)
            page.locator('#view-overview h1').wait_for(timeout=16000)
            stage='wait for controlling service worker'
            try:
                page.wait_for_function("() => !!navigator.serviceWorker?.controller",polling=200,timeout=18000)
            except Exception:
                page.reload(wait_until='domcontentloaded',timeout=25000)
                page.wait_for_function("() => !!navigator.serviceWorker?.controller",polling=200,timeout=18000)
            stage='reload cached page with internet disabled'
            context.set_offline(True)
            page.reload(wait_until='domcontentloaded',timeout=20000)
            page.locator('#view-overview h1').wait_for(timeout=14000)
            stage='navigate offline and analyze local data'
            page.locator('[data-view="datalab"]').first.click()
            page.locator('#data-input').fill('label,value\\nAlpha,10\\nBeta,20')
            page.locator('#data-analyze').click()
            page.wait_for_function("() => document.querySelector('#data-status').textContent.includes('mean 15.00')",polling=100,timeout=10000)
            page.locator('[data-view="knowledge"]').first.click()
            if not page.locator('#view-knowledge').is_visible():
                raise AssertionError('Knowledge view inaccessible offline')
            if errors:
                raise AssertionError('Offline browser JS errors: '+repr(errors))
            context.set_offline(False)
            browser.close()
            print('PASS: real offline page reload, local Data Lab computation and navigation',flush=True)
            return 0
    except Exception as error:
        print('FAIL: '+stage+': '+type(error).__name__+': '+str(error)[:1500],flush=True)
        traceback.print_exc()
        return 1

if __name__=='__main__':
    sys.exit(main())
