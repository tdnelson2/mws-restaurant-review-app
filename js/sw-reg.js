if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('/sw.js').then(reg => {
		console.log('service worker registered successfully');
	}).catch( err => {
		console.log('service worker registration FAILED');
	});
}