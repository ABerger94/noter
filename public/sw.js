// Minimal service worker so the app qualifies as an installable PWA.
// Deliberately does not cache anything: all content here is private/
// authenticated and changes frequently, so a plain network pass-through
// avoids ever serving stale or cross-session data.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
