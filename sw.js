const CACHE_NAME = 'fb2-reader-v0.0.8';

const urlsToCache = [
    './',
    'index.html',
    'favicon.ico',
    'fb2-html.xsl',
    'main.css',
    'js/book-position.js',
    'js/main.js',
    'js/process-fb2.js',
    'js/thirdparty/idb-keyval.js',
    'js/thirdparty/unzipit.module.js',
    'js/thirdparty/unzipit-worker.module.js',
    'js/components/index.js',
    'js/components/battery-indicator.js',
    'js/components/clock-indicator.js',
    'js/components/theme-selector.js',
    'js/components/font-selector.js',
];

// Install a service worker
self.addEventListener('install', event => event.waitUntil(
    (async () => {
        // Perform install steps
        const cache = await caches.open(CACHE_NAME);
        await Promise.all(urlsToCache.map(url=> cache.add(url)));
    })()
));

// Cache lookup and fetch the request
self.addEventListener('fetch', (event) => event.respondWith(
    (async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        const response = await fetch(event.request);
        if (
            !response ||
            !response.ok ||
            response.type !== "basic" ||
            !event.request.url.startsWith('http')
        ) return response;

        const responseForCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseForCache));

        return response;
    })()
));

// Update a service worker
self.addEventListener('activate', event => event.waitUntil(
    (async () => {
        const cacheKeys = await caches.keys();
        const filteredKeys = cacheKeys.filter(cacheName => cacheName !== CACHE_NAME);
        await Promise.all(filteredKeys.map(cacheName => caches.delete(cacheName)));
    })()
));
