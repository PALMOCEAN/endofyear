/**
 * Service Worker Registration
 * 
 * Registers the service worker for offline support and caching
 * Optional - only use in production if offline support is needed
 */

(function() {
  'use strict';
  
  // Check if service workers are supported
  if ('serviceWorker' in navigator) {
    // Wait for page load to avoid impacting initial page performance
    window.addEventListener('load', function() {
      registerServiceWorker();
    });
  } else {
    console.log('[SW] Service Workers not supported in this browser');
  }
  
  function registerServiceWorker() {
    navigator.serviceWorker.register('/service-worker.js')
      .then(function(registration) {
        console.log('[SW] Service Worker registered successfully:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', function() {
          const newWorker = registration.installing;
          console.log('[SW] New Service Worker found, installing...');
          
          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, show update notification
              console.log('[SW] New version available! Refresh to update.');
              showUpdateNotification();
            }
          });
        });
        
        // Check for updates periodically
        setInterval(function() {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
      })
      .catch(function(error) {
        console.error('[SW] Service Worker registration failed:', error);
      });
  }
  
  function showUpdateNotification() {
    // Create a simple notification banner
    const banner = document.createElement('div');
    banner.id = 'sw-update-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #4ECDC4;
      color: white;
      padding: 16px;
      text-align: center;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    
    banner.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap;">
        <span>🎉 Доступна новая версия сайта!</span>
        <button onclick="window.location.reload()" style="
          background: white;
          color: #4ECDC4;
          border: none;
          padding: 8px 24px;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        ">Обновить</button>
        <button onclick="document.getElementById('sw-update-banner').remove()" style="
          background: transparent;
          color: white;
          border: 2px solid white;
          padding: 8px 24px;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        ">Позже</button>
      </div>
    `;
    
    document.body.insertBefore(banner, document.body.firstChild);
  }
  
  // Listen for controller change (new service worker activated)
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    console.log('[SW] Controller changed, reloading page...');
    window.location.reload();
  });
})();
