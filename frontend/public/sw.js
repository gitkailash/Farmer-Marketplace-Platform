/**
 * Service Worker for Translation Caching
 * Handles offline caching and cache management for translation files
 */

const CACHE_NAME = 'translation-cache-v1';
const TRANSLATION_CACHE_NAME = 'translations-v1';

// Translation file patterns to cache
const TRANSLATION_PATTERNS = [
  /\/locales\/[a-z]{2}\/[a-z]+\.json$/,
  /\/api\/translations\//,
  /\/i18n\//
];

// Install event - set up caches
self.addEventListener('install', (event) => {
  console.log('Translation service worker installing...');
  
  event.waitUntil(
    caches.open(TRANSLATION_CACHE_NAME).then((cache) => {
      console.log('Translation cache opened');
      return cache;
    })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Translation service worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old translation caches
          if (cacheName.startsWith('translations-') && cacheName !== TRANSLATION_CACHE_NAME) {
            console.log('Deleting old translation cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients immediately
  return self.clients.claim();
});

// Fetch event - handle translation requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip caching for admin translation management API calls
  if (url.pathname.includes('/api/translations/keys') || 
      url.pathname.includes('/api/translations/validate') ||
      url.pathname.includes('/admin/')) {
    // Let admin API calls go directly to network without caching
    return;
  }
  
  // TEMPORARILY DISABLE CACHING FOR TRANSLATION API DURING DEVELOPMENT
  if (url.pathname.includes('/api/translations')) {
    console.log('Bypassing cache for translation API call:', url.pathname);
    return; // Let it go directly to network
  }
  
  // Check if this is a translation request
  const isTranslationRequest = TRANSLATION_PATTERNS.some(pattern => 
    pattern.test(url.pathname)
  );
  
  if (isTranslationRequest) {
    event.respondWith(handleTranslationRequest(event.request));
  }
});

// Message event - handle cache management messages
self.addEventListener('message', (event) => {
  const { type, key, data } = event.data;
  
  switch (type) {
    case 'GET_TRANSLATION_CACHE':
      handleGetTranslationCache(event, key);
      break;
      
    case 'SET_TRANSLATION_CACHE':
      handleSetTranslationCache(event, key, data);
      break;
      
    case 'DELETE_TRANSLATION_CACHE':
      handleDeleteTranslationCache(event, key);
      break;
      
    case 'CLEAR_TRANSLATION_CACHE':
      handleClearTranslationCache(event);
      break;
      
    default:
      event.ports[0].postMessage({ error: 'Unknown message type' });
  }
});

/**
 * Handle translation requests with cache-first strategy
 */
async function handleTranslationRequest(request) {
  try {
    // Don't cache non-GET requests (POST, PUT, DELETE)
    if (request.method !== 'GET') {
      console.log('Non-GET request, bypassing cache:', request.method, request.url);
      return await fetch(request);
    }
    
    const cache = await caches.open(TRANSLATION_CACHE_NAME);
    
    // Try to get from cache first
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('Translation served from cache:', request.url);
      
      // Check if cached response is still fresh
      const cacheDate = new Date(cachedResponse.headers.get('date') || 0);
      const now = new Date();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (now - cacheDate < maxAge) {
        return cachedResponse;
      }
    }
    
    // Fetch from network
    console.log('Fetching translation from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.method === 'GET') {
      // Clone response for caching (only for GET requests)
      const responseToCache = networkResponse.clone();
      
      // Add timestamp header
      const headers = new Headers(responseToCache.headers);
      headers.set('date', new Date().toISOString());
      headers.set('sw-cached', 'true');
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      // Cache the response
      await cache.put(request, cachedResponse);
      console.log('Translation cached:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('Translation request error:', error);
    
    // For non-GET requests, just return the error
    if (request.method !== 'GET') {
      throw error;
    }
    
    // Try to serve from cache as fallback (only for GET requests)
    const cache = await caches.open(TRANSLATION_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('Serving stale translation from cache:', request.url);
      return cachedResponse;
    }
    
    // Return empty JSON as last resort
    return new Response('{}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle get translation cache message
 */
async function handleGetTranslationCache(event, key) {
  try {
    const cache = await caches.open(TRANSLATION_CACHE_NAME);
    const request = new Request(`/cache/${key}`);
    const response = await cache.match(request);
    
    if (response) {
      const data = await response.json();
      event.ports[0].postMessage({ data });
    } else {
      event.ports[0].postMessage({ data: null });
    }
    
  } catch (error) {
    event.ports[0].postMessage({ error: error.message });
  }
}

/**
 * Handle set translation cache message
 */
async function handleSetTranslationCache(event, key, data) {
  try {
    const cache = await caches.open(TRANSLATION_CACHE_NAME);
    const request = new Request(`/cache/${key}`);
    
    const response = new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'date': new Date().toISOString(),
        'sw-cached': 'true'
      }
    });
    
    await cache.put(request, response);
    event.ports[0].postMessage({ success: true });
    
  } catch (error) {
    event.ports[0].postMessage({ error: error.message });
  }
}

/**
 * Handle delete translation cache message
 */
async function handleDeleteTranslationCache(event, key) {
  try {
    const cache = await caches.open(TRANSLATION_CACHE_NAME);
    const request = new Request(`/cache/${key}`);
    
    const deleted = await cache.delete(request);
    event.ports[0].postMessage({ success: deleted });
    
  } catch (error) {
    event.ports[0].postMessage({ error: error.message });
  }
}

/**
 * Handle clear translation cache message
 */
async function handleClearTranslationCache(event) {
  try {
    const deleted = await caches.delete(TRANSLATION_CACHE_NAME);
    
    // Recreate empty cache
    await caches.open(TRANSLATION_CACHE_NAME);
    
    event.ports[0].postMessage({ success: deleted });
    
  } catch (error) {
    event.ports[0].postMessage({ error: error.message });
  }
}

/**
 * Background sync for translation updates
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'translation-update') {
    event.waitUntil(syncTranslations());
  }
});

/**
 * Sync translations in background
 */
async function syncTranslations() {
  try {
    console.log('Background sync: updating translations');
    
    // Get list of cached translation URLs
    const cache = await caches.open(TRANSLATION_CACHE_NAME);
    const requests = await cache.keys();
    
    // Update each cached translation
    for (const request of requests) {
      if (TRANSLATION_PATTERNS.some(pattern => pattern.test(request.url))) {
        try {
          const response = await fetch(request);
          if (response.ok) {
            await cache.put(request, response);
            console.log('Updated translation:', request.url);
          }
        } catch (error) {
          console.warn('Failed to update translation:', request.url, error);
        }
      }
    }
    
    // Notify clients about update
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'TRANSLATION_CACHE_UPDATE',
        timestamp: Date.now()
      });
    });
    
  } catch (error) {
    console.error('Translation sync error:', error);
  }
}