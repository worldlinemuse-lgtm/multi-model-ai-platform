const CACHE='mm-studio-shell-b03';
const SHELL=['./','./index.html','./styles.css','./favicon.svg','./provider-guides.js','./src/main.js','./src/core.js','./src/storage.js','./src/vault.js','./src/provider-api.js','./src/sandbox.js','./src/zip.js','./src/labs.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;if(u.pathname.includes('/api/')||u.pathname.endsWith('/sw.js'))return;e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return response})));});
self.addEventListener('message',e=>{if(e.data?.type==='REFRESH')e.waitUntil(caches.delete(CACHE).then(()=>caches.open(CACHE)).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
