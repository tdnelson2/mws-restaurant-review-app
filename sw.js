/* global MyIDB */

const cacheVersion = 1;

const appName = 'restaurant-review';
const staticCacheName = `${appName}-v${cacheVersion}`;

const myidb = new MyIDB(appName, appName, 1, 'id', 'createdAt', 20);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/restaurant.html',
        '/js/main-all.js',
        '/js/restaurant-all.js',
        '/js/sw-reg.js',
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

  if (request.method === 'GET') {
    // Serve `restaurant.html` even when URL parameters are appended.
    if (requestUrl.origin === location.origin && requestUrl.pathname.startsWith('/restaurant.html')) {
      event.respondWith(caches.match('/restaurant.html'));
      return;
    }

    // Store data from API (port 1337) in the IndexedDB.
    if (requestUrl.port === '1337') {
      const idbFetch = 
        requestUrl.pathname.endsWith('restaurants')
          ? myidb.getItems()
          : myidb.getItem(
            parseInt(requestUrl.pathname.split('/').pop())
          );

      // Respond with an entry from the IndexedDB if there is one.
      // If there isn't, fetch from the network, store it and respond.
      event.respondWith(
        idbFetch
          .then(result => {

            // Check if result is empty an array
            const data = 
              (typeof result[Symbol.iterator] === 'function' && result.length === 0)
                ? undefined
                : result;

            return (
              data ||
              fetch(event.request)
                .then(response => response.json())
                .then(responseData => {
                  myidb.update(responseData);
                  return responseData;
                })
            );
          })
          .then(outputData => {
            return new Response(JSON.stringify(outputData));
          })
          .catch(() => {
            return new Response('Error fetching data from the API', {
              statusText: 'Either the API isn\' available or there was an error retrieving from the IndexedDB.',
              status: 500
            });
          })
      );

    } else {

      // Respond with an entry from the cache if there is one.
      // If there isn't, fetch from the network, cache it and respond.
      event.respondWith(
        caches.match(request).then(response => {
          return (
            response || fetch(event.request).then(fetchResponse => {
              return caches.open(staticCacheName).then(cache => {
                cache.put(event.request, fetchResponse.clone());
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
  }
});
