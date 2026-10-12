"""Regression acceptance for audited B0.3.2 defects. Browser profile isolated; fake keys are never sent.
Run: python tests/browser_regression.py --base-url http://127.0.0.1:8000
"""
import argparse,json,sys

def main():
 p=argparse.ArgumentParser();p.add_argument('--base-url',default='http://127.0.0.1:8000');args=p.parse_args()
 try:from playwright.sync_api import sync_playwright
 except ImportError:
  print('BLOCKED: Playwright package missing');return 2
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
  def fresh():
   context=browser.new_context(accept_downloads=True,viewport={'width':1320,'height':850})
   page=context.new_page()
   errors=[];page.on('pageerror',lambda exc:errors.append(str(exc)))
   page.goto(args.base_url,timeout=25000)
   page.locator('#view-overview h1').wait_for(timeout=16000)
   return context,page,errors
  try:
   # Real DOM and canvas: blanks are excluded, stale results vanish on parsing failure.
   context,page,errors=fresh()
   page.locator('[data-view="datalab"]').first.click()
   page.locator('#data-input').fill('label,value\nAlpha,10\nMissing,\nCharlie,20')
   page.locator('#data-analyze').click()
   print('REGRESSION WAIT 1',flush=True)
   page.wait_for_function("document.querySelector('#data-status').textContent.includes('mean 15.00')")
   assert page.locator('#data-table tbody tr').count()==3
   page.locator('#data-input').fill('bad,columns\n"unterminated')
   page.locator('#data-analyze').click()
   print('REGRESSION WAIT 2',flush=True)
   page.wait_for_function("document.querySelector('#data-status').textContent.startsWith('Analysis failed:')")
   assert page.locator('#data-table tbody tr').count()==0
   page.locator('[data-view="workflows"]').first.click()
   page.locator('#workflow-stages').fill('\n'.join(f'Stage {i}' for i in range(1,8)))
   assert '7 stages entered' in page.locator('#workflow-graph').inner_text()
   assert not errors,errors
   context.close()

   # Actual backup files + injected IndexedDB write errors. No success or destructive state swap on failures.
   context,page,errors=fresh()
   page.locator('[data-view="settings"]').first.click()
   with page.expect_download(timeout=10000) as info:page.locator('#backup-all').click()
   download=info.value
   from pathlib import Path
   backup=json.loads(Path(download.path()).read_text())
   invalid={**backup,'threads':[]}
   page.locator('#restore-all').set_input_files({'name':'broken.json','mimeType':'application/json','buffer':json.dumps(invalid).encode()})
   print('REGRESSION WAIT 3',flush=True)
   page.wait_for_function("document.querySelector('#toast').textContent.includes('Restore failed')")
   candidate=json.loads(json.dumps(backup));candidate['projects'][0]['name']='Restored Project Marker'
   payload={'name':'valid.json','mimeType':'application/json','buffer':json.dumps(candidate).encode()}
   page.on('dialog',lambda d:d.accept())
   page.evaluate("""() => {window._transactionOriginal=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(name,mode){if(mode==='readwrite')throw Error('Injected write failure');return window._transactionOriginal.call(this,name,mode)}}""")
   page.locator('#restore-all').set_input_files(payload)
   print('REGRESSION WAIT 4',flush=True)
   page.wait_for_function("document.querySelector('#toast').textContent.includes('Injected write failure')")
   assert page.locator('#stat-project').inner_text() != 'Restored Project Marker'
   page.evaluate('() => { IDBDatabase.prototype.transaction=window._transactionOriginal; }')
   page.locator('#restore-all').set_input_files(payload)
   print('REGRESSION WAIT 5',flush=True)
   page.wait_for_function("document.querySelector('#toast').textContent.includes('Workspace restored and saved')")
   assert page.locator('#stat-project').inner_text()=='Restored Project Marker'
   page.evaluate("""() => {IDBDatabase.prototype.transaction=function(name,mode){if(mode==='readwrite')throw Error('Injected write failure');return window._transactionOriginal.call(this,name,mode)}}""")
   page.locator('#reset-all').click()
   print('REGRESSION WAIT 6',flush=True)
   page.wait_for_function("document.querySelector('#toast').textContent.includes('Reset was not applied: Injected write failure')")
   assert page.locator('#stat-project').inner_text()=='Restored Project Marker'
   page.evaluate('() => { IDBDatabase.prototype.transaction=window._transactionOriginal; }')
   assert not errors,errors
   context.close()

   # Notes export/import is a real structured roundtrip, not a JSON-as-text substitution.
   context,page,errors=fresh()
   page.locator('[data-view="knowledge"]').first.click()
   page.locator('#knowledge-title').fill('Important reference')
   page.locator('#knowledge-content').fill('Reference data: 128')
   page.locator('#knowledge-form button[type="submit"]').click()
   print('REGRESSION WAIT 7',flush=True)
   page.wait_for_function("document.querySelector('#note-count').textContent.includes('1')")
   with page.expect_download() as info:page.locator('#knowledge-export').click()
   body=Path(info.value.path()).read_bytes()
   assert json.loads(body)['format']=='mm-studio-notes-v1'
   page.locator('#knowledge-search').fill('Important reference')
   page.locator('#knowledge-results button').first.click()
   assert 'Reference data: 128' in page.locator('#knowledge-preview').inner_text()
   page.on('dialog',lambda dialog:dialog.accept())
   page.locator('#knowledge-delete').click()
   print('REGRESSION WAIT 8',flush=True)
   page.wait_for_function("document.querySelector('#note-count').textContent.includes('0')")
   page.locator('#knowledge-import').set_input_files({'name':'mm-knowledge.json','mimeType':'application/json','buffer':body})
   print('REGRESSION WAIT 9',flush=True)
   page.wait_for_function("document.querySelector('#note-count').textContent.includes('1')")
   page.locator('#knowledge-results button').first.click()
   assert 'Reference data: 128' in page.locator('#knowledge-preview').inner_text()
   assert not errors,errors
   context.close()

   # Explicit comparison route chooser and Cloudflare account selection, using only nonworking test values.
   context,page,errors=fresh()
   page.locator('[data-view="vault"]').first.click()
   # A locked/uncreated vault must never prevent typing provider details.
   assert page.locator('#key-provider').is_enabled()
   assert page.locator('#key-model').is_enabled()
   assert page.locator('#key-value').is_enabled()
   assert page.locator('#key-account').is_enabled()
   page.locator('#key-provider').select_option('groq')
   page.locator('#key-model').fill('test-model-before-unlock')
   page.locator('#key-value').fill('typed-before-unlock')
   assert page.locator('#key-value').input_value()=='typed-before-unlock'
   page.locator('#save-key').click()
   assert page.locator('#key-value').input_value()=='typed-before-unlock'
   assert 'first create or unlock' in page.locator('#vault-entry-hint').inner_text().lower()
   assert 'First create or unlock' in page.locator('#toast').inner_text()
   page.locator('#vault-password').fill('not-a-real-key-test-passphrase')
   page.locator('#vault-submit').click()
   print('REGRESSION WAIT 10',flush=True)
   page.wait_for_function("document.querySelector('#vault-status').textContent==='UNLOCKED'",timeout=12000)
   assert page.locator('#key-value').input_value()=='typed-before-unlock'
   assert page.locator('#key-model').input_value()=='test-model-before-unlock'
   def save_provider(route,key,account=''):
    page.locator('#key-provider').select_option(route)
    page.locator('#key-value').fill(key)
    page.locator('#key-account').fill(account)
    page.locator('#key-attest').check()
    page.locator('#save-key').click()
    print('REGRESSION WAIT 11',flush=True)
    page.wait_for_function("document.querySelector('#toast').textContent.includes('Encrypted key slot saved')")
   save_provider('groq','dummy-groq-key')
   save_provider('cloudflare','dummy-cloudflare-key','0'*32)
   page.locator('[data-view="providers"]').first.click()
   cloudflare=page.locator('.provider-card').filter(has=page.get_by_role('heading',name='Cloudflare Workers AI'))
   cloudflare.get_by_role('button',name='Manage saved key').click()
   assert page.locator('#key-account').input_value()=='0'*32
   page.locator('[data-view="chat"]').first.click()
   page.locator('#chat-route').select_option('groq')
   page.locator('#compare-mode').check()
   assert page.locator('#compare-route-wrap').is_visible()
   assert page.locator('#compare-route option[value="cloudflare"]').count()==1
   assert page.locator('#compare-route option[value="groq"]').count()==0
   page.locator('#compare-route').select_option('cloudflare')
   assert not errors,errors
   context.close()
   browser.close()
   print('PASS: corrected numeric stats, stale error handling, workflow cap, safe backup failure, note roundtrip, Cloudflare account, explicit comparison route')
   return 0
  except Exception as exc:
   import traceback
   print('FAIL: B0.3.3 browser regressions: '+traceback.format_exc()[-3000:],flush=True);return 1

if __name__=='__main__':sys.exit(main())
