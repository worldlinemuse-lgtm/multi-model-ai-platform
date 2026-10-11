// Network-first for live source changes; cached application shell supports offline use.
// The cache is scoped to this project site, not other sites on the same github.io origin.
const CACHE='mm-studio-shell-b03-2';
const SHELL=['./','./index.html','./styles.css','./favicon.svg','./provider-guides.js','./src/main.js','./src/core.js','./src/storage.js','./src/vault.js','./src/provider-api.js','./src/sandbox.js','./src/zip.js','./src/labs.js'];
const inScope=request=>{const u=new URL(request.url);return request.method==='GET' && u.origin===self.location.origin && u.pathname.startsWith(new URL(self.registration.scope).pathname) && !u.pathname.endsWith('/sw.js');};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(!inScope(event.request))return;event.respondWith((async()=>{try{const response=await fetch(event.request);if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});}return response;}catch(error){const cached=await caches.match(event.request);if(cached)return cached;throw error;}})());});
self.addEventListener('message',event=>{if(event.data?.type==='REFRESH')event.waitUntil(caches.delete(CACHE).then(()=>caches.open(CACHE)).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));});
