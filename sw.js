self.addEventListener("install", () => {
  console.log("Service Worker instalado");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activado");

  event.waitUntil(
    self.clients.claim()
  );
});