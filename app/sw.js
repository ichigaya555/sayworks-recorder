const CACHE_NAME = 'sayworks-recorder-v4';

const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/common.css',
  '/css/style.css',
  '/images/jimny_DIA.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  // ★ POST / PUT / /api/... などは一切触らない（ブラウザに任せる）
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request).catch(() => {
        // ナビゲーション系だけ index.html にフォールバックしたければこんな感じでもOK
        // if (event.request.mode === 'navigate') {
        //   return caches.match('/index.html');
        // }
      });
    })
  );
});
