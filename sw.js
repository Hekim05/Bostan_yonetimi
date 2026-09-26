const CACHE_NAME = 'kbys-v2';
const STATIC_ASSETS = [
  'index.html',
  'manifest.json'
];

// Kurulum: statik dosyaları önbellekle
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Aktivasyon: eski önbellekleri temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: önce ağ, başarısız olursa önbellekten sun
self.addEventListener('fetch', event => {
  // Firebase ve API isteklerini bypass et (her zaman ağdan)
  const url = event.request.url;
  if (
    url.includes('firebase') ||
    url.includes('googleapis') ||
    url.includes('open-meteo') ||
    url.includes('gstatic')
  ) {
    return; // Tarayıcı normal şekilde işlesin
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Başarılı yanıtı önbellekle
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Ağ yoksa önbellekten sun
        return caches.match(event.request);
      })
  );
});
