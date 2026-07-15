const CACHE = "say-see-pictures-v2";
const PICTURES = [
  "/", "/manifest.webmanifest", "/pictures/rabbit.webp", "/pictures/lion.webp",
  "/pictures/elephant.webp", "/pictures/butterfly.webp", "/pictures/apple.webp",
  "/pictures/rainbow.webp", "/pictures/train.webp", "/pictures/flower.webp"
];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PICTURES))));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(saved => saved || fetch(event.request).then(response => {
    const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return response;
  })));
});
