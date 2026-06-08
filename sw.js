// 周易 · 学 — Service Worker
// 版本号更新会触发缓存刷新
const VERSION   = 'iching-v4';
const CACHE_KEY = VERSION;

// 需要缓存的文件（全部离线可用）
const ASSETS = [
  './',
  './index.html',
  './mobile.html',
  './manifest.json',
  './icon.svg',
  './sw.js'
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
  const request = event.request;

  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        // 只缓存成功的同源请求
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_KEY).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => {
        // 离线刷新首页、带 query 的入口，或从桌面图标打开时，都回到已缓存的主页面
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return caches.match(request.url.replace(/[?#].*$/, ''));
      });
    })
  );
});
