"""Synthetic Groq metadata diagnostics in real Chromium. All requests intercepted."""
import argparse,json
from playwright.sync_api import sync_playwright

def run(base):
    events=[];errors=[]
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
        ctx=browser.new_context();page=ctx.new_page()
        page.on('pageerror',lambda error:errors.append(str(error)))
        def intercept(route):
            url=route.request.url;method=route.request.method
            events.append((method,url))
            headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Authorization, Content-Type, Accept','Access-Control-Allow-Methods':'GET,OPTIONS'}
            if method=='OPTIONS':route.fulfill(status=204,headers=headers)
            elif method=='GET' and url=='https://api.groq.com/openai/v1/models':
                route.fulfill(status=200,headers={**headers,'Content-Type':'application/json'},body=json.dumps({'object':'list','data':[{'id':'llama-3.3-70b-versatile','active':True},{'id':'llama-3.1-8b-instant','active':True}]}))
            else:raise AssertionError('Unexpected metadata diagnostic request '+method+' '+url)
        page.route('https://api.groq.com/**',intercept)
        page.goto(base,wait_until='domcontentloaded',timeout=45000)
        page.wait_for_function("document.documentElement.dataset.mmBoot==='ready'",timeout=20000)
        page.locator('[data-view="providers"]').first.click()
        page.locator('#provider-check-groq').click()
        assert 'No unlocked Groq credential' in page.locator('#provider-groq-diagnostics').inner_text()
        assert not events,'Missing key triggered network'
        page.locator('[data-view="vault"]').first.click()
        page.locator('#vault-password').fill('not-a-real-secret-passphrase-QA-2026')
        page.locator('#vault-submit').click()
        page.wait_for_function("document.querySelector('#vault-status').textContent.includes('UNLOCKED')",timeout=15000)
        page.locator('#key-provider').select_option('groq')
        page.locator('#key-model').fill('llama-3.3-70b-versatile')
        page.locator('#key-value').fill('SYNTHETIC-MOCK-ONLY-NOT-A-REAL-KEY')
        page.locator('#key-attest').check()
        page.locator('#save-key').click()
        page.locator('[data-view="providers"]').first.click()
        page.once('dialog',lambda d:d.accept())
        page.locator('#provider-check-groq').click()
        page.wait_for_function("document.querySelector('#provider-groq-diagnostics').textContent.includes('models-received')",timeout=15000)
        report=page.locator('#provider-groq-diagnostics').inner_text()
        assert 'Current model in active list: yes' in report,report
        assert 'free-plan eligibility' in report.lower(),report
        assert 'SYNTHETIC-MOCK-ONLY' not in report
        assert [method for method,url in events if method=='GET']==['GET'],events
        assert all('/chat/completions' not in url for method,url in events),events
        assert not errors,errors
        ctx.close();browser.close()
    print('PASS: mock Groq diagnostic: exactly one models GET, no inference, no secrets in report',flush=True)
if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--base-url',default='http://127.0.0.1:8000')
    args=p.parse_args();run(args.base_url)
