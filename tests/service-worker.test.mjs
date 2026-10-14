import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const base='https://example.github.io/multi-model-ai-platform/';
function harness({online=true,refreshFails=false,existingCaches=[]}={}){
  const callbacks={},items=new Map(),deleted=[];
  const cache={addAll:async()=>{if(refreshFails)throw Error('cache update blocked');},put:async(request,response)=>{items.set(request.url,response);},match:async request=>items.get(request.url)||null};
  const caches={open:async()=>cache,keys:async()=>existingCaches,delete:async name=>{deleted.push(name);return true;},match:async request=>items.get(request.url)||null};
  const self={location:{origin:new URL(base).origin},registration:{scope:base},clients:{claim:async()=>{}},skipWaiting:async()=>{},addEventListener:(kind,cb)=>callbacks[kind]=cb};
  const net={online:true};net.online=online;
  const fetch=async()=>{if(!net.online)throw Error('offline');return new Response('new version',{status:200});};
  vm.runInNewContext(source,{self,caches,fetch,URL,Request});
  const navigate=async url=>{let result=null;const request=new Request(url);callbacks.fetch({request,respondWith:promise=>{result=promise;}});return result===null?null:await result;};
  const refresh=async()=>{let completion,reply;callbacks.message({data:{type:'REFRESH'},ports:[{postMessage:message=>{reply=message;}}],waitUntil:promise=>{completion=promise;}});await completion;return reply;};const activate=async()=>{let task;callbacks.activate({waitUntil:promise=>{task=promise;}});await task;};return {navigate,net,items,refresh,activate,deleted};
}

test('service worker prefers new code from network over an older cached shell',async()=>{
  const h=harness();const url=base+'src/main.js';h.items.set(url,new Response('old version'));
  const live=await h.navigate(url);assert.equal(await live.text(),'new version');
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(await h.items.get(url).text(),'new version');
});

test('service worker falls back to cached shell if offline',async()=>{
  const h=harness({online:false});const url=base+'index.html';h.items.set(url,new Response('cached page'));
  assert.equal(await (await h.navigate(url)).text(),'cached page');
});

test('service worker refuses cross-origin and out-of-scope interception',async()=>{
  const h=harness();assert.equal(await h.navigate('https://api.groq.com/chat'),null);
  assert.equal(await h.navigate('https://example.github.io/another-site/index.html'),null);
  assert.equal(await h.navigate(base+'sw.js'),null);
});

test('D16: offline refresh acknowledges completed shell update',async()=>{
 const h=harness();const reply=await h.refresh();assert.equal(reply.ok,true);
});
test('D16: offline refresh reports cache update failure',async()=>{
 const h=harness({refreshFails:true});const reply=await h.refresh();
 assert.equal(reply.ok,false);assert.match(reply.error,/cache update blocked/);
});

test('P31: activation removes this app obsolete cache but preserves other sites',async()=>{
 const h=harness({existingCaches:['other-app-assets','mm-studio-shell-b03-3','mm-studio-shell-b03-4','mm-studio-shell-b03-5','mm-studio-shell-b03-6','mm-studio-shell-b03-7','mm-studio-shell-b03-8','mm-studio-shell-b03-9','mm-studio-shell-b03-10','mm-studio-shell-b03-11','mm-studio-shell-b03-12','mm-studio-shell-b03-13','mm-studio-shell-b03-14','mm-studio-shell-b03-15']});
 await h.activate();
 assert.deepEqual(h.deleted,['mm-studio-shell-b03-3','mm-studio-shell-b03-4','mm-studio-shell-b03-5','mm-studio-shell-b03-6','mm-studio-shell-b03-7','mm-studio-shell-b03-8','mm-studio-shell-b03-9','mm-studio-shell-b03-10','mm-studio-shell-b03-11','mm-studio-shell-b03-12','mm-studio-shell-b03-13','mm-studio-shell-b03-14','mm-studio-shell-b03-15']);
});

test('Q03: offline shell includes every direct static module import from main',()=>{
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  const shellMatch=source.match(/const SHELL=\[([^\]]+)\];/);
  assert.ok(shellMatch,'service worker must declare a shell asset list');
  const shell=new Set([...shellMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map(match=>match[1]));
  const dependencies=[...main.matchAll(/\bfrom\s+['"]\.\/([^'"]+)['"]/g)].map(match=>'./src/'+match[1]);
  assert.ok(dependencies.includes('./src/labs.js'),'Labs is a required static module');
  for(const asset of dependencies)assert.ok(shell.has(asset),'Offline shell is missing '+asset);
});
