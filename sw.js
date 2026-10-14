// Network-first for live source changes; cached application shell supports offline use.
// The cache is scoped to this project site, not other sites on the same github.io origin.
const CACHE_PREFIX='mm-studio-shell-';
const CACHE='mm-studio-shell-b03-12';
const SHELL=['./','./index.html','./styles.css','./favicon.svg','./provider-guides.js','./src/main.js','./src/core.js','./src/storage.js','./src/vault.js','./src/provider-api.js','./src/sandbox.js','./src/zip.js','./src/labs.js','./src/data-tools.js','./src/project-files.js','./src/preview-assets.js','./src/module-graph.js','./src/module-linker.js','./src/module-runtime.js','./src/note-tools.js','./src/snapshot-diff.js','./src/capability-probes.js','./src/knowledge.js'];
const inScope=request=>{const u=new URL(request.url);return request.method==='GET' && u.origin===self.location.origin && u.pathname.startsWith(new URL(self.registration.scope).pathname) && !u.pathname.endsWith('/sw.js');};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(!inScope(event.request))return;event.respondWith((async()=>{try{const response=await fetch(event.request);if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});}return response;}catch(error){const cache=await caches.open(CACHE);const cached=await cache.match(event.request);if(cached)return cached;throw error;}})());});
self.addEventListener('message',event=>{
 if(event.data?.type!=='REFRESH')return;
 const port=event.ports?.[0];
 event.waitUntil((async()=>{
  try{
   const cache=await caches.open(CACHE);
   await cache.addAll(SHELL.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload'})));
   port?.postMessage({ok:true});
   await self.skipWaiting();
  }catch(error){port?.postMessage({ok:false,error:error?.message||String(error)});}
 })());
});
