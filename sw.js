const CACHE = 'cleanease-v1';
const ASSETS = ['/', '/index.html', '/customer-login.html', '/dashboard.html', '/styles.css', '/dashboard.css', '/dashboard.js', '/customer-login.js', '/admin-login.js', '/manifest.json'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);
    if (url.pathname.startsWith('/api/')) {
        e.respondWith(fetch(e.request).catch(() => new Response(JSON.stringify({success:false,message:'Offline'}), {headers:{'Content-Type':'application/json'}})));
        return;
    }
    e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('/index.html'))));
});
