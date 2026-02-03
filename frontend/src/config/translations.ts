/**
 * Translation Configuration
 * Manages CDN URLs, versioning, and loading strategies for translation assets
 */

export interface TranslationConfig {
  cdnEndpoint: string;
  version: string;
  fallbackLanguage: string;
  supportedLanguages: string[];
  cacheStrategy: 'memory' | 'localStorage' | 'sessionStorage';
  loadingStrategy: 'eager' | 'lazy' | 'on-demand';
  compressionSupport: boolean;
  integrityCheck: boolean;
}

export interface TranslationManifest {
  version: string;
  timestamp: string;
  environment: string;
  cdnEndpoint: string;
  files: Record<string, TranslationFileInfo>;
}

export interface TranslationFileInfo {
  hash: string;
  originalSize: number;
  minifiedSize: number;
  gzipSize: number;
  brotliSize?: number;
  url: string;
  compressionRatio: string;
}

export interface CDNConfig {
  provider: string;
  version: string;
  url: string;
  timestamp: string;
  environment: string;
}

// Default configuration
export const DEFAULT_TRANSLATION_CONFIG: TranslationConfig = {
  cdnEndpoint: process.env.VITE_CDN_ENDPOINT || 'http://localhost:3000/cdn',
  version: process.env.VITE_TRANSLATION_VERSION || 'latest',
  fallbackLanguage: 'en',
  supportedLanguages: ['en', 'ne'],
  cacheStrategy: 'localStorage',
  loadingStrategy: 'lazy',
  compressionSupport: true,
  integrityCheck: true
};

/**
 * Translation Asset Loader
 * Handles loading translation files from CDN with fallback strategies
 */
export class TranslationAssetLoader {
  private config: TranslationConfig;
  private manifest: TranslationManifest | null = null;
  private cache: Map<string, any> = new Map();

  constructor(config: TranslationConfig = DEFAULT_TRANSLATION_CONFIG) {
    this.config = config;
  }

  /**
   * Load translation manifest from CDN
   */
  async loadManifest(): Promise<TranslationManifest> {
    if (this.manifest !== null) {
      return this.manifest;
    }

    try {
      const manifestUrl = `${this.config.cdnEndpoint}/${this.config.version}/manifest.json`;
      const response = await fetch(manifestUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to load manifest: ${response.status}`);
      }

      this.manifest = await response.json();
      return this.manifest!;
    } catch (error) {
      console.warn('Failed to load translation manifest from CDN, using fallback:', error);
      
      // Fallback to local manifest or default structure
      this.manifest = {
        version: this.config.version,
        timestamp: new Date().toISOString(),
        environment: 'fallback',
        cdnEndpoint: this.config.cdnEndpoint,
        files: {}
      };
      
      return this.manifest;
    }
  }

  /**
   * Load translation file for specific language and namespace
   */
  async loadTranslation(language: string, namespace: string): Promise<any> {
    const cacheKey = `${language}/${namespace}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Check localStorage cache
    if (this.config.cacheStrategy === 'localStorage') {
      const cached = this.loadFromLocalStorage(cacheKey);
      if (cached) {
        this.cache.set(cacheKey, cached);
        return cached;
      }
    }

    try {
      const manifest = await this.loadManifest();
      const fileInfo = manifest.files[cacheKey];
      
      let translationData;
      
      if (fileInfo && fileInfo.url) {
        // Load from CDN with versioned URL
        translationData = await this.loadFromCDN(fileInfo.url, fileInfo.hash);
      } else {
        // Fallback to local files
        translationData = await this.loadFromLocal(language, namespace);
      }

      // Cache the result
      this.cache.set(cacheKey, translationData);
      
      if (this.config.cacheStrategy === 'localStorage') {
        this.saveToLocalStorage(cacheKey, translationData);
      }

      return translationData;
    } catch (error) {
      console.warn(`Failed to load translation ${cacheKey}, using fallback:`, error);
      
      // Ultimate fallback to local files
      try {
        const fallbackData = await this.loadFromLocal(language, namespace);
        this.cache.set(cacheKey, fallbackData);
        return fallbackData;
      } catch (fallbackError) {
        console.error(`Failed to load fallback translation for ${cacheKey}:`, fallbackError);
        return {};
      }
    }
  }

  /**
   * Load translation from CDN with integrity check
   */
  private async loadFromCDN(url: string, expectedHash?: string): Promise<any> {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': this.config.compressionSupport ? 'gzip, br' : 'identity'
      }
    });

    if (!response.ok) {
      throw new Error(`CDN request failed: ${response.status}`);
    }

    const data = await response.json();

    // Verify integrity if hash is provided
    if (this.config.integrityCheck && expectedHash) {
      const actualHash = await this.calculateHash(JSON.stringify(data));
      if (actualHash !== expectedHash) {
        console.warn('Translation file integrity check failed, but continuing...');
      }
    }

    return data;
  }

  /**
   * Load translation from local files (fallback)
   */
  private async loadFromLocal(language: string, namespace: string): Promise<any> {
    try {
      // Dynamic import of local translation files
      const module = await import(`../i18n/locales/${language}/${namespace}.json`);
      return module.default || module;
    } catch (error) {
      // If specific language fails, try fallback language
      if (language !== this.config.fallbackLanguage) {
        return this.loadFromLocal(this.config.fallbackLanguage, namespace);
      }
      throw error;
    }
  }

  /**
   * Load from localStorage cache
   */
  private loadFromLocalStorage(key: string): any | null {
    try {
      const cached = localStorage.getItem(`translation_${key}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        
        // Check if cache is still valid (24 hours)
        const cacheAge = Date.now() - parsed.timestamp;
        if (cacheAge < 24 * 60 * 60 * 1000) {
          return parsed.data;
        }
      }
    } catch (error) {
      console.warn('Failed to load from localStorage cache:', error);
    }
    
    return null;
  }

  /**
   * Save to localStorage cache
   */
  private saveToLocalStorage(key: string, data: any): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        version: this.config.version
      };
      
      localStorage.setItem(`translation_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save to localStorage cache:', error);
    }
  }

  /**
   * Calculate hash for integrity checking
   */
  private async calculateHash(content: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8);
    }
    
    // Fallback hash function for older browsers
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 8);
  }

  /**
   * Preload translations for better performance
   */
  async preloadTranslations(language: string, namespaces: string[]): Promise<void> {
    const promises = namespaces.map(namespace => 
      this.loadTranslation(language, namespace)
    );
    
    await Promise.allSettled(promises);
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.cache.clear();
    
    if (this.config.cacheStrategy === 'localStorage') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('translation_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const translationLoader = new TranslationAssetLoader();