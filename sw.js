// Bump version to force cache refresh after a deploy
const CACHE = 'innerjam-v1';

// Assets to pre-cache on install (guaranteed offline from first visit)
const PRECACHE = [
  '/index.html',
  '/about.html',
  '/manifest.json',
  '/icon.svg',
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  );
  self.skipWaiting(); // activate immediately, don't wait for old SW to die
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // take control of open tabs now
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Google Fonts (CSS + woff2 files): network-first, cache on success.
  // The CSS URL varies by user-agent so we don't precache it, but we do
  // cache whatever the browser actually fetches on first online visit.
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
        // If the font isn't cached yet (first offline visit) the app still
        // works because index.html has system-font fallbacks defined.
    );
    return;
  }

  // Everything else (local assets): cache-first, network fallback.
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // For page navigations fall back to the shell
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
