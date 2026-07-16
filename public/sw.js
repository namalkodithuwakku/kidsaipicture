const CACHE = "say-see-pictures-v4";
const CORE = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/app-logo-3d.png",
  "/pictures/rabbit.webp",
  "/pictures/lion.webp",
  "/pictures/elephant.webp",
  "/pictures/apple.webp",
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then(saved => saved || caches.match("/"))),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(saved => saved || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
      return response;
    })),
  );
});
