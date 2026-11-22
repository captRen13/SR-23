const CACHE_PREFIX='star-runner-';
const CACHE_VERSION='3.2.0';
const CACHE=CACHE_PREFIX+CACHE_VERSION;
const APP_SHELL=['./','./index.html','./manifest.json','./Core/SRGS-Core.js','./Core/SR-Data-Store.js?v=1.0.3','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>(key.startsWith(CACHE_PREFIX)||key.startsWith('sr23-chronometer-'))&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 const navigation=request.mode==='navigate'||(request.headers.get('accept')||'').includes('text/html');
 if(navigation){event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy))}return response}).catch(()=>caches.match('./index.html')));return}
 event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}return response})))
});
