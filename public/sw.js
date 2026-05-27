const DB_NAME = 'next-sw-auth-db';
const STORE_NAME = 'auth-store';
const DB_VERSION = 1;

// Service Worker install - immediate activation
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Service Worker activate - take control of all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Helper to retrieve token from IndexedDB
function getTokenFromIndexedDB() {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => resolve(null);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        resolve(null);
        return;
      }
      try {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const getRequest = store.get('accessToken');
        getRequest.onsuccess = () => resolve(getRequest.result || null);
        getRequest.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

// Intercept fetch requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only intercept same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip static assets, specific build bundles, and hot reloading websockets
  if (
    url.pathname.startsWith('/_next/static/') || 
    url.pathname.includes('.') || 
    url.pathname.includes('/webpack-hmr')
  ) {
    return;
  }

  // Intercept all other same-origin requests (HTML document navigate, API, and Next.js RSC fetches)
  event.respondWith(
    (async () => {
      const token = await getTokenFromIndexedDB();

      // Clone the headers and inject the authorization token if exists
      const headers = new Headers(event.request.headers);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      // Construct modified request options
      const requestInit = {
        method: event.request.method,
        headers: headers,
        credentials: event.request.credentials,
        mode: event.request.mode === 'navigate' ? 'same-origin' : event.request.mode,
      };

      // Navigate requests are GET, but APIs can be POST/PUT with body
      if (event.request.method !== 'GET' && event.request.method !== 'HEAD') {
        try {
          requestInit.body = await event.request.clone().blob();
        } catch (e) {
          console.error('[SW] Failed to clone request body:', e);
        }
      }

      try {
        // Send modified request with Authorization header
        const response = await fetch(event.request.url, requestInit);
        return response;
      } catch (error) {
        console.error('[SW] Fetch proxy failed, falling back to original request:', error);
        return fetch(event.request);
      }
    })()
  );
});
