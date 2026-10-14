import test from 'node:test';
import assert from 'node:assert/strict';
import {compileModuleGraph} from '../src/module-graph.js';

test('Q03: resolves nested local imports in dependency order without executing',()=>{
 const files={'main.js':"import {value} from './src/util.js';\nconsole.log(value)",'src/util.js':"import {n} from '../shared/number.mjs';\nexport const value=n+1;",'shared/number.mjs':'export const n=41;'};
 const original=JSON.stringify(files);
 const graph=compileModuleGraph(files,'main.js');
 assert.deepEqual(graph.modules.map(m=>m.path),['shared/number.mjs','src/util.js','main.js']);
 assert.deepEqual(graph.modules.at(-1).imports,[{specifier:'./src/util.js',path:'src/util.js'}]);
 assert.equal(JSON.stringify(files),original);
});
test('Q03: local side-effect import and re-export are included',()=>{
 const files={'main.js':"import './setup.js';\nexport {value} from './util.js';",'setup.js':'console.log(1)','util.js':'export const value=2;'};
 assert.deepEqual(compileModuleGraph(files,'main.js').modules.map(x=>x.path),['setup.js','util.js','main.js']);
});
test('Q03: external, bare, encoded, missing and traversal imports fail closed',()=>{
 for(const ref of ['https://example.com/code.js','some-package','../../secret.js','./%2e%2e/x.js','./missing.js','./a.js//','/absolute.js']){
  const files={'src/main.js':`import '${ref}';`};
  assert.throws(()=>compileModuleGraph(files,'src/main.js'),/Only literal relative|escapes virtual|Missing local|Unsafe import/);
 }
});
test('Q03: dynamic imports and unsupported syntax are explicitly rejected',()=>{
 assert.throws(()=>compileModuleGraph({'main.js':"import('./other.js')"},'main.js'),/Dynamic import/);
 assert.throws(()=>compileModuleGraph({'main.js':"import {a,\n b} from './other.js';"},'main.js'),/Unsupported static import/);
 assert.throws(()=>compileModuleGraph({'main.js':"import.meta.url"},'main.js'),/import.meta/);
});
test('Q03: cyclic dependencies rejected instead of building partial graph',()=>{
 const files={'main.js':"import './b.js'",'b.js':"import './main.js'"};
 assert.throws(()=>compileModuleGraph(files,'main.js'),/Circular static module/);
});
test('Q03: bounds on file count, individual content and total characters',()=>{
 assert.throws(()=>compileModuleGraph({'main.js':'x'.repeat(50001)},'main.js'),/character limit/);
 assert.throws(()=>compileModuleGraph({'main.js':'x','a.js':'y'},'main.js',{maxFiles:1}),/file-count limit/);
 assert.throws(()=>compileModuleGraph({'main.js':'x'.repeat(10),'a.js':'y'.repeat(10)},'main.js',{maxTotalChars:15}),/character limit/);
});
test('Q03: entrypoint must be existing JS and all project paths valid',()=>{
 assert.throws(()=>compileModuleGraph({'main.js':'x'},'index.html'),/entrypoint/);
 assert.throws(()=>compileModuleGraph({'../outside.js':'x','main.js':'x'},'main.js'),/Invalid virtual file/);
});

test('Q03: static-looking imports inside multiline comments are not dependencies',()=>{
 const files={'main.js':"/*\nimport './not-a-dependency.js';\n*/\nexport const answer=42;"};
 assert.deepEqual(compileModuleGraph(files,'main.js').modules.map(x=>x.path),['main.js']);
});

test('Q03: template literals are conservatively rejected until a full parser is available',()=>{
 assert.throws(()=>compileModuleGraph({'main.js':'const text = `import \'./hidden.js\'`'},'main.js'),/Template literals/);
});