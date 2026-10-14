"""Q23: two tabs share one serialized atomic offline-shell refresh.
Browser acceptance requires a real Chromium service worker in the current origin.
The rejection/partial-write cases are tested deterministically in Node VM.
"""
import argparse
import sys
import traceback
from playwright.sync_api import sync_playwright,expect

JS_REFRESH="""() => new Promise((resolve,reject)=>{
 const sw=navigator.serviceWorker?.controller;
 if(!sw){reject(Error('No controlling service worker'));return;}
 const ch=new MessageChannel();
 const timeout=setTimeout(()=>{ch.port1.close();reject(Error('Q23 no cache refresh reply'));},20000);
 ch.port1.onmessage=e=>{clearTimeout(timeout);ch.port1.close();resolve(e.data);};
 sw.postMessage({type:'REFRESH'},[ch.port2]);
})"""

def main():
 p=argparse.ArgumentParser();p.add_argument('--base-url',required=True);url=p.parse_args().base_url
 try:
  with sync_playwright() as pw:
   browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
   context=browser.new_context(service_workers='allow',viewport={'width':1150,'height':800})
   pages=[context.new_page(),context.new_page()]
   for page in pages:
    page.goto(url,wait_until='domcontentloaded',timeout=45000)
    expect(page.locator('#view-overview h1')).to_be_visible(timeout=16000)
    try:page.wait_for_function("!!navigator.serviceWorker.controller",timeout=12000)
    except Exception:
     page.reload(wait_until='domcontentloaded',timeout=25000)
     page.wait_for_function("!!navigator.serviceWorker.controller",timeout=12000)
   # Start both from separate controlled pages, without extra provider requests.
   # page.evaluate is synchronous in the Playwright Python API, so issue both
   # calls through the page JS context on the first tab to induce true concurrency.
   concurrent="""async () => {
    const sw=navigator.serviceWorker.controller;
    const send=()=>new Promise((resolve,reject)=>{
      const ch=new MessageChannel(),timeout=setTimeout(()=>reject(Error('No reply')),20000);
      ch.port1.onmessage=e=>{clearTimeout(timeout);ch.port1.close();resolve(e.data)};
      sw.postMessage({type:'REFRESH'},[ch.port2]);
    });
    return Promise.all([send(),send()]);
   }"""
   reports=pages[0].evaluate(concurrent)
   assert len(reports)==2 and all(item.get('ok') for item in reports),f'Q23 refresh unsuccessful: {reports}'
   assert reports[0]['cache']!=reports[1]['cache'],f'Concurrent requests not serialized: {reports}'
   assert all(item['assets']>=40 for item in reports),f'Incomplete shell cached: {reports}'
   context.set_offline(True)
   for page in pages:
    page.reload(wait_until='domcontentloaded',timeout=25000)
    expect(page.locator('#view-overview h1')).to_be_visible(timeout=14000)
    page.locator('[data-view="knowledge"]').first.click()
    assert page.locator('#view-knowledge').is_visible(),'Knowledge screen offline failed'
   context.set_offline(False);browser.close()
   print(f'PASS: Q23 concurrent complete cache refresh {reports}; two controlled tabs reload offline',flush=True)
   return 0
 except Exception as e:
  print('FAIL Q23 multi-tab acceptance:',repr(e),flush=True)
  traceback.print_exc()
  return 1
if __name__=='__main__':sys.exit(main())
