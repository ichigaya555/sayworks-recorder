// キャッシュのバージョン名（中身を変えたら v2, v3… と増やす）
const CACHE_NAME = 'sayworks-recorder-v5';

// オフラインで使えるようにキャッシュするファイル一覧
// !!! 実際に存在するファイルだけを書くこと !!!
// （存在しないパスがあると install でコケます）
const ASSETS = [
  './',
  './index.html',
//  './index.js',
  './manifest.json',
  './images/jimny_DIA.jpg',
  './css/common.css',
  './css/style.css'
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