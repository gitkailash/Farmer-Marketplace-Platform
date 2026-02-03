/**
 * Translation Cache Service
 * Handles browser caching, service worker caching, and cache invalidation for translation files
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  version: string;
  etag?: string;
}

interface CacheConfig {
  maxAge: number; // Cache duration in milliseconds
  version: string; // Current translation version
  enableServiceWorker: boolean;
  enableIndexedDB: boolean;
}

class TranslationCacheService {
  private memoryCache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private dbName = 'translation-cache';
  private dbVersion = 2; // Increment version to force database recreation
  private storeName = 'translations';
  private dbInitialized = false;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours default
      version: '1.0.0',
      enableServiceWorker: 'serviceWorker' in navigator,
      enableIndexedDB: 'indexedDB' in window,
      ...config
    };

    this.initializeServiceWorker();
    this.initializeIndexedDB();
  }

  /**
   * Initialize IndexedDB properly
   */
  private async initializeIndexedDB(): Promise<void> {
    if (!this.config.enableIndexedDB) {
      return;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onerror = () => {
          console.warn('IndexedDB initialization failed');
          this.config.enableIndexedDB = false;
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Delete old object store if it exists
          if (db.objectStoreNames.contains(this.storeName)) {
            db.deleteObjectStore(this.storeName);
          }
          
          // Create new object store
          db.createObjectStore(this.storeName);
          console.log('IndexedDB object store created');
        };

        request.onsuccess = () => {
          this.dbInitialized = true;
          console.log('IndexedDB initialized successfully');
          resolve();
        };
      });
    } catch (error) {
      console.warn('IndexedDB initialization error:', error);
      this.config.enableIndexedDB = false;
    }
  }

  /**
   * Get cached translation data
   */
  async get(key: string): Promise<any | null> {
    try {
      // Check memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && this.isValidEntry(memoryEntry)) {
        // Reduce logging frequency
        if (Math.random() < 0.1) { // Only log 10% of cache hits
          console.log(`Translation cache hit (memory): ${key}`);
        }
        return memoryEntry.data;
      }

      // Check IndexedDB cache
      if (this.config.enableIndexedDB) {
        const dbEntry = await this.getFromIndexedDB(key);
        if (dbEntry && this.isValidEntry(dbEntry)) {
          // Update memory cache
          this.memoryCache.set(key, dbEntry);
          // Reduce logging frequency
          if (Math.random() < 0.1) { // Only log 10% of cache hits
            console.log(`Translation cache hit (IndexedDB): ${key}`);
          }
          return dbEntry.data;
        }
      }

      // Check service worker cache
      if (this.config.enableServiceWorker) {
        const swEntry = await this.getFromServiceWorker(key);
        if (swEntry) {
          // Reduce logging frequency
          if (Math.random() < 0.1) { // Only log 10% of cache hits
            console.log(`Translation cache hit (Service Worker): ${key}`);
          }
          return swEntry;
        }
      }

      // Reduce logging frequency for cache misses
      if (Math.random() < 0.1) { // Only log 10% of cache misses
        console.log(`Translation cache miss: ${key}`);
      }
      return null;

    } catch (error) {
      console.warn(`Translation cache get error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set translation data in cache
   */
  async set(key: string, data: any, etag?: string): Promise<void> {
    try {
      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        version: this.config.version,
        etag
      };

      // Set in memory cache
      this.memoryCache.set(key, entry);

      // Set in IndexedDB cache
      if (this.config.enableIndexedDB) {
        await this.setInIndexedDB(key, entry);
      }

      // Set in service worker cache
      if (this.config.enableServiceWorker) {
        await this.setInServiceWorker(key, data);
      }

      // Reduce logging frequency for cache sets
      if (Math.random() < 0.1) { // Only log 10% of cache sets
        console.log(`Translation cached: ${key}`);
      }

    } catch (error) {
      console.warn(`Translation cache set error for ${key}:`, error);
    }
  }

  /**
   * Invalidate cache entry
   */
  async invalidate(key: string): Promise<void> {
    try {
      // Remove from memory cache
      this.memoryCache.delete(key);

      // Remove from IndexedDB cache
      if (this.config.enableIndexedDB) {
        await this.removeFromIndexedDB(key);
      }

      // Remove from service worker cache
      if (this.config.enableServiceWorker) {
        await this.removeFromServiceWorker(key);
      }

      console.log(`Translation cache invalidated: ${key}`);

    } catch (error) {
      console.warn(`Translation cache invalidation error for ${key}:`, error);
    }
  }

  /**
   * Clear all cached translations
   */
  async clear(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();

      // Clear IndexedDB cache
      if (this.config.enableIndexedDB) {
        await this.clearIndexedDB();
      }

      // Clear service worker cache
      if (this.config.enableServiceWorker) {
        await this.clearServiceWorker();
      }

      console.log('Translation cache cleared');

    } catch (error) {
      console.warn('Translation cache clear error:', error);
    }
  }

  /**
   * Update cache version and invalidate old entries
   */
  async updateVersion(newVersion: string): Promise<void> {
    if (newVersion !== this.config.version) {
      console.log(`Updating translation cache version: ${this.config.version} -> ${newVersion}`);
      
      // Clear all caches when version changes
      await this.clear();
      
      // Update config
      this.config.version = newVersion;
      
      // Store new version in localStorage
      localStorage.setItem('translation-cache-version', newVersion);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memoryEntries: number;
    memorySize: number;
    version: string;
    maxAge: number;
  } {
    const memoryEntries = this.memoryCache.size;
    const memorySize = JSON.stringify([...this.memoryCache.entries()]).length;

    return {
      memoryEntries,
      memorySize,
      version: this.config.version,
      maxAge: this.config.maxAge
    };
  }

  /**
   * Check if cache entry is valid
   */
  private isValidEntry(entry: CacheEntry): boolean {
    const now = Date.now();
    const isExpired = (now - entry.timestamp) > this.config.maxAge;
    const isVersionMismatch = entry.version !== this.config.version;

    return !isExpired && !isVersionMismatch;
  }

  /**
   * Initialize service worker for caching
   */
  private async initializeServiceWorker(): Promise<void> {
    // Temporarily disable service worker to fix performance issues
    this.config.enableServiceWorker = false;
    return;
    
    if (!this.config.enableServiceWorker) {
      return;
    }

    try {
      // Register service worker if not already registered
      if (!navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered for translation caching');
      }

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'TRANSLATION_CACHE_UPDATE') {
          console.log('Translation cache updated by service worker');
        }
      });

    } catch (error) {
      console.warn('Service worker registration failed:', error);
      this.config.enableServiceWorker = false;
    }
  }

  /**
   * Get translation from IndexedDB
   */
  private async getFromIndexedDB(key: string): Promise<CacheEntry | null> {
    if (!this.config.enableIndexedDB || !this.dbInitialized) {
      return null;
    }

    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        resolve(null);
      };

      request.onsuccess = (event) => {
        try {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Check if object store exists before creating transaction
          if (!db.objectStoreNames.contains(this.storeName)) {
            resolve(null);
            return;
          }
          
          const transaction = db.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);
          const getRequest = store.get(key);

          getRequest.onsuccess = () => {
            resolve(getRequest.result || null);
          };

          getRequest.onerror = () => {
            resolve(null);
          };
          
          transaction.onerror = () => {
            resolve(null);
          };
        } catch (error) {
          resolve(null);
        }
      };
    });
  }

  /**
   * Set translation in IndexedDB
   */
  private async setInIndexedDB(key: string, entry: CacheEntry): Promise<void> {
    if (!this.config.enableIndexedDB || !this.dbInitialized) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        resolve(); // Don't fail, just skip caching
      };

      request.onsuccess = (event) => {
        try {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Check if object store exists before creating transaction
          if (!db.objectStoreNames.contains(this.storeName)) {
            resolve(); // Don't fail, just skip caching
            return;
          }
          
          const transaction = db.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const putRequest = store.put(entry, key);

          putRequest.onsuccess = () => {
            resolve();
          };

          putRequest.onerror = () => {
            resolve(); // Don't fail on put errors
          };
          
          transaction.onerror = () => {
            resolve(); // Don't fail on transaction errors
          };
        } catch (error) {
          resolve(); // Don't fail, just skip caching
        }
      };
    });
  }

  /**
   * Remove translation from IndexedDB
   */
  private async removeFromIndexedDB(key: string): Promise<void> {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onsuccess = (event) => {
        try {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Check if object store exists before creating transaction
          if (!db.objectStoreNames.contains(this.storeName)) {
            resolve(); // Don't fail if store doesn't exist
            return;
          }
          
          const transaction = db.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const deleteRequest = store.delete(key);

          deleteRequest.onsuccess = () => {
            resolve();
          };

          deleteRequest.onerror = () => {
            resolve(); // Don't fail on delete errors
          };
          
          transaction.onerror = () => {
            resolve(); // Don't fail on transaction errors
          };
        } catch (error) {
          console.warn('IndexedDB delete error:', error);
          resolve(); // Don't fail, just skip
        }
      };

      request.onerror = () => {
        resolve(); // Don't fail on open errors
      };
    });
  }

  /**
   * Clear IndexedDB cache
   */
  private async clearIndexedDB(): Promise<void> {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onsuccess = (event) => {
        try {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Check if object store exists before creating transaction
          if (!db.objectStoreNames.contains(this.storeName)) {
            resolve(); // Don't fail if store doesn't exist
            return;
          }
          
          const transaction = db.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const clearRequest = store.clear();

          clearRequest.onsuccess = () => {
            resolve();
          };

          clearRequest.onerror = () => {
            resolve(); // Don't fail on clear errors
          };
          
          transaction.onerror = () => {
            resolve(); // Don't fail on transaction errors
          };
        } catch (error) {
          console.warn('IndexedDB clear error:', error);
          resolve(); // Don't fail, just skip
        }
      };

      request.onerror = () => {
        resolve(); // Don't fail on open errors
      };
    });
  }

  /**
   * Get translation from service worker cache
   */
  private async getFromServiceWorker(key: string): Promise<any | null> {
    try {
      if (!navigator.serviceWorker.controller) {
        return null;
      }

      // Send message to service worker
      const response = await this.sendMessageToServiceWorker({
        type: 'GET_TRANSLATION_CACHE',
        key
      });

      return response?.data || null;

    } catch (error) {
      console.warn('Service worker cache get error:', error);
      return null;
    }
  }

  /**
   * Set translation in service worker cache
   */
  private async setInServiceWorker(key: string, data: any): Promise<void> {
    try {
      if (!navigator.serviceWorker.controller) {
        return;
      }

      // Send message to service worker
      await this.sendMessageToServiceWorker({
        type: 'SET_TRANSLATION_CACHE',
        key,
        data
      });

    } catch (error) {
      console.warn('Service worker cache set error:', error);
    }
  }

  /**
   * Remove translation from service worker cache
   */
  private async removeFromServiceWorker(key: string): Promise<void> {
    try {
      if (!navigator.serviceWorker.controller) {
        return;
      }

      // Send message to service worker
      await this.sendMessageToServiceWorker({
        type: 'DELETE_TRANSLATION_CACHE',
        key
      });

    } catch (error) {
      console.warn('Service worker cache delete error:', error);
    }
  }

  /**
   * Clear service worker cache
   */
  private async clearServiceWorker(): Promise<void> {
    try {
      if (!navigator.serviceWorker.controller) {
        return;
      }

      // Send message to service worker
      await this.sendMessageToServiceWorker({
        type: 'CLEAR_TRANSLATION_CACHE'
      });

    } catch (error) {
      console.warn('Service worker cache clear error:', error);
    }
  }

  /**
   * Send message to service worker
   */
  private async sendMessageToServiceWorker(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data);
        }
      };

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
      } else {
        reject(new Error('No service worker controller'));
      }

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Service worker message timeout'));
      }, 5000);
    });
  }
}

// Create singleton instance with service worker disabled temporarily
export const translationCacheService = new TranslationCacheService({
  version: import.meta.env.VITE_TRANSLATION_VERSION || '1.0.0',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  enableServiceWorker: false, // Temporarily disable to fix performance issues
  enableIndexedDB: true
});

export default translationCacheService;