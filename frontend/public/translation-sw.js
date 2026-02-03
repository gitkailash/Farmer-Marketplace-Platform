/**
 * Translation Service Worker
 * Handles caching and offline support for translation assets
 */

const CACHE_NAME = 'farmer-marketplace-translations-v1';
const TRANSLATION_CACHE_NAME = 'translations-cache-v1';

// Translation file patterns to cache
const TRANSLATION_PATTERNS = [
  /\/cdn\/.*\/.*\.json$/,
  /\/translations\/.*\.json$/,
  /\/i18n\/.*\.json$/
];

// Cache duration for different types of files
const CACHE_STRATEGIES = {
  manifest: 5 * 60 * 1000, // 5 minutes
  translations: 24 * 60 * 60 * 1000, // 24 hours
  versioned: 365 * 24 * 60 * 60 * 1000 // 1 year for versioned files
};

self.addEventListener('install', (event) => {
  console.log('Translation Service Worker installing...');
  
  event.waitUntil(
    caches.open(TRANSLATION_CACHE_NAME).then((cache) => {
      console.log('Translation cache opened');
      return cache;
    })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Translation Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName.startsWith('translations-cache-') && cacheName !== TRANSLATION_CACHE_NAME) {
            console.log('Deleting old translation cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients immediately
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle translation-related requests
  if (!isTranslationRequest(url.pathname)) {
    return;
  }
  
  console.log('Handling translation request:', url.pathname);
  
  event.respondWith(
    handleTranslationRequest(event.request)
  );
});

/**
 * Check if request is for translation assets
 */
function isTranslationRequest(pathname) {
  return TRANSLATION_PATTERNS.some(pattern => pattern.test(pathname)) ||
         pathname.includes('manifest.json') ||
         pathname.includes('integrity.json');
}

/**
 * Handle translation requests with caching strategy
 */
async function handleTranslationRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Determine cache strategy based on file type
    let cacheStrategy = 'translations';
    
    if (pathname.includes('manifest.json')) {
      cacheStrategy = 'manifest';
    } else if (isVersionedFile(pathname)) {
      cacheStrategy = 'versioned';
    }
    
    // Try cache first for versioned files
    if (cacheStrategy === 'versioned') {
      const cachedResponse = await getCachedResponse(request);
      if (cachedResponse) {
        console.log('Serving versioned translation from cache:', pathname);
        return cachedResponse;
      }
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      await cacheResponse(request, networkResponse.clone(), cacheStrategy);
      console.log('Cached translation response:', pathname);
      return networkResponse;
    } else {
      // Try to serve from cache if network fails
      const cachedResponse = await getCachedResponse(request);
      if (cachedResponse) {
        console.log('Serving translation from cache (network failed):', pathname);
        return cachedResponse;
      }
      
      throw new Error(`Network request failed: ${networkResponse.status}`);
    }
  } catch (error) {
    console.error('Translation request failed:', error);
    
    // Try to serve from cache as last resort
    const cachedResponse = await getCachedResponse(request);
    if (cachedResponse) {
      console.log('Serving translation from cache (fallback):', pathname);
      return cachedResponse;
    }
    
    // Return empty translation object as ultimate fallback
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Fallback': 'true'
      }
    });
  }
}

/**
 * Check if file is versioned (contains hash)
 */
function isVersionedFile(pathname) {
  // Check for hash pattern in filename (e.g., common.abc12345.json)
  return /\.[a-f0-9]{8}\.json$/.test(pathname);
}

/**
 * Get cached response
 */
async function getCachedResponse(request) {
  const cache = await caches.open(TRANSLATION_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check if cache is still valid
    const cacheTime = cachedResponse.headers.get('X-Cache-Time');
    if (cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      const maxAge = getCacheMaxAge(request.url);
      
      if (age < maxAge) {
        return cachedResponse;
      } else {
        // Cache expired, remove it
        await cache.delete(request);
        return null;
      }
    }
    
    return cachedResponse;
  }
  
  return null;
}

/**
 * Cache response with appropriate headers
 */
async function cacheResponse(request, response, strategy) {
  const cache = await caches.open(TRANSLATION_CACHE_NAME);
  
  // Add cache timestamp header
  const responseWithHeaders = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'X-Cache-Time': Date.now().toString(),
      'X-Cache-Strategy': strategy
    }
  });
  
  await cache.put(request, responseWithHeaders);
}

/**
 * Get cache max age based on strategy
 */
function getCacheMaxAge(url) {
  if (url.includes('manifest.json')) {
    return CACHE_STRATEGIES.manifest;
  } else if (isVersionedFile(new URL(url).pathname)) {
    return CACHE_STRATEGIES.versioned;
  } else {
    return CACHE_STRATEGIES.translations;
  }
}

/**
 * Handle messages from main thread
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CLEAR_TRANSLATION_CACHE':
      clearTranslationCache().then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch((error) => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
      break;
      
    case 'GET_CACHE_INFO':
      getCacheInfo().then((info) => {
        event.ports[0].postMessage({ success: true, data: info });
      }).catch((error) => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
      break;
      
    case 'PRELOAD_TRANSLATIONS':
      preloadTranslations(data.urls).then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch((error) => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
      break;
  }
});

/**
 * Clear translation cache
 */
async function clearTranslationCache() {
  const cache = await caches.open(TRANSLATION_CACHE_NAME);
  const keys = await cache.keys();
  
  await Promise.all(keys.map(key => cache.delete(key)));
  console.log('Translation cache cleared');
}

/**
 * Get cache information
 */
async function getCacheInfo() {
  const cache = await caches.open(TRANSLATION_CACHE_NAME);
  const keys = await cache.keys();
  
  const info = {
    cacheSize: keys.length,
    entries: []
  };
  
  for (const key of keys) {
    const response = await cache.match(key);
    const cacheTime = response.headers.get('X-Cache-Time');
    const strategy = response.headers.get('X-Cache-Strategy');
    
    info.entries.push({
      url: key.url,
      cacheTime: cacheTime ? new Date(parseInt(cacheTime)).toISOString() : null,
      strategy: strategy || 'unknown',
      size: response.headers.get('Content-Length') || 'unknown'
    });
  }
  
  return info;
}

/**
 * Preload translations
 */
async function preloadTranslations(urls) {
  const cache = await caches.open(TRANSLATION_CACHE_NAME);
  
  const promises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response.clone());
        console.log('Preloaded translation:', url);
      }
    } catch (error) {
      console.warn('Failed to preload translation:', url, error);
    }
  });
  
  await Promise.allSettled(promises);
}