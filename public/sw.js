const DB_NAME = 'next-sw-auth-db';
const STORE_NAME = 'auth-store';
const DB_VERSION = 1;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

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
      } catch {
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

function shouldAttachAuthHeader(request, url) {
  if (url.origin !== self.location.origin) {
    return false;
  }

  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.includes('/webpack-hmr') ||
    url.pathname.includes('.')
  ) {
    return false;
  }

  const isDocumentNavigation = request.mode === 'navigate';
  const isApiRequest = url.pathname.startsWith('/api/');
  const isRscRequest = request.headers.has('RSC') || url.searchParams.has('_rsc');

  return isDocumentNavigation || isApiRequest || isRscRequest;
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (!shouldAttachAuthHeader(event.request, url)) {
    return;
  }

  event.respondWith(
    (async () => {
      const token = await getTokenFromIndexedDB();
      const headers = new Headers(event.request.headers);

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const requestInit = { headers };
      if (event.request.mode === 'navigate') {
        requestInit.mode = 'same-origin';
      }

      try {
        const requestWithAuth = new Request(event.request, requestInit);
        return fetch(requestWithAuth);
      } catch (error) {
        console.error('[SW] Fetch proxy failed, falling back to original request:', error);
        return fetch(event.request);
      }
    })()
  );
});
