import test from 'node:test';
import assert from 'node:assert/strict';
import {compileModuleGraph} from '../src/module-graph.js';
import {linkModuleGraph} from '../src/module-linker.js';
const dataURL=source=>'data:text/javascript;charset=utf-8,'+encodeURIComponent(source);

test('Q03 stage2: actual three-file module graph evaluates via Node ESM data URLs',async()=>{
 const files={'main.js':"import {value} from './util.js';\nexport const result=value+1;",'util.js':"import {n} from './shared/number.mjs';\nexport const value=n;",'shared/number.mjs':'export const n=41;'};
 const graph=compileModuleGraph(files,'main.js');
 const links=linkModuleGraph(graph,dataURL);
 const module=await import(links.entryUrl);
 assert.equal(module.result,42);
 links.revoke();links.revoke();
});
test('Q03 stage2: side-effect import and re-export evaluate without external fetching',async()=>{
 const files={'main.js':"import './setup.js';\nexport {answer} from './value.js';",'setup.js':'globalThis.__q03_marker=1;', 'value.js':'export const answer=42;'};
 const links=linkModuleGraph(compileModuleGraph(files,'main.js'),dataURL);
 try{const mod=await import(links.entryUrl);assert.equal(mod.answer,42);assert.equal(globalThis.__q03_marker,1);}finally{delete globalThis.__q03_marker;links.revoke();}
});
test('Q03 stage2: URL allocation cleanup after failure',()=>{
 const graph=compileModuleGraph({'main.js':"import './util.js'",'util.js':'export const n=2;'},'main.js');
 const revoked=[];let count=0;
 assert.throws(()=>linkModuleGraph(graph,()=>{if(++count===2)throw Error('out of memory');return 'blob:generated-'+count},x=>revoked.push(x)),/out of memory/);
 assert.deepEqual(revoked,['blob:generated-1']);
});
test('Q03 stage2: module declarations must not hide in other statements',()=>{
 const files={'main.js':"const x=1; export {foo} from 'https://evil.invalid/code.js';"};
 assert.throws(()=>compileModuleGraph(files,'main.js'),/Put re-exports on their own lines/);
});
test('Q03 stage2: rejects untrusted URL factory output',()=>{
 const graph=compileModuleGraph({'main.js':'export const x=1'},'main.js');
 assert.throws(()=>linkModuleGraph(graph,()=>"https://remote.invalid/x.js"),/blob: or data:/);
});
test('Q03 stage2: URL revocation happens exactly once and after dependencies',()=>{
 const graph=compileModuleGraph({'main.js':"import './util.js'",'util.js':'export const n=2;'},'main.js');
 const revoked=[];const links=linkModuleGraph(graph,(src,path)=>'blob:'+path,x=>revoked.push(x));
 links.revoke();links.revoke();assert.deepEqual(revoked,['blob:main.js','blob:util.js']);
});
test('Q03 stage2: source project remains immutable',()=>{
 const files={'main.js':"import {x} from './util.js';\nexport const result=x;",'util.js':'export const x=2;'};
 const before=JSON.stringify(files);linkModuleGraph(compileModuleGraph(files,'main.js'),dataURL).revoke();assert.equal(JSON.stringify(files),before);
});