// KILL-SWITCH SW — limpia caches y se desregistra solo
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      const regs = await self.registration.unregister();
    } catch (err) {}
    const clients = await self.clients.matchAll();
    clients.forEach(c => c.navigate(c.url));
  })());
});
self.addEventListener('fetch', e => {
  // Pass-through directo a red — sin cache
});
