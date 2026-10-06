const V='mi-dinero-v4',A=['./','index.html','styles.css','app.js','manifest.json','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(A)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=V).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!='GET')return;
e.respondWith(caches.match(e.request).then(r=>{const n=fetch(e.request).then(x=>{const c=x.clone();caches.open(V).then(h=>h.put(e.request,c));return x}).catch(()=>r||caches.match('index.html'));return r||n}))});
