/* Service worker: app-skallen caches ved installation (virker offline). Fotos hentes fra netværket først og caches. */
const CACHE = 'guitar-begynder-v2';
const SHELL = ['./', 'index.html', 'manifest.json', 'css/style.css', 'js/lyd.js', 'js/akkorder-data.js', 'js/rejse-data.js', 'js/gribebraet.js', 'js/audio.js', 'js/app.js',
  'icons/icon.svg', 'icons/icon-192.png', 'img/guitar-dele.svg',
  'images/kilder.json', ...['C', 'D', 'Am'].flatMap(id => ['images/' + id + '/1.webp', 'images/' + id + '/captions.json']),
  ...['C','G','D','Em','Am','E','A','G4','Cadd9','C-mini','G-mini','Dsus2','Em7','Am7'].map(id => 'img/akkorder/' + id + '.svg')];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.includes('/images/')) {   // fotos: netværk først, så nye billeder dukker op
    e.respondWith(fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; }).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
