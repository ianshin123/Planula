/* 플래너 서비스워커.
   HTML은 network-first → 배포 즉시 최신본이 보인다(캐시 갇힘 없음).
   정적 자산은 cache-first. */
const CACHE = 'planula-v68';
const ASSETS = [
  './', './index.html', './manifest.webmanifest?v=68', './icon-192.png?v=68', './icon-512.png?v=68',
  './assets/planner-mascot-idle.png?v=68', './assets/planner-mascot-loop.gif?v=68', './assets/planner-mascot-once.gif?v=68'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    e.respondWith(
      fetch(req).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
  } else {
    e.respondWith(
      caches.match(req).then((r) => r || fetch(req).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return res; }))
    );
  }
});
