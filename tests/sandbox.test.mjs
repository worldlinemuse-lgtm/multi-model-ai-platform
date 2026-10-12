import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {runnerDocument,previewDocument,previewReport} from '../src/sandbox.js';
test('JS document never grants same-origin, CSP blocks network',()=>{const src=runnerDocument('console.log("ok")','javascript','random-nonce');assert.match(src,/worker-src blob:/);assert.match(src,/connect-src 'none'/);assert.match(src,/mm-sandbox-b03/);assert.ok(!src.includes('allow-same-origin'));const script=src.match(/<script>([\s\S]+?)<\/script>/)?.[1];assert.ok(script);assert.doesNotThrow(()=>new vm.Script(script));});
test('JS runner serializes markup-breaking code safely',()=>{const src=runnerDocument('console.log("</script><script>bad</script>")','javascript','nonce');assert.equal((src.match(/<script>/g)||[]).length,1);assert.equal((src.match(/<\/script>/g)||[]).length,1);});
test('Python loads an isolated CDN WASM runtime on demand',()=>{const src=runnerDocument('print(42)','python','nonce');assert.match(src,/cdn.jsdelivr.net/);assert.match(src,/worker-src blob:/);assert.match(src,/Pyodide/);});
test('preview CSP blocks connect and no same origin',()=>{const html=previewDocument({'index.html':'<link rel="stylesheet" href="site.css"><h1>hi</h1><script src="main.js"></script>','site.css':'body{color:red}','main.js':'console.log("x")'},'index.html');assert.match(html,/connect-src 'none'/);assert.match(html,/<h1>hi<\/h1>/);assert.match(html,/body\{color:red\}/);assert.match(html,/console.log\("x"\)/);});

test('P04: linked virtual assets resolve relative to selected nested HTML; unused files are not injected',()=>{
 const files={
  'web/index.html':'<link href="./css/site.css?version=1" rel="stylesheet"><div id="result"></div><script src="./js/helper.js"></script><script src="../app.js"></script>',
  'web/css/site.css':'#result { color: red; }',
  'web/js/helper.js':'window.VERSION="FIRST";',
  'app.js':'document.querySelector("#result").textContent=window.VERSION;',
  'unused.css':'.wrong { color: orange }',
  'unused.js':'throw Error("unrelated JS must never run")'
 };
 const rendered=previewReport(files,'web/index.html');
 assert.deepEqual(rendered.warnings,[]);
 assert.ok(rendered.document.indexOf('window.VERSION=')<rendered.document.indexOf('document.querySelector'));
 assert.match(rendered.document,/data-local-href="web\/css\/site.css"/);
 assert.match(rendered.document,/data-local-src="app.js"/);
 assert.ok(!rendered.document.includes('unrelated JS must never run'));
 assert.ok(!rendered.document.includes('color: orange'));
});
test('P04: block external URLs, traversal, missing and unsupported module scripts',()=>{
 const files={'web/index.html':'<script src="https://example.org/attack.js"></script><script src="../../escape.js"></script><link rel="stylesheet" href="missing.css"><script type="module" src="./mod.js"></script><script src="./good.js"></script>',
  'web/good.js':'console.log("GOOD")','web/mod.js':'export const n=42;',
  'escape.js':'console.log("ESCAPED")'};
 const out=previewReport(files,'web/index.html');
 assert.equal(out.warnings.length,4);
 assert.match(out.document,/GOOD/);
 assert.ok(!out.document.includes('ESCAPED'));
 assert.ok(!out.document.includes('attack.js"'));
 assert.ok(!out.document.includes('export const n'));
 assert.match(out.warnings.join(' | '),/external reference blocked/);
 assert.match(out.warnings.join(' | '),/outside project root/);
 assert.match(out.warnings.join(' | '),/local asset not found/);
 assert.match(out.warnings.join(' | '),/module imports are not supported/);
});
test('P04: escape closing tags inside local scripts and CSS',()=>{
 const files={
  'index.html':'<link rel="stylesheet" href="style.css"><script src="app.js"></script>',
  'style.css':'/* </style> */ body{color:red}',
  'app.js':'console.log("</script><script>BAD</script>")'
 };
 const html=previewDocument(files,'index.html');
 assert.equal((html.match(/<\/script>/g)||[]).length,1,'script injection must not close the inline script');
 assert.equal((html.match(/<\/style>/g)||[]).length,1,'style injection must not close the inline style');
 assert.match(html,/script-src 'unsafe-inline'/);
 assert.match(html,/connect-src 'none'/);
});
