const CACHE_NAME = "tracker-cache-v2";
const STATIC_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/pwa-192.png",
  "/pwa-512.png"
];

/* ================= INSTALL ================= */
self.addEventListener("install", (event) => {
  console.log("✅ Service Worker Installing...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE);
    })
  );

  self.skipWaiting();
});

/* ================= ACTIVATE ================= */
self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker Activated");

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🧹 Removing old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

/* ================= FETCH ================= */
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // 🔥 Strategy: Network First (for dynamic content)
  event.respondWith(
    fetch(req)
      .then((res) => {
        // Cache new response
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, clone);
        });
        return res;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(req);
      })
  );
});