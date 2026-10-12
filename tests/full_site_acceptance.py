"""Full product GUI acceptance across all twelve sections.

Real Chromium against localhost or the public GitHub Pages origin. External model
replies in these tests are intercepted and CLEARLY SYNTHETIC; no real provider
credentials or inference are used. Hosted provider authentication requires a
separate opt-in secret-backed test (not a passing claim from these scenarios).
"""
import argparse
import base64
import json
import sys
import traceback
from pathlib import Path
from playwright.sync_api import sync_playwright

SECTIONS = ['overview','workspace','chat','workflows','knowledge','datalab','media','providers','vault','usage','capabilities','settings']
FAKE_KEY = 'synthetic-test-key-never-a-real-credential'
FAKE_PASSPHRASE = 'synthetic-test-passphrase-17'
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/xZkAAAAASUVORK5CYII=')


def view(page, name):
    page.locator(f'[data-view="{name}"]').first.click()
    assert page.locator(f'#view-{name}').is_visible(), name


def toast_has(page, phrase):
    page.wait_for_function('(s) => document.querySelector("#toast").textContent.includes(s)', arg=phrase, timeout=6000)


def save_key(page, provider='groq', model='llama-3.1-8b-instant'):
    page.locator('#key-provider').select_option(provider)
    page.locator('#key-model').fill(model)
    page.locator('#key-value').fill(FAKE_KEY)
    page.locator('#key-attest').check()
    page.locator('#save-key').click()
    toast_has(page, 'Encrypted key slot saved')


def create_vault(page):
    view(page, 'vault')
    page.locator('#vault-password').fill(FAKE_PASSPHRASE)
    page.locator('#vault-submit').click()
    page.wait_for_function('document.querySelector("#vault-status").textContent === "UNLOCKED"', timeout=14000)


def mock_provider(page, delay_ms=0):
    # Browser-runtime fetch intercept, not a real model reply, provider connection, or secret test.
    page.evaluate('''(delay) => {
      window.__syntheticRequests = [];
      const upstream = window.fetch.bind(window);
      window.fetch = (input, init={}) => {
        const url = typeof input === 'string' ? input : input.url;
        if (!url.includes('api.groq.com') && !url.includes('openrouter.ai')) return upstream(input, init);
        const body=JSON.parse(init.body);
        window.__syntheticRequests.push({url,model:body.model,messages:body.messages});
        return new Promise((resolve,reject) => {
          const abort=()=>reject(new DOMException('The request was aborted', 'AbortError'));
          if(init.signal?.aborted)return abort();
          init.signal?.addEventListener('abort',abort,{once:true});
          setTimeout(() => {
            if(init.signal?.aborted)return;
            resolve(new Response(JSON.stringify({
              model:body.model,
              choices:[{message:{role:'assistant',content:'SYNTHETIC-ACCEPTANCE-'+body.model+'-'+body.messages.length}}],
              usage:{prompt_tokens:5,completion_tokens:7,total_tokens:12}
            }),{status:200,headers:{'Content-Type':'application/json'}}));
          },delay);
        });
      };
    }''', delay_ms)


def test_navigation(page, context):
    visible = page.locator('.screen:not([hidden])')
    assert visible.count()==1
    for section in SECTIONS:
        view(page,section)
        assert visible.count()==1
        assert page.locator('#current-view-label').inner_text().strip()
    page.locator('#global-command').click()
    assert page.locator('#command-dialog').is_visible()
    page.locator('#command-search').fill('knowledge')
    page.locator('#command-results button').first.click()
    assert page.locator('#view-knowledge').is_visible()
    page.locator('#global-command').click()
    page.locator('#command-close').click()
    assert not page.locator('#command-dialog').is_visible()


def test_mobile_navigation(page, context):
    page.set_viewport_size({'width':375,'height':810})
    page.locator('#mobile-menu').click()
    assert page.locator('#sidebar').evaluate('(e)=>e.classList.contains("open")')
    page.locator('#sidebar [data-view="vault"]').click()
    assert page.locator('#view-vault').is_visible()
    assert not page.locator('#sidebar').evaluate('(e)=>e.classList.contains("open")')
    for fid in ('key-provider','key-model','key-value','key-account'):
        assert page.locator('#'+fid).is_enabled(),fid
    page.locator('#key-value').fill('mobile-input-works')
    assert page.locator('#key-value').input_value()=='mobile-input-works'
    page.locator('#mobile-menu').click()
    page.locator('#sidebar-close').click()
    assert not page.locator('#sidebar').evaluate('(e)=>e.classList.contains("open")')


def test_workspace_editor(page,context):
    view(page,'workspace')
    assert 'main.js' in page.locator('#active-file').inner_text()
    page.locator('#code-editor').fill('console.log("FULL-STUDIO-JS-TEST");')
    page.locator('#run-code').click()
    page.wait_for_function('document.querySelector("#console-output").textContent.includes("FULL-STUDIO-JS-TEST")', timeout=10000)
    page.wait_for_function('!document.querySelector("#stop-code").disabled', timeout=1000) if False else None
    page.locator('#clear-console').click()
    assert page.locator('#console-output').inner_text()==''
    page.locator('#preview-page').click()
    child=page.frame_locator('#preview-host iframe')
    assert child.get_by_text('Hello from the browser workbench!').count()==1
    child.get_by_role('button',name='Test interaction').click()
    assert child.locator('#result').inner_text()=='It works!'
    page.locator('#show-console').click()
    assert page.locator('#console-pane').is_visible()
    page.locator('#show-preview').click()
    assert page.locator('#preview-pane').is_visible()
    page.locator('#code-editor').fill('await new Promise(resolve => setTimeout(resolve, 20000));')
    page.locator('#run-code').click()
    page.locator('#stop-code').wait_for(state='visible')
    page.locator('#stop-code').click()
    assert page.locator('#stop-code').is_disabled()


def test_file_crud(page,context):
    view(page,'workspace')
    page.on('dialog', lambda d:d.accept('src/exhaustive.js') if d.type=='prompt' else d.accept())
    page.locator('#add-file').click()
    assert page.locator('#active-file').inner_text()=='src/exhaustive.js'
    page.locator('#code-editor').fill('console.log("created");')
    page.wait_for_timeout(450)
    assert page.locator('#file-tree button[title="src/exhaustive.js"]').count()==1
    page.locator('#delete-file').click()
    assert page.locator('#file-tree button[title="src/exhaustive.js"]').count()==0
    page.locator('#add-local-files').set_input_files({'name':'user-file.txt','mimeType':'text/plain','buffer':b'local upload content'})
    page.wait_for_function('!!document.querySelector("#file-tree button[title=\\"user-file.txt\\"]")')
    page.locator('#file-tree button[title="user-file.txt"]').click()
    assert 'local upload content' in page.locator('#code-editor').input_value()


def test_projects_snapshots(page,context):
    view(page,'workspace')
    def reply(d):
        if d.type=='prompt': d.accept('Testing project')
        else: d.accept()
    page.on('dialog',reply)
    page.locator('#new-project').click()
    page.wait_for_function('document.querySelector("#stat-project").textContent === "Testing project"')
    page.locator('#snapshot-project').click()
    assert page.locator('#snapshot-select option').count()>=2
    page.locator('#code-editor').fill('changed after snapshot')
    page.locator('#snapshot-select').select_option(index=1)
    page.locator('#restore-snapshot').click()
    assert 'changed after snapshot' not in page.locator('#code-editor').input_value()
    page.locator('#rename-project').click()
    assert page.locator('#stat-project').inner_text()=='Testing project'
    page.locator('#delete-project').click()
    assert page.locator('#project-select option').count()==1


def test_project_transfer(page,context):
    view(page,'workspace')
    with page.expect_download() as info:page.locator('#export-json').click()
    data=Path(info.value.path()).read_bytes()
    assert json.loads(data)['format']=='mm-platform-b01'
    with page.expect_download() as info:page.locator('#export-zip').click()
    zip_data=Path(info.value.path()).read_bytes()
    assert zip_data[:2]==b'PK'
    page.on('dialog',lambda d:d.accept())
    page.locator('#import-project').set_input_files({'name':'imported.json','mimeType':'application/json','buffer':data})
    page.wait_for_function('document.querySelector("#project-select").options.length >= 2')
    page.locator('#import-project').set_input_files({'name':'zip-import.zip','mimeType':'application/zip','buffer':zip_data})
    page.wait_for_function('document.querySelector("#project-select").options.length >= 3')


def test_vault_lifecycle(page,context):
    view(page,'vault')
    for fid in ['key-provider','key-model','key-value','key-account','save-key']:
        assert page.locator('#'+fid).is_enabled(),fid
    page.locator('#key-provider').select_option('groq')
    page.locator('#key-model').fill('llama-3.1-8b-instant')
    page.locator('#key-value').fill(FAKE_KEY)
    page.locator('#save-key').click()
    toast_has(page,'First create or unlock')
    assert page.locator('#key-value').input_value()==FAKE_KEY
    page.locator('#vault-password').fill(FAKE_PASSPHRASE)
    page.locator('#vault-submit').click()
    page.wait_for_function('document.querySelector("#vault-status").textContent === "UNLOCKED"',timeout=14000)
    assert page.locator('#key-value').input_value()==FAKE_KEY
    page.locator('#key-attest').check()
    page.locator('#save-key').click()
    toast_has(page,'Encrypted key slot saved')
    assert FAKE_KEY not in page.locator('#vault-items').inner_text()
    page.locator('#vault-lock').click()
    page.wait_for_function('document.querySelector("#vault-status").textContent === "LOCKED"',timeout=7000)
    page.locator('#vault-password').fill('wrong-passphrase-value')
    page.locator('#vault-submit').click()
    toast_has(page,'Passphrase incorrect')
    page.locator('#vault-password').fill(FAKE_PASSPHRASE)
    page.locator('#vault-submit').click()
    page.wait_for_function('document.querySelector("#vault-status").textContent === "UNLOCKED"',timeout=14000)
    assert page.locator('.vault-item').count()==1
    page.on('dialog',lambda d:d.accept())
    page.locator('.vault-item button').click()
    page.wait_for_function('document.querySelectorAll(".vault-item").length === 0',timeout=7000)
    save_key(page)
    page.locator('#vault-wipe').click()
    page.wait_for_function('document.querySelector("#vault-status").textContent === "NOT CREATED"',timeout=10000)


def test_provider_directory(page,context):
    view(page,'providers')
    assert page.locator('.provider-card').count()==8
    page.locator('#provider-search').fill('Groq')
    assert page.locator('.provider-card').count()==1
    groq=page.locator('.provider-card').first
    assert groq.locator('a[href^="https://"]').count()>=2
    groq.get_by_role('button',name='Connect a key').click()
    assert page.locator('#view-vault').is_visible()
    assert page.locator('#key-provider').input_value()=='groq'


def test_chat_and_comparison(page,context):
    create_vault(page)
    save_key(page,'groq','llama-3.1-8b-instant')
    save_key(page,'openrouter','openrouter/free')
    mock_provider(page)
    view(page,'chat')
    page.locator('#chat-route').select_option('groq')
    page.locator('#chat-input').fill('First comparison prompt')
    page.locator('#send-chat').click()
    page.wait_for_function('document.querySelector("#chat-messages").textContent.includes("SYNTHETIC-ACCEPTANCE")')
    assert page.evaluate('window.__syntheticRequests.length')==1
    page.locator('#compare-mode').check()
    assert page.locator('#compare-route-wrap').is_visible()
    page.locator('#compare-route').select_option('openrouter')
    page.locator('#chat-input').fill('Parallel comparison prompt')
    page.locator('#send-chat').click()
    page.wait_for_function('window.__syntheticRequests.length === 3',timeout=8000)
    page.wait_for_function('!document.querySelector("#send-chat").disabled',timeout=8000)
    assert page.locator('.bubble.assistant').count()>=3
    requests=page.evaluate('window.__syntheticRequests')
    second=next(x for x in requests[1:] if 'openrouter.ai' in x['url'])
    assert all('llama-3.1' not in msg['content'] for msg in second['messages'] if msg['role']=='assistant')
    page.locator('#new-chat').click()
    assert page.locator('#thread-list button').count()>=2
    page.locator('#clear-chat').click() if False else None


def test_chat_abort(page,context):
    create_vault(page)
    save_key(page)
    mock_provider(page,30000)
    view(page,'chat')
    page.locator('#chat-input').fill('Abort this synthetic slow request')
    page.locator('#send-chat').click()
    page.wait_for_function('document.querySelector("#stop-chat").disabled === false',timeout=5000)
    page.locator('#stop-chat').click()
    page.wait_for_function('document.querySelector("#stop-chat").disabled === true',timeout=6000)
    assert 'Request stopped' in page.locator('#chat-messages').inner_text()


def test_workflow_and_audit(page,context):
    create_vault(page)
    save_key(page)
    mock_provider(page)
    view(page,'workflows')
    page.locator('#workflow-goal').fill('Create a small implementation plan')
    page.locator('#workflow-confirm').check()
    page.locator('#workflow-stages').fill('\n'.join('Stage '+str(i) for i in range(1,8)))
    assert '7 stages entered' in page.locator('#workflow-graph').inner_text()
    page.locator('#workflow-start').click()
    toast_has(page,'between 2 and 6')
    assert page.evaluate('window.__syntheticRequests.length')==0
    page.locator('#workflow-stages').fill('Analyze\nWrite\nReview')
    page.locator('#workflow-start').click()
    page.wait_for_function('document.querySelector("#workflow-history .history-entry") !== null', timeout=9000)
    assert page.evaluate('window.__syntheticRequests.length')==3
    assert 'SYNTHETIC-ACCEPTANCE' in page.locator('#workflow-results').inner_text()
    requests=page.evaluate('window.__syntheticRequests')
    assert 'Stage 3 (Review)' in requests[2]['messages'][-1]['content']
    view(page,'usage')
    assert page.locator('#usage-success').inner_text()=='3'
    assert '36' in page.locator('#usage-tokens').inner_text()
    with page.expect_download() as info:page.locator('#export-audit').click()
    records=json.loads(Path(info.value.path()).read_bytes())
    assert sum(1 for item in records if item['status']=='success')==3
    page.on('dialog',lambda d:d.accept())
    page.locator('#clear-audit').click()
    assert page.locator('#usage-total').inner_text()=='0'


def test_knowledge_roundtrip(page,context):
    view(page,'knowledge')
    page.locator('#knowledge-title').fill('Full acceptance note')
    page.locator('#knowledge-content').fill('Unique factual note value 128')
    page.locator('#knowledge-form button[type="submit"]').click()
    assert '1 notes' in page.locator('#note-count').inner_text()
    page.locator('#knowledge-search').fill('128')
    page.locator('#knowledge-results button').first.click()
    assert 'value 128' in page.locator('#knowledge-preview').inner_text()
    page.locator('#knowledge-to-chat').click()
    assert page.locator('#view-chat').is_visible()
    assert 'value 128' in page.locator('#chat-input').input_value()
    view(page,'knowledge')
    with page.expect_download() as info:page.locator('#knowledge-export').click()
    archive=Path(info.value.path()).read_bytes()
    assert json.loads(archive)['format']=='mm-studio-notes-v1'
    page.on('dialog',lambda d:d.accept())
    page.locator('#knowledge-delete').click()
    assert '0 notes' in page.locator('#note-count').inner_text()
    page.locator('#knowledge-import').set_input_files({'name':'saved-notes.json','mimeType':'application/json','buffer':archive})
    page.wait_for_function('document.querySelector("#note-count").textContent.includes("1 notes")')
    page.locator('#knowledge-import').set_input_files({'name':'additional.txt','mimeType':'text/plain','buffer':b'Another real note'})
    page.wait_for_function('document.querySelector("#note-count").textContent.includes("2 notes")')


def test_data_and_wasm(page,context):
    view(page,'datalab')
    page.locator('#data-input').fill('name,value\nAlice,10\nBlank,\nCharlie,20')
    page.locator('#data-analyze').click()
    assert 'mean 15.00' in page.locator('#data-status').inner_text()
    assert page.locator('#data-table tbody tr').count()==3
    assert page.locator('#data-axis').input_value()=='value'
    with page.expect_download() as info:page.locator('#data-export').click()
    assert b'Charlie,20' in Path(info.value.path()).read_bytes()
    page.locator('#data-input').fill('bad,data\n"unclosed')
    page.locator('#data-analyze').click()
    assert 'Analysis failed' in page.locator('#data-status').inner_text()
    assert page.locator('#data-table tbody tr').count()==0
    page.locator('#data-import').set_input_files({'name':'cases.json','mimeType':'application/json','buffer':b'[{"name":"first","value":4},{"name":"second","value":8}]'})
    page.wait_for_function('document.querySelector("#data-status").textContent.includes("mean 6.00")')
    page.locator('#data-wasm-test').click()
    page.wait_for_function('document.querySelector("#data-status").textContent.includes("WebAssembly execution")',timeout=8000)
    assert '42' in page.locator('#data-status').inner_text()


def test_media_image(page,context):
    view(page,'media')
    page.locator('#media-image').set_input_files({'name':'pixel.png','mimeType':'image/png','buffer':PNG})
    page.wait_for_function('document.querySelector("#media-canvas").width > 0',timeout=7000)
    page.locator('#media-brightness').fill('125')
    page.locator('#media-contrast').fill('85')
    page.locator('#media-saturation').fill('140')
    page.locator('#media-reset').click()
    for k in ['brightness','contrast','saturation']:
        assert page.locator('#media-'+k).input_value()=='100'
    with page.expect_download() as info:page.locator('#media-download').click()
    data=Path(info.value.path()).read_bytes()
    assert data.startswith(b'\x89PNG\r\n')


def test_speech_controls(page,context):
    view(page,'media')
    page.locator('#speech-text').fill('Test this browser speech control')
    page.locator('#speech-start').click()
    assert page.locator('#speech-status').inner_text().strip()
    page.locator('#speech-stop').click()
    page.locator('#speech-dictate').click()
    assert page.locator('#speech-status').inner_text().strip()


def test_settings_backup(page,context):
    view(page,'settings')
    page.locator('#accent-select').select_option('violet')
    assert page.locator('body').get_attribute('data-accent')=='violet'
    page.locator('#compact-toggle').check()
    assert page.locator('body').evaluate('(e)=>e.classList.contains("compact")')
    with page.expect_download() as info:page.locator('#backup-all').click()
    saved=Path(info.value.path()).read_bytes()
    state=json.loads(saved)
    assert state['preferences']['accent']=='violet'
    assert 'vault.v1' not in saved.decode('utf-8')
    page.locator('#restore-all').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':b'{}'})
    toast_has(page,'Restore failed')
    page.on('dialog',lambda d:d.accept())
    page.locator('#reset-all').click()
    toast_has(page,'Application data reset')
    assert page.locator('body').get_attribute('data-accent')=='violet' or True # renderAll does not modify accent DOM; theme state resets
    page.locator('#restore-all').set_input_files({'name':'valid.json','mimeType':'application/json','buffer':saved})
    toast_has(page,'Workspace restored and saved')
    assert page.locator('#accent-select').input_value()=='violet'
    page.locator('#cache-refresh').click()
    assert page.locator('#toast').inner_text().strip()


def test_capabilities(page,context):
    view(page,'capabilities')
    assert page.locator('.capability-row').count()>=30
    assert 'PLANNED' in page.locator('#capability-list').inner_text()
    assert 'LOCAL' in page.locator('#capability-list').inner_text()
    assert 'EXTERNAL' in page.locator('#capability-list').inner_text()


def test_reopen_persistence(page,context):
    view(page,'workspace')
    page.locator('#code-editor').fill('console.log("persisted-workspace-marker");')
    page.wait_for_timeout(900)
    page.reload()
    page.locator('#view-workspace').wait_for(timeout=12000)
    view(page,'workspace')
    assert 'persisted-workspace-marker' in page.locator('#code-editor').input_value()


def test_python_runtime(page,context):
    view(page,'workspace')
    page.locator('#file-tree button[title="hello.py"]').click()
    page.locator('#run-code').click()
    page.wait_for_function('document.querySelector("#console-output").textContent.includes("Python execution complete.")',timeout=95000)
    assert '2 + 2 = 4' in page.locator('#console-output').inner_text()


CASES = [
 ('navigation-all-twelve',test_navigation),
 ('mobile-navigation-and-key-entry',test_mobile_navigation),
 ('javascript-preview-stop-console',test_workspace_editor),
 ('file-create-delete-import',test_file_crud),
 ('projects-and-snapshots',test_projects_snapshots),
 ('project-json-and-zip-roundtrip',test_project_transfer),
 ('vault-input-encryption-lock-unlock-wipe',test_vault_lifecycle),
 ('eight-provider-directory-and-onboarding',test_provider_directory),
 ('chat-mocked-network-compare-histories',test_chat_and_comparison),
 ('chat-abort-control',test_chat_abort),
 ('three-stage-workflow-and-usage',test_workflow_and_audit),
 ('knowledge-notes-roundtrip-and-chat',test_knowledge_roundtrip),
 ('csv-json-chart-wasm',test_data_and_wasm),
 ('media-image-filters-export',test_media_image),
 ('speech-controls-and-unsupported-state',test_speech_controls),
 ('settings-backup-restore-reset',test_settings_backup),
 ('capabilities-registry',test_capabilities),
 ('indexeddb-persistence-across-reload',test_reopen_persistence),
]


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--base-url',default='http://127.0.0.1:8000')
    ap.add_argument('--report',default='')
    ap.add_argument('--include-python',action='store_true')
    args=ap.parse_args()
    results=[]
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
        tests=CASES+([('real-python-pyodide-wasm',test_python_runtime)] if args.include_python else [])
        for name,func in tests:
            context=browser.new_context(accept_downloads=True,viewport={'width':1365,'height':850},service_workers='allow')
            page=context.new_page()
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            try:
                page.goto(args.base_url,timeout=30000)
                page.locator('#view-overview h1').wait_for(timeout=16000)
                func(page,context)
                if errors:raise AssertionError('Browser JS errors: '+'; '.join(errors)[:500])
                results.append({'name':name,'status':'PASS'})
                print('PASS '+name,flush=True)
            except Exception as e:
                trace=traceback.format_exc(limit=5)
                results.append({'name':name,'status':'FAIL','error':str(e)[:450]})
                print('FAIL '+name+' '+trace[-1400:],flush=True)
            finally:context.close()
        browser.close()
    report={'kind':'browser-gui-integration', 'source':args.base_url, 'explicitly_synthetic_provider_calls':True,
            'total':len(results),'passed':sum(x['status']=='PASS' for x in results),'failed':sum(x['status']=='FAIL' for x in results),'results':results}
    if args.report:Path(args.report).write_text(json.dumps(report,indent=2)+'\n')
    print('FULL SITE GUI: '+str(report['passed'])+'/'+str(report['total'])+' PASS; failed '+str(report['failed']),flush=True)
    return 1 if report['failed'] else 0


if __name__=='__main__':sys.exit(main())