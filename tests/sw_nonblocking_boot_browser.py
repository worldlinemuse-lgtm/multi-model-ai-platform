"""Regression: browser app initialization must not depend on service-worker registration.
The test makes registration never settle; all network/provider traffic remains mock-free.
"""
import argparse
from playwright.sync_api import sync_playwright

def main(base):
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
  context=browser.new_context()
  page=context.new_page()
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.add_init_script("""() => {
    window.__registrationProbeCount = 0;
    if ('serviceWorker' in navigator) {
      Object.defineProperty(navigator.serviceWorker,'register',{
        configurable:true,
        value:()=>{window.__registrationProbeCount++;return new Promise(()=>{});}
      });
    }
  }""")
  page.goto(base,wait_until='domcontentloaded',timeout=30000)
  page.wait_for_function("document.documentElement.dataset.mmBoot==='ready'",timeout=12000)
  assert page.evaluate('window.__registrationProbeCount')==1,'Service worker registration was not attempted exactly once'
  page.locator('[data-view="providers"]').first.click()
  assert page.locator('#provider-check-groq').is_visible()
  assert not errors,errors
  context.close()
  browser.close()
 print('PASS: UI boot and provider navigation remain available despite a forever-pending service-worker registration',flush=True)

if __name__=='__main__':
 p=argparse.ArgumentParser()
 p.add_argument('--base-url',default='http://127.0.0.1:8000')
 args=p.parse_args()
 main(args.base_url)
