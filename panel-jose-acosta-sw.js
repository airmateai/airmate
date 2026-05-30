// Service Worker — Panel Jose Acosta
const CACHE='ja-panel-v4';
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  // Network-first para HTML (siempre fresh)
  if(e.request.mode==='navigate'||(url.pathname.endsWith('.html'))){
    e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
    return;
  }
  // Cache-first para assets estáticos (fotos, fonts)
  if(url.hostname.includes('supabase.co')||url.hostname.includes('fonts.g')||url.hostname.includes('jsdelivr')){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
      const clone=resp.clone();
      caches.open(CACHE).then(c=>c.put(e.request,clone));
      return resp;
    })));
  }
});
