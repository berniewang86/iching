// 周易 · 学 — Service Worker
// 版本号更新会触发缓存刷新
const VERSION   = 'iching-v1';
const CACHE_KEY = VERSION;

// 需要缓存的文件（全部离线可用）
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// ── 安装：预缓存所有文件 ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_KEY)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── 激活：清除旧版本缓存 ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_KEY).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── 请求拦截：缓存优先，缓存没有再联网 ──
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // 只缓存成功的同源请求
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_KEY).then(cache => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
