(function () {
    'use strict';
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
            .catch(function (error) {
                console.warn('Service worker registration failed:', error);
            });
    });
})();
