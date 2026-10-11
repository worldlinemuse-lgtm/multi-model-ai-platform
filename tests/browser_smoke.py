"""Optional real-browser acceptance run. A policy-blocked browser is explicitly NOT a pass.
Run: python tests/browser_smoke.py --base-url http://127.0.0.1:8000
Requires playwright and Chromium; GitHub Pages may also be supplied as --base-url.
"""
import argparse,sys
from pathlib import Path
from urllib.parse import urlsplit

def main():
 p=argparse.ArgumentParser();p.add_argument('--base-url',default='http://127.0.0.1:8000');args=p.parse_args()
 try:from playwright.sync_api import sync_playwright
 except ImportError:
  print('BLOCKED: playwright Python package is not installed.');return 2
 try:
  with sync_playwright() as pw:
   browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
   page=browser.new_page(viewport={'width':1360,'height':860})
   errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
   page.goto(args.base_url,timeout=18000)
   page.locator('#view-overview h1').wait_for(timeout=12000)
   assert page.get_by_text('Build with a whole',exact=False).count()>=1
   page.get_by_role('button',name='Open code studio').click()
   assert page.locator('#view-workspace').is_visible()
   page.locator('#run-code').click()
   page.locator('#console-output').get_by_text('Execution complete.',exact=False).wait_for(timeout=8000)
   assert '2 + 2 = 4' in page.locator('#console-output').inner_text()
   page.locator('#preview-page').click()
   assert page.frame_locator('#preview-host iframe').get_by_text('Hello from the browser workbench!').count()==1
   page.locator('#code-editor').fill('while(true){}')
   page.locator('#run-code').click()
   page.locator('#stop-code').click()
   assert not page.locator('#stop-code').is_enabled()
   page.set_viewport_size({'width':375,'height':790})
   page.locator('#mobile-menu').click()
   assert page.locator('#sidebar').evaluate('(e)=>e.classList.contains("open")')
   page.locator('#sidebar-close').click()
   assert not page.locator('#sidebar').evaluate('(e)=>e.classList.contains("open")')
   assert not errors,errors
   browser.close()
   print('PASS: real-browser navigation, JS isolated runner, preview, stop, mobile menu and JS errors');return 0
 except Exception as ex:
  print('BLOCKED' if 'ERR_BLOCKED_BY_ADMINISTRATOR' in str(ex) else 'FAIL',str(ex)[:1400]);return 2 if 'ERR_BLOCKED_BY_ADMINISTRATOR' in str(ex) else 1
if __name__=='__main__':sys.exit(main())
