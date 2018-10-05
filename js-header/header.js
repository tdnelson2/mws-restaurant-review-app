/* eslint-disable */
// Load polyfills (if needed) and initialize the google maps callback.
// This gets prepended in the script bundle when gulp runs.
// Adapted from: https://philipwalton.com/articles/loading-polyfills-only-when-needed/

self.mapPromise;
self.idb;

var DOM_CONTENT_LOADED = false;
document.addEventListener('DOMContentLoaded', function () {
  DOM_CONTENT_LOADED = true;
});


function fetchGoogleMaps() {
  self.mapPromise = new Promise(function (resolve, reject) {
    window.initMap = () => resolve();
  });
  var gmaps = document.createElement('script');
  gmaps.setAttribute('src', 'https://maps.googleapis.com/maps/api/js?key=AIzaSyC4VQB1Ok9qXO6yhZ5RC6SRPdmMp24FkEY&v=3&libraries=places&callback=initMap');
  gmaps.setAttribute('async', '');
  gmaps.setAttribute('defer', '');
  document.head.appendChild(gmaps);
}


function loadScript(src, done) {
  console.log('loading polyfills');
  var js = document.createElement('script');
  js.src = src;
  js.onload = function() {
    done();
  };
  js.onerror = function() {
    done(new Error('Failed to load script ' + src));
  };
  document.head.appendChild(js);
}

function browserSupportsAllFeatures() {
  return window.Promise && window.fetch;
}

if (browserSupportsAllFeatures()) {
  // Browsers that support all features run `main()` immediately.
  main();
} else {
  // All other browsers loads polyfills and then run `main()`.
  loadScript('https://cdn.polyfill.io/v2/polyfill.min.js', main);
}


function main(err) {
// The rest of the script bundle starts after this point
// and will be contained within the `main` function.
// The closing curly brace will get injected at the end 
// of the script bundle.

fetchGoogleMaps();
const currentIndexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

if (currentIndexedDB) {
  window.indexedDB = currentIndexedDB;
// `idb` will get added here when gulp runs.
// Trailing curly braces will also get added after `idb`
// and at the end of the script bundle to close `main()`.
