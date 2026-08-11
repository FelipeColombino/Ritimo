/* Service worker do Ritmo.
   Objetivo duplo: tornar o app instalável e fazê-lo abrir sem rede.

   A estratégia é deliberadamente assimétrica:
   - o DOCUMENTO vai por rede primeiro, com o cache como reserva. Cache-first no HTML
     é o que deixa PWA preso numa versão antiga indefinidamente; por um arquivo de ~56 KB
     não compensa correr esse risco.
   - os ASSETS (ícones, manifest) vão por cache primeiro, porque são imutáveis. */

const CACHE = "ritmo-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

self.addEventListener("install", ev => {
  ev.waitUntil(
    caches.open(CACHE)
      // um asset ausente não pode abortar a instalação inteira
      .then(c => Promise.allSettled(ASSETS.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", ev => {
  ev.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", ev => {
  const req = ev.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // nada de terceiros para interceptar

  // Documento: rede primeiro, cache como reserva quando offline.
  if (req.mode === "navigate") {
    ev.respondWith(
      fetch(req)
        .then(res => {
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put("./index.html", copia));
          return res;
        })
        .catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  // Demais recursos do próprio app: cache primeiro.
  ev.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.status === 200 && res.type === "basic") {
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put(req, copia));
      }
      return res;
    }))
  );
});
