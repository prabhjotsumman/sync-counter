const CACHE_NAME = 'sync-counter-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/favicon.ico',
        '/sw.js',
        '/logo192.png',
        '/logo512.png',
        // Next.js static files (adjust as needed)
        '/_next/static/',
        // Add more static assets as needed
      ]);
    })
  );
});

// Fetch event - handle offline requests
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(event.request));
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return (
          response ||
          fetch(event.request).then((fetchRes) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, fetchRes.clone());
              return fetchRes;
            });
          }).catch(() => {
            // Optionally, return a fallback page/image if offline and not cached
          })
        );
      })
    );
  }
});

// Handle API requests with offline support
async function handleApiRequest(request) {
  try {
    // Try to make the network request first
    const response = await fetch(request);
    
    // If successful, cache the response
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // If offline, handle based on request method
    if (request.method === 'GET') {
      // For GET requests, return cached response if available
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    } else if (request.method === 'POST') {
      // For POST requests, return optimistic response
      // The actual sync will be handled by the main app logic
      return new Response(JSON.stringify({ 
        success: true, 
        offline: true,
        message: 'Request queued for sync when online'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Fallback to network error
    throw error;
  }
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
