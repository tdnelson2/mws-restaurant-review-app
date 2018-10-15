/* global appName */

const cacheVersion = 1;

const staticCacheName = `${appName}-v${cacheVersion}`;
const contentImgCache = `images-${appName}-v${cacheVersion}`;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      return cache.addAll([
        '/',
        '/css/styles.css',
        '/index.html',
        '/restaurant.html',
        '/js/script-bundle.js',
        '/img/na.svg'
      ]).catch(error => {
        console.error('static cache failed to open: ', error);
      });
    })
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  const request = event.request;

  if (request.method === 'GET' && requestUrl.hostname !== 'timothynelson.me') {
    // Serve `restaurant.html` even when URL parameters are appended.
    if (requestUrl.origin === location.origin && requestUrl.pathname.startsWith('/restaurant.html')) {
      event.respondWith(caches.match('/restaurant.html'));
      return;
    }

    // Serve responsive photos from cache regardless of width.
    if (requestUrl.origin === location.origin && requestUrl.pathname.startsWith('/img/')) {
      event.respondWith(servePhoto(request));
      return;
    }

    // Respond with an entry from the cache if there is one.
    // If there isn't, fetch from the network, cache it and respond.
    event.respondWith(
      caches.match(request).then(response => {
        return (
          response || fetch(event.request).then(fetchResponse => {
            return caches.open(staticCacheName).then(cache => {
              if (requestUrl.hostname !== 'maps.googleapis.com') {
                cache.put(event.request, fetchResponse.clone());
              }
              return fetchResponse;
            });
          }).catch(() => {
            if (event.request.url.endsWith('.jpg')) return caches.match('/img/na.svg');
            return new Response('There is no internet', {
              statusText: 'It seems you aren\'t connected to the internet.',
              status: 404
            });
          })
        );
      })
    );
  }
});


const servePhoto = (request => {
  const storageUrl = request.url.replace(/-\d+w\.jpg$/, '');

  return caches.open(contentImgCache)
    .then(cache => {
      return cache.match(storageUrl)
        .then(response => {
          if (response) return response;

          return fetch(request)
            .then(networkResponse => {
              cache.put(storageUrl, networkResponse.clone());
              return networkResponse;
            });
        });
    });
});
