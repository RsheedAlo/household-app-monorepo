// Service Worker der Household App (PWA-Basis).
//
// Was er tut: Die App-Hülle (HTML, Skripte, Styles, Schriften, Icons) wird zwischengespeichert,
// damit die App installierbar ist und auch ohne Netz startet.
// Was er bewusst NICHT tut: Anfragen an die API (anderer Ursprung) werden nie angefasst oder
// gespeichert. Haushaltsdaten bleiben so immer live und landen nicht im Cache.

const CACHE = "household-shell-v1";
const PRECACHE = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== "GET" || url.origin !== self.location.origin) {
        return;
    }

    // Seitenaufrufe: zuerst Netz, ohne Netz die gespeicherte App-Hülle (die App rendert dann selbst)
    if (request.mode === "navigate") {
        event.respondWith(fetch(request).catch(() => caches.match("/")));
        return;
    }

    // Dateien mit Hash im Namen (Vite) und Icons ändern sich nie: aus dem Cache, sonst holen und merken
    event.respondWith(
        caches.match(request).then(
            (cached) =>
                cached ||
                fetch(request).then((response) => {
                    if (response.ok && (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/"))) {
                        const copy = response.clone();
                        caches.open(CACHE).then((cache) => cache.put(request, copy));
                    }
                    return response;
                }),
        ),
    );
});
