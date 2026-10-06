const C='mi-dinero-v15';
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(['./','./index.html','./styles.css','./app.js','./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png']))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(x=>{const c=x.clone();caches.open(C).then(k=>k.put(e.request,c));return x}).catch(()=>caches.match('./index.html'))));
