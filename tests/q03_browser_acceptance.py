"""Chromium acceptance for isolated Q03 module execution; no network dependency."""
import pathlib
import os
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
with sync_playwright() as p:
        browser_path=os.environ.get('CHROMIUM_EXECUTABLE') or ('/usr/bin/chromium' if pathlib.Path('/usr/bin/chromium').exists() else None)
        browser=p.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':browser_path} if browser_path else {}))
        page=browser.new_page()
        page.set_content('<!doctype html><meta charset=\"utf-8\"><body></body>')
        scripts=[]
        for name,path,return_names in [('graph','src/module-graph.js','compileModuleGraph'),('linker','src/module-linker.js','linkModuleGraph,rewrite,linkerWorkerSource'),('runtime','src/module-runtime.js','moduleRunnerDocument,shouldRunAsModule')]:
            source=(ROOT/path).read_text()
            source=source.replace("import {compileModuleGraph} from './module-graph.js';",'').replace("import {linkerWorkerSource} from './module-linker.js';",'').replace('export function ','function ')
            bindings=('const {compileModuleGraph}=graph;const {linkerWorkerSource}=linker;' if name=='runtime' else '')
            scripts.append('const '+name+'=(()=>{'+bindings+'\n'+source+'\nreturn {'+return_names+'};})();')
        scripts.append('const {moduleRunnerDocument}=runtime;')
        scripts.append("window.q03Ready=true;window.startQ03=(files,entry)=>{window.q03Messages=[];window.q03Frame?.remove();const frame=document.createElement('iframe');frame.setAttribute('sandbox','allow-scripts');frame.hidden=true;const nonce='test-nonce-'+Date.now();frame.srcdoc=moduleRunnerDocument(files,entry,nonce);window.q03Frame=frame;window.q03Nonce=nonce;window.addEventListener('message',function listener(e){if(e.source!==frame.contentWindow||e.data?.nonce!==nonce||e.data?.channel!=='mm-sandbox-b03')return;window.q03Messages.push(e.data);if(['done','error'].includes(e.data.type))window.removeEventListener('message',listener);});document.body.appendChild(frame);};")
        page.add_script_tag(content='\n'.join(scripts))
        page.wait_for_function('window.q03Ready === true')
        def execute(files,entry,timeout=10000):
            page.evaluate('''({files,entry})=>window.startQ03(files,entry)''',{'files':files,'entry':entry})
            page.wait_for_function('window.q03Messages.some(x=>x.type==="done"||x.type==="error")',timeout=timeout)
            return page.evaluate('window.q03Messages')
        r=execute({'main.mjs':'import {value} from "./lib.js";\nconsole.log("ANSWER",value)','lib.js':'export const value=42;'},'main.mjs')
        print('MULTI MODULE',r)
        assert any(x['type']=='log' and 'ANSWER 42' in x['message'] for x in r),r
        assert r[-1]['type']=='done',r
        r=execute({'main.mjs':'import {value} from "./lib.js";\nconsole.log(value)','lib.js':'export const value=17;'},'main.mjs')
        assert any(x['type']=='log' and '17' in x['message'] for x in r),r
        r=execute({'main.mjs':'console.log("GLOBAL",typeof parent,typeof document);'},'main.mjs')
        print('OPAQUE',r)
        assert r[-1]['type']=='done',r
        r=execute({'main.mjs':'try{await fetch("https://example.com/")}catch(e){console.log("NETWORK BLOCKED",e.name)}'},'main.mjs')
        print('CSP',r)
        assert any(x['type']=='log' and 'NETWORK BLOCKED' in x['message'] for x in r),r
        r=execute({'main.mjs':'export {value} from "./values.js";\nimport {value} from "./values.js";\nconsole.log("REEXPORT",value)','values.js':'export const value=88;'},'main.mjs')
        print('REEXPORT',r)
        assert any(x['type']=='log' and 'REEXPORT 88' in x['message'] for x in r),r
        page.evaluate('window.startQ03({"main.mjs":"while(true){}"},"main.mjs")')
        page.wait_for_timeout(200)
        page.evaluate('window.q03Frame.contentWindow.postMessage({channel:"mm-stop-b03",nonce:window.q03Nonce},"*")')
        page.wait_for_function('window.q03Messages.some(x=>x.type==="stopped")',timeout=3000)
        print('STOP',page.evaluate('window.q03Messages'))
        browser.close()
print('Q03 CHROMIUM ACCEPTANCE PASSED')