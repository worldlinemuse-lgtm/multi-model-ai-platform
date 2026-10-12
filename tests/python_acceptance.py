"""P02: real Pyodide execution in sandboxed Chromium. No provider keys or mocks.

Run after installing Python Playwright+Chromium:
  python -u tests/python_acceptance.py --base-url http://127.0.0.1:8000
The test must fail, not claim success, if the Pyodide CDN is blocked or times out.
"""
import argparse
import sys
import traceback

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--base-url',default='http://127.0.0.1:8000')
    args=parser.parse_args()
    try:
        from playwright.sync_api import sync_playwright,expect
    except ImportError:
        print('BLOCKED: Playwright is not installed.',flush=True)
        return 2
    stage='launch Chromium'
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
            context=browser.new_context(viewport={'width':1280,'height':800})
            page=context.new_page()
            errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            stage='open Code Studio'
            page.goto(args.base_url,wait_until='domcontentloaded',timeout=25000)
            page.locator('#view-overview h1').wait_for(timeout=16000)
            page.get_by_role('button',name='Open code studio').click()
            expect(page.locator('#view-workspace')).to_be_visible(timeout=10000)
            stage='select project Python source'
            page.locator('#file-tree .file-entry[title="hello.py"]').click()
            page.locator('#runtime-choice').select_option('auto')
            stage='execute real Pyodide WebAssembly runtime from CDN'
            print('PYTHON CHECK: actual Pyodide cold-start requested, no fake CDN response',flush=True)
            page.locator('#run-code').click()
            page.wait_for_function(
              "() => document.querySelector('#console-output').textContent.includes('Python execution complete.')",
              polling=200,timeout=145000)
            content=page.locator('#console-output').inner_text()
            for required in ('Pyodide ready. Running Python','Python is running inside WebAssembly','2 + 2 = 4','Python execution complete.'):
                if required not in content:
                    raise AssertionError('Expected real Python evidence missing: '+required+'; log: '+content[-1300:])
            if errors:
                raise AssertionError('Browser JavaScript exception(s): '+str(errors)[:1200])
            stage='verify code worker releases the Stop action'
            expect(page.locator('#stop-code')).to_be_disabled(timeout=10000)
            page.locator('[data-view="overview"]').first.click()
            if 'EXECUTED' not in page.locator('#health-list').inner_text():
                raise AssertionError('Runtime successful execution not reflected in truthful browser health')
            context.close()
            browser.close()
            print('PASS: real Pyodide CDN load + WebAssembly Python output + completion + browser capability state',flush=True)
            return 0
    except Exception as error:
        print('FAIL: '+stage+': '+type(error).__name__+': '+str(error)[:1600],flush=True)
        traceback.print_exc()
        return 1
if __name__=='__main__':
    sys.exit(main())
