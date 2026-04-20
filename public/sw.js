const CACHE_NAME = "tracker-cache-v3";
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

  // ✅ Fix 1: Skip non-GET requests (POST, PUT, DELETE etc.)
  // Cache API only supports GET — this was causing the TypeError
  if (req.method !== "GET") return;

  // ✅ Fix 2: Skip chrome-extension:// and non-http(s) URLs
  // These cannot be cached and were causing the Request scheme error
  if (!req.url.startsWith("http")) return;

  // ✅ Fix 3: Skip cross-origin requests (e.g. Firebase, Google APIs)
  // Caching these can cause stale cloud / COOP issues
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 🔥 Strategy: Network First (for dynamic content)
  event.respondWith(
    fetch(req)
      .then((res) => {
        // Only cache valid responses
        if (!res || res.status !== 200 || res.type !== "basic") {
          return res;
        }
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