import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Dynamic translation loading
import translationCacheService from '../services/translationCacheService';

interface TranslationLoader {
  loadTranslations: (language: string, namespace: string, forceReload?: boolean) => Promise<any>;
  isLoaded: (language: string, namespace: string) => boolean;
  getLoadingState: () => { [key: string]: boolean };
}

// Import types
import type { 
  SupportedLanguage, 
  Namespace, 
  TranslationResources 
} from './types';

// Define supported languages
export const SUPPORTED_LANGUAGES = ['en', 'ne'] as const;
export type { SupportedLanguage };

// Define namespaces
export const NAMESPACES = ['common', 'auth', 'products', 'admin', 'buyer', 'farmer', 'reviews', 'home'] as const;
export type { Namespace };

// Translation loading cache with debouncing
const translationCache = new Map<string, any>();
const loadingStates = new Map<string, Promise<any>>();
const loadingAttempts = new Map<string, number>();
const lastLoadAttempt = new Map<string, number>();

// Debounce translation loading to prevent excessive requests
const LOAD_DEBOUNCE_TIME = 1000; // 1 second
const MAX_LOAD_ATTEMPTS = 3;

// Create translation loader with API integration
export const translationLoader: TranslationLoader = {
  loadTranslations: async (language: string, namespace: string, forceReload: boolean = false): Promise<any> => {
    const cacheKey = `${language}-${namespace}`;
    
    // Check debouncing to prevent excessive loading
    const now = Date.now();
    const lastAttempt = lastLoadAttempt.get(cacheKey) || 0;
    const attempts = loadingAttempts.get(cacheKey) || 0;
    
    if (!forceReload && attempts >= MAX_LOAD_ATTEMPTS && (now - lastAttempt) < LOAD_DEBOUNCE_TIME * 10) {
      // Too many failed attempts recently, return cached or empty
      return translationCache.get(cacheKey) || {};
    }
    
    if (!forceReload && (now - lastAttempt) < LOAD_DEBOUNCE_TIME) {
      // Too soon since last attempt, return cached or wait
      if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey);
      }
      // Wait for debounce period
      await new Promise(resolve => setTimeout(resolve, LOAD_DEBOUNCE_TIME - (now - lastAttempt)));
    }
    
    // Update attempt tracking
    lastLoadAttempt.set(cacheKey, now);
    
    // Return cached translation if available and not forcing reload
    if (!forceReload && translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey);
    }
    
    // Clear cache if forcing reload
    if (forceReload) {
      translationCache.delete(cacheKey);
      loadingStates.delete(cacheKey);
      loadingAttempts.delete(cacheKey);
      // Also clear browser cache for this specific translation
      try {
        await translationCacheService.invalidate(cacheKey);
      } catch (e) {
        console.warn('Failed to clear translation cache service:', e);
      }
    }
    
    // Return existing loading promise if already loading (and not forcing reload)
    if (!forceReload && loadingStates.has(cacheKey)) {
      return loadingStates.get(cacheKey);
    }
    
    // Create loading promise with API integration
    const loadingPromise = (async () => {
      try {
        console.log(`Loading translation: ${language}/${namespace}`);
        
        // Try to get from cache service first
        const cachedData = await translationCacheService.get(cacheKey);
        if (cachedData) {
          // Reduce logging frequency
          if (Math.random() < 0.1) { // Only log 10% of cache hits
            console.log(`Translation loaded from cache: ${language}/${namespace}`);
          }
          translationCache.set(cacheKey, cachedData);
          return cachedData;
        }
        
        // Load from API (Translation Management System)
        try {
          const queryParams = new URLSearchParams();
          queryParams.append('language', language);
          if (namespace && namespace !== 'common') {
            queryParams.append('namespace', namespace);
          }
          // Add timestamp to force cache refresh
          queryParams.append('_t', Date.now().toString());
          
          const response = await fetch(`/api/translations?${queryParams.toString()}`, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const apiData = await response.json();
            if (apiData.success && apiData.data?.translations) {
              const translations = apiData.data.translations;
              
              // Validate that we actually got translation data
              if (translations && typeof translations === 'object' && Object.keys(translations).length > 0) {
                // Reduce logging frequency
                if (Math.random() < 0.1) { // Only log 10% of API loads
                  console.log(`Translation loaded from API: ${language}/${namespace}`, Object.keys(translations).length, 'keys');
                }
                
                // Cache the loaded translation
                translationCache.set(cacheKey, translations);
                await translationCacheService.set(cacheKey, translations);
                
                return translations;
              } else {
                console.warn(`API returned empty translations for ${language}/${namespace}`);
              }
            } else {
              console.warn(`API response invalid for ${language}/${namespace}:`, apiData);
            }
          } else {
            console.warn(`API response not ok: ${response.status} ${response.statusText} for ${language}/${namespace}`);
          }
        } catch (apiError) {
          console.warn(`API translation loading failed for ${language}/${namespace}, falling back to static files:`, apiError);
        }
        
        // Fallback to static files if API fails
        let translationModule;
        
        try {
          switch (`${language}/${namespace}`) {
            case 'en/common':
              translationModule = await import('./locales/en/common.json');
              break;
            case 'en/auth':
              translationModule = await import('./locales/en/auth.json');
              break;
            case 'en/products':
              translationModule = await import('./locales/en/products.json');
              break;
            case 'en/admin':
              translationModule = await import('./locales/en/admin.json');
              break;
            case 'en/buyer':
              translationModule = await import('./locales/en/buyer.json');
              break;
            case 'en/farmer':
              translationModule = await import('./locales/en/farmer.json');
              break;
            case 'en/reviews':
              translationModule = await import('./locales/en/reviews.json');
              break;
            case 'en/home':
              translationModule = await import('./locales/en/home.json');
              break;
            case 'ne/common':
              translationModule = await import('./locales/ne/common.json');
              break;
            case 'ne/auth':
              translationModule = await import('./locales/ne/auth.json');
              break;
            case 'ne/products':
              translationModule = await import('./locales/ne/products.json');
              break;
            case 'ne/admin':
              translationModule = await import('./locales/ne/admin.json');
              break;
            case 'ne/buyer':
              translationModule = await import('./locales/ne/buyer.json');
              break;
            case 'ne/farmer':
              translationModule = await import('./locales/ne/farmer.json');
              break;
            case 'ne/reviews':
              translationModule = await import('./locales/ne/reviews.json');
              break;
            case 'ne/home':
              translationModule = await import('./locales/ne/home.json');
              break;
            default:
              console.warn(`No static fallback for: ${language}/${namespace}`);
              return {};
          }
          
          const translations = translationModule.default || translationModule;
          
          // Cache the loaded translation
          translationCache.set(cacheKey, translations);
          await translationCacheService.set(cacheKey, translations);
          
          // Reduce logging frequency
          if (Math.random() < 0.1) { // Only log 10% of static file loads
            console.log(`Successfully loaded translation from static files: ${language}/${namespace}`);
          }
          return translations;
          
        } catch (staticError) {
          console.warn(`Static file loading also failed for ${language}/${namespace}:`, staticError);
          return {};
        }
        
      } catch (error) {
        console.error(`Failed to load translation: ${language}/${namespace}`, error);
        
        // Track failed attempts
        const attempts = loadingAttempts.get(cacheKey) || 0;
        loadingAttempts.set(cacheKey, attempts + 1);
        
        return {};
        
      } finally {
        // Remove from loading states
        loadingStates.delete(cacheKey);
      }
    })();
    
    // Store loading promise
    loadingStates.set(cacheKey, loadingPromise);
    
    return loadingPromise;
  },
  
  isLoaded: (language: string, namespace: string): boolean => {
    const cacheKey = `${language}-${namespace}`;
    return translationCache.has(cacheKey);
  },
  
  getLoadingState: () => {
    const state: { [key: string]: boolean } = {};
    loadingStates.forEach((_, key) => {
      state[key] = true;
    });
    return state;
  }
};

// Language detection configuration with enhanced persistence
const detectionOptions = {
  // Order of language detection methods - prioritize localStorage
  order: ['localStorage', 'navigator', 'htmlTag'],
  
  // Cache user language preference in localStorage
  caches: ['localStorage'],
  
  // Exclude certain detection methods
  excludeCacheFor: ['cimode'],
  
  // Check for language in localStorage with the correct key
  lookupLocalStorage: 'i18nextLng',
  
  // Check for language in HTML tag
  lookupFromPathIndex: 0,
  lookupFromSubdomainIndex: 0,
  
  // Convert language codes (e.g., 'en-US' -> 'en')
  convertDetectedLanguage: (lng: string) => {
    console.log('Language detection - detected language:', lng);
    
    // Extract base language code
    const baseLanguage = lng.split('-')[0];
    
    // Check if it's a supported language
    const supportedLanguage = SUPPORTED_LANGUAGES.includes(baseLanguage as SupportedLanguage) 
      ? baseLanguage 
      : 'en';
    
    console.log('Language detection - converted to:', supportedLanguage);
    return supportedLanguage;
  },
  
  // Additional options for better persistence
  checkWhitelist: true
};

// i18next configuration with enhanced language persistence
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Language detection with enhanced persistence
    detection: detectionOptions,
    
    // Fallback language
    fallbackLng: 'en',
    
    // Supported languages - explicitly define for better detection
    supportedLngs: SUPPORTED_LANGUAGES,
    
    // Non-explicit supported languages fallback
    nonExplicitSupportedLngs: true,
    
    // Default namespace
    defaultNS: 'common',
    
    // Available namespaces
    ns: NAMESPACES,
    
    // Debug mode (disable in production)
    debug: false, // Temporarily disable debug to reduce console spam
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // React-specific options
    react: {
      useSuspense: false, // Disable suspense for better error handling
      bindI18n: 'languageChanged',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '', // Return empty string for empty translations
      transSupportBasicHtmlNodes: true, // Support basic HTML in translations
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em'], // Allowed HTML tags
    },
    
    // Start with empty resources - will be loaded dynamically
    resources: {},
    
    // Missing key handling
    saveMissing: false, // Temporarily disable to reduce console spam
    missingKeyHandler: (lng, ns, key) => {
      // Temporarily disable missing key logging to reduce console spam
      // if (process.env.NODE_ENV === 'development') {
      //   console.warn(`Missing translation key: ${ns}:${key} for language: ${lng}`);
      // }
    },
    
    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Performance optimizations
    load: 'languageOnly', // Load only base language (en, ne) not variants (en-US)
    preload: [], // Don't preload - load on demand
    
    // Key separator
    keySeparator: '.',
    nsSeparator: ':',
    
    // Enhanced initialization callback
    initImmediate: false, // Wait for initialization to complete
  })
  .then(async () => {
    console.log('i18n initialized successfully with language:', i18n.language);
    
    // Ensure the detected language is properly stored in localStorage
    const currentLang = i18n.language;
    if (currentLang && SUPPORTED_LANGUAGES.includes(currentLang as SupportedLanguage)) {
      localStorage.setItem('i18nextLng', currentLang);
      console.log('Language preference saved to localStorage:', currentLang);
    }
    
    // Load initial translations for the detected language
    await loadInitialTranslations();
  })
  .catch((error) => {
    console.error('Failed to initialize i18n:', error);
  });

// Load initial translations for detected language and namespace
const loadInitialTranslations = async () => {
  try {
    // Get the detected language from localStorage first, then i18n, then default
    const storedLanguage = localStorage.getItem('i18nextLng');
    const detectedLanguage = storedLanguage || i18n.language || 'en';
    const languageToLoad = SUPPORTED_LANGUAGES.includes(detectedLanguage as SupportedLanguage) 
      ? detectedLanguage as SupportedLanguage 
      : 'en';
    
    console.log('🔄 Loading initial translations for detected language:', languageToLoad);
    console.log('🔍 localStorage i18nextLng:', storedLanguage);
    console.log('🔍 i18n.language:', i18n.language);
    
    // Ensure i18n is set to the correct language BEFORE loading translations
    if (i18n.language !== languageToLoad) {
      console.log('🔧 Setting i18n language to:', languageToLoad);
      await i18n.changeLanguage(languageToLoad);
    }
    
    // Load all critical namespaces for the detected language
    const namespacesToLoad = ['common', 'auth', 'buyer', 'farmer', 'reviews', 'home'];
    console.log('📥 Loading namespaces for', languageToLoad, ':', namespacesToLoad);
    
    const loadPromises = namespacesToLoad.map(async (namespace) => {
      try {
        const translations = await translationLoader.loadTranslations(languageToLoad, namespace, true); // Force reload
        const keyCount = Object.keys(translations).length;
        console.log(`📦 ${namespace} translations loaded: ${keyCount} keys`);
        
        // Special logging for reviews namespace
        if (namespace === 'reviews') {
          console.log(`🎯 REVIEWS namespace loaded with keys:`, Object.keys(translations).slice(0, 5));
        }
        
        i18n.addResourceBundle(languageToLoad, namespace, translations, true, true);
        return { namespace, success: true, keyCount };
      } catch (error) {
        console.warn(`⚠️ Failed to load ${namespace} for ${languageToLoad}:`, error);
        return { namespace, success: false, keyCount: 0 };
      }
    });
    
    const results = await Promise.all(loadPromises);
    const successfulLoads = results.filter(r => r.success);
    console.log(`✅ Successfully loaded ${successfulLoads.length}/${namespacesToLoad.length} namespaces`);
    
    // If the detected language is not English, also load English as fallback
    if (languageToLoad !== 'en') {
      console.log('📥 Loading English fallback translations...');
      try {
        const enCommonTranslations = await translationLoader.loadTranslations('en', 'common');
        i18n.addResourceBundle('en', 'common', enCommonTranslations, true, true);
        
        const enAuthTranslations = await translationLoader.loadTranslations('en', 'auth');
        i18n.addResourceBundle('en', 'auth', enAuthTranslations, true, true);
        console.log('📦 English fallback translations loaded');
      } catch (fallbackError) {
        console.warn('⚠️ Failed to load English fallback:', fallbackError);
      }
    }
    
    // Verify that translations are actually loaded and accessible
    const loadedResources = i18n.store.data[languageToLoad];
    console.log('🔍 Available resources for', languageToLoad, ':', loadedResources ? Object.keys(loadedResources) : 'NONE');
    
    // Test a sample translation to ensure it works
    if (loadedResources && loadedResources.common) {
      const testKey = 'buttons.save';
      const testTranslation = i18n.t(`common.${testKey}`);
      console.log('🧪 Test translation:', `common.${testKey} = "${testTranslation}"`);
    }
    
    console.log('🎉 Initial translations loaded successfully for language:', languageToLoad);
  } catch (error) {
    console.error('❌ Failed to load initial translations:', error);
    
    // Fallback: try to load English translations
    try {
      console.log('🔄 Attempting fallback to English translations...');
      const commonTranslations = await translationLoader.loadTranslations('en', 'common');
      i18n.addResourceBundle('en', 'common', commonTranslations, true, true);
      
      const authTranslations = await translationLoader.loadTranslations('en', 'auth');
      i18n.addResourceBundle('en', 'auth', authTranslations, true, true);
      
      // Ensure i18n is set to English
      if (i18n.language !== 'en') {
        await i18n.changeLanguage('en');
      }
      
      console.log('✅ Fallback English translations loaded');
    } catch (fallbackError) {
      console.error('❌ Failed to load fallback translations:', fallbackError);
    }
  }
};

// Load initial translations - moved after i18n initialization
// This will be called from the initialization promise

// Enhanced translation loading function
export const loadTranslationNamespace = async (
  language: string, 
  namespace: string,
  retries: number = 3,
  forceReload: boolean = false
): Promise<boolean> => {
  try {
    // Check if already loaded (skip cache if forceReload is true)
    if (!forceReload && translationLoader.isLoaded(language, namespace)) {
      return true;
    }
    
    // Clear cache if forceReload is requested
    if (forceReload) {
      const cacheKey = `${language}-${namespace}`;
      translationCache.delete(cacheKey);
      await translationCacheService.invalidate(cacheKey);
    }
    
    // Load translations with retry logic
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const translations = await translationLoader.loadTranslations(language, namespace, forceReload);
        
        // Add to i18n resources
        i18n.addResourceBundle(language, namespace, translations, true, true);
        
        console.log(`Translation namespace loaded: ${language}/${namespace} (attempt ${attempt})`);
        return true;
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`Failed to load translation namespace: ${language}/${namespace} (attempt ${attempt}/${retries})`, error);
        
        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    console.error(`Failed to load translation namespace after ${retries} attempts: ${language}/${namespace}`, lastError);
    return false;
    
  } catch (error) {
    console.error(`Error loading translation namespace: ${language}/${namespace}`, error);
    return false;
  }
};

// Load multiple namespaces
export const loadTranslationNamespaces = async (
  language: string, 
  namespaces: string[],
  forceReload: boolean = false
): Promise<{ [namespace: string]: boolean }> => {
  const results: { [namespace: string]: boolean } = {};
  
  // Load namespaces in parallel
  const loadPromises = namespaces.map(async (namespace) => {
    const success = await loadTranslationNamespace(language, namespace, 3, forceReload);
    results[namespace] = success;
    return { namespace, success };
  });
  
  await Promise.all(loadPromises);
  
  return results;
};

// Get loading state for UI feedback
export const getTranslationLoadingState = () => {
  return translationLoader.getLoadingState();
};

// Cache management functions
export const invalidateTranslationCache = async (language?: string, namespace?: string) => {
  if (language && namespace) {
    // Invalidate specific translation
    const cacheKey = `${language}-${namespace}`;
    translationCache.delete(cacheKey);
    await translationCacheService.invalidate(cacheKey);
    console.log(`Translation cache invalidated: ${cacheKey}`);
  } else {
    // Invalidate all translations
    translationCache.clear();
    await translationCacheService.clear();
    console.log('All translation caches cleared');
  }
};

export const updateTranslationVersion = async (newVersion: string) => {
  await translationCacheService.updateVersion(newVersion);
  console.log(`Translation version updated to: ${newVersion}`);
};

export const getTranslationCacheStats = () => {
  return {
    memory: {
      entries: translationCache.size,
      keys: [...translationCache.keys()]
    },
    service: translationCacheService.getStats()
  };
};

// Export configured i18n instance
export default i18n;

// Re-export types for convenience
export type { 
  TranslationResources, 
  TranslationKey, 
  TranslationFunction,
  CommonTranslations,
  AuthTranslations,
  ProductsTranslations,
  AdminTranslations
} from './types';

// Type definitions for better TypeScript support
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: TranslationResources;
  }
}