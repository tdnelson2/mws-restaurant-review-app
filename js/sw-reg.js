if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(() => {
    console.log('service worker registered successfully');
  }).catch( () => {
    console.log('service worker registration FAILED');
  });
}