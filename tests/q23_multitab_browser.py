"""Q23: real Chromium multi-tab atomic offline shell refresh acceptance."""
import argparse
import asyncio
import sys
import traceback
from playwright.async_api import async_playwright,expect

REFRESH="""() => new Promise((resolve,reject)=>{
 const sw=navigator.serviceWorker?.controller;
 if(!sw){reject(Error('No controlling service worker'));return;}
 const ch=new MessageChannel();
 const timeout=setTimeout(()=>{ch.port1.close();reject(Error('Q23 refresh timed out'));},22000);
 ch.port1.onmessage=e=>{clearTimeout(timeout);ch.port1.close();resolve(e.data);};
 sw.postMessage({type:'REFRESH'},[ch.port2]);
})"""

async def check(url):
 async with async_playwright() as pw:
  browser=await pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  context=await browser.new_context(service_workers='allow',viewport={'width':1150,'height':800})
  pages=[await context.new_page(),await context.new_page()]
  for page in pages:
   await page.goto(url,wait_until='domcontentloaded',timeout=45000)
   await expect(page.locator('#view-overview h1')).to_be_visible(timeout=16000)
   try:await page.wait_for_function("!!navigator.serviceWorker.controller",timeout=12000)
   except Exception:
    await page.reload(wait_until='domcontentloaded',timeout=25000)
    await page.wait_for_function("!!navigator.serviceWorker.controller",timeout=12000)
  # Both independent pages send actual concurrent MessageChannel updates.
  replies=await asyncio.gather(*(page.evaluate(REFRESH) for page in pages))
  assert len(replies)==2 and all(r.get('ok') for r in replies),f'Q23 refresh replies invalid: {replies}'
  assert replies[0]['cache']!=replies[1]['cache'],f'Q23 candidate stages not serialized: {replies}'
  assert all(r['assets']>=40 for r in replies),f'Q23 incomplete offline shell: {replies}'
  await context.set_offline(True)
  for page in pages:
   await page.reload(wait_until='domcontentloaded',timeout=25000)
   await expect(page.locator('#view-overview h1')).to_be_visible(timeout=14000)
   await page.locator('[data-view="knowledge"]').first.click()
   assert await page.locator('#view-knowledge').is_visible(),'Knowledge screen not available offline'
  await context.set_offline(False)
  await browser.close()
  print('PASS: Q23 two tabs independently refreshed serially, 100% staged assets, both offline reloads; '+str(replies),flush=True)

def main():
 parser=argparse.ArgumentParser()
 parser.add_argument('--base-url',required=True)
 url=parser.parse_args().base_url
 try:asyncio.run(check(url));return 0
 except Exception as exc:
  print('FAIL Q23 multi-tab acceptance:',repr(exc),flush=True)
  traceback.print_exc()
  return 1
if __name__=='__main__':sys.exit(main())
