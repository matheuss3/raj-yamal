// Service worker mínimo, só pra habilitar o prompt de instalação (PWA) no Chrome/Android —
// que exige um SW registrado com um handler de "fetch" pra considerar o site instalável.
// Não faz cache de nada: toda requisição vai direto pra rede, sem suporte offline.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
