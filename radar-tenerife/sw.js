const C='radar-v6';
self.addEventListener('install',e=>{ self.skipWaiting(); e.waitUntil(caches.open(C).then(c=>c.addAll(['./','manifest.json','icon-192.png']))); });
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{ const u=new URL(e.request.url); if(e.request.method!=='GET') return;
  if(u.origin===location.origin){ e.respondWith(fetch(e.request).then(r=>{ const cp=r.clone(); caches.open(C).then(c=>c.put(e.request,cp)); return r; }).catch(()=>caches.match(e.request))); }
  else if(/tile\.openstreetmap|cdn\.jsdelivr|fonts\.(googleapis|gstatic)/.test(u.host)){ e.respondWith(caches.match(e.request).then(m=>m||fetch(e.request).then(r=>{ const cp=r.clone(); caches.open(C).then(c=>c.put(e.request,cp)); return r; }))); }
});