// sw.js (Service Worker for Offline Caching)
const CACHE_NAME = "simply-workout-v1";
const ASSETS = [
  "index.html",
  "index.css",
  "src/main-v2.js",
  "manifest.json",
  "icon.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
