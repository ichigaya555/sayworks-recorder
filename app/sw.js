// キャッシュのバージョン名（中身を変えたら v2, v3… と増やす）
const CACHE_NAME = 'sayworks-recorder-v1';

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

// インストール時：ASSETS をまとめてキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 古いキャッシュを削除
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

// 通信時：キャッシュ優先（なければネット）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached; // キャッシュがあればそれを返す
      }
      // なければ普通にネットワークへ
      return fetch(event.request).catch(() => {
        // オフライン＆キャッシュなしのときのフォールバックを入れたければここに書く
      });
    })
  );
});
