/**
 * Translation Service Worker Manager
 * Handles registration and communication with the translation service worker
 */

export interface CacheInfo {
  cacheSize: number;
  entries: Array<{
    url: string;
    cacheTime: string | null;
    strategy: string;
    size: string;
  }>;
}

export class TranslationServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator;
  }

  /**
   * Register the translation service worker
   */
  async register(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Service Workers are not supported in this browser');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/translation-sw.js', {
        scope: '/'
      });

      console.log('Translation Service Worker registered successfully');

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New translation service worker available');
              this.notifyUpdate();
            }
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to register translation service worker:', error);
      return false;
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      console.log('Translation Service Worker unregistered');
      return result;
    } catch (error) {
      console.error('Failed to unregister translation service worker:', error);
      return false;
    }
  }

  /**
   * Clear translation cache
   */
  async clearCache(): Promise<boolean> {
    if (!this.isActive()) {
      return false;
    }

    try {
      const result = await this.sendMessage({ type: 'CLEAR_TRANSLATION_CACHE' });
      return result.success;
    } catch (error) {
      console.error('Failed to clear translation cache:', error);
      return false;
    }
  }

  /**
   * Get cache information
   */
  async getCacheInfo(): Promise<CacheInfo | null> {
    if (!this.isActive()) {
      return null;
    }

    try {
      const result = await this.sendMessage({ type: 'GET_CACHE_INFO' });
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Failed to get cache info:', error);
      return null;
    }
  }

  /**
   * Preload translations
   */
  async preloadTranslations(urls: string[]): Promise<boolean> {
    if (!this.isActive()) {
      return false;
    }

    try {
      const result = await this.sendMessage({
        type: 'PRELOAD_TRANSLATIONS',
        data: { urls }
      });
      return result.success;
    } catch (error) {
      console.error('Failed to preload translations:', error);
      return false;
    }
  }

  /**
   * Check if service worker is active
   */
  private isActive(): boolean {
    return this.isSupported && 
           this.registration !== null && 
           navigator.serviceWorker.controller !== null;
  }

  /**
   * Send message to service worker
   */
  private async sendMessage(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!navigator.serviceWorker.controller) {
        reject(new Error('No active service worker'));
        return;
      }

      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Service worker message timeout'));
      }, 10000);
    });
  }

  /**
   * Notify about service worker updates
   */
  private notifyUpdate(): void {
    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('translationServiceWorkerUpdate', {
      detail: {
        message: 'New translation cache available. Refresh to update.',
        action: 'refresh'
      }
    }));
  }

  /**
   * Get service worker status
   */
  getStatus(): {
    supported: boolean;
    registered: boolean;
    active: boolean;
    state?: string;
  } {
    return {
      supported: this.isSupported,
      registered: this.registration !== null,
      active: this.isActive(),
      state: navigator.serviceWorker.controller?.state
    };
  }
}

// Export singleton instance
export const translationServiceWorker = new TranslationServiceWorkerManager();

/**
 * Initialize translation service worker
 */
export async function initializeTranslationServiceWorker(): Promise<void> {
  // Only register in production or when explicitly enabled
  const shouldRegister = process.env.NODE_ENV === 'production' || 
                        process.env.VITE_ENABLE_SW === 'true';

  if (shouldRegister) {
    const registered = await translationServiceWorker.register();
    
    if (registered) {
      console.log('Translation service worker initialized');
      
      // Preload current language translations
      const currentLanguage = localStorage.getItem('i18nextLng') || 'en';
      const namespaces = ['common', 'auth', 'products', 'admin'];
      
      const urls = namespaces.map(namespace => 
        `/cdn/latest/${currentLanguage}/${namespace}.json`
      );
      
      await translationServiceWorker.preloadTranslations(urls);
    }
  } else {
    console.log('Translation service worker disabled in development');
  }
}

/**
 * Handle service worker updates
 */
export function handleServiceWorkerUpdates(): void {
  window.addEventListener('translationServiceWorkerUpdate', (event: any) => {
    const { message, action } = event.detail;
    
    // Show notification to user (implement based on your notification system)
    console.log('Service Worker Update:', message);
    
    if (action === 'refresh') {
      // Optionally auto-refresh or show user prompt
      if (confirm('New translations are available. Refresh now?')) {
        window.location.reload();
      }
    }
  });
}