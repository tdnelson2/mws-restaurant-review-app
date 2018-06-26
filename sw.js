
const cacheVersion = 1;

const appName = 'restaurant-review';
const staticCacheName = `${appName}-v${cacheVersion}`;

self.addEventListener('install', event => {
  console.log('install event intercepted');
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/restaurant.html',
        '/css/styles.css',
        '/data/restaurants.json',
        '/js/',
        '/js/custom-select.js',
        '/js/dbhelper.js',
        '/js/main.js',
        '/js/picture-el-builder.js',
        '/js/restaurant_info.js',
        '/js/scroll-button.js',
        '/js/sw-reg.js',
        '/img/na.svg'
      ]).catch(error => {
        console.log('static cache failed to open: ', error);
      })
    })
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  const request = event.request;

  // Serve `restaurant.html` even when URL parameters are appended.
  if (requestUrl.origin === location.origin && requestUrl.pathname.startsWith('/restaurant.html')) {
    event.respondWith(caches.match('restaurant.html'));
    return;
  }

  // Respond with an entry from the cache if there is one.
  // If there isn't, fetch from the newtork.
  event.respondWith(
    caches.match(request).then(response => {
      return (
        response || fetch(event.request).then(fetchResponse => {
          return caches.open(staticCacheName).then(cache => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        }).catch(error => {
          if (event.request.url.endsWith('.jpg')) return caches.match('/img/na.svg');
          return new Response('There is no internet', {
            statusText: "It seems you aren't connected to the internet.",
            status: 404
          });
        })
      );
    })
  );
});
