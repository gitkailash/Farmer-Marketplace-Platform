import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  SupportedLanguage, 
  SUPPORTED_LANGUAGES, 
  NAMESPACES,
  loadTranslationNamespaces,
  getTranslationLoadingState,
  invalidateTranslationCache
} from '../i18n';
import { syncService, SyncableUserPreferences } from '../services/syncService';
import { 
  saveLanguagePreference, 
  getSavedLanguagePreference, 
  ensureLanguagePersistence,
  setupLanguageStorageListener
} from '../utils/languagePersistence';

// Define the context interface
interface I18nContextValue {
  language: SupportedLanguage;
  changeLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string, options?: any) => string;
  isLoading: boolean;
  isReady: boolean;
  availableLanguages: readonly SupportedLanguage[];
  loadingNamespaces: { [key: string]: boolean };
  loadNamespace: (namespace: string) => Promise<boolean>;
}

// Create the context
const I18nContext = createContext<I18nContextValue | undefined>(undefined);

// Provider props interface
interface I18nProviderProps {
  children: React.ReactNode;
  defaultLanguage?: SupportedLanguage;
  fallbackLanguage?: SupportedLanguage;
}

// I18nProvider component
export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  defaultLanguage = 'en',
  fallbackLanguage = 'en'
}) => {
  const { t, i18n } = useTranslation(['common', 'auth', 'products', 'admin']);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [loadingNamespaces, setLoadingNamespaces] = useState<{ [key: string]: boolean }>({});

  // Get current language from i18n instance
  const currentLanguage = (i18n.language || defaultLanguage) as SupportedLanguage;

  // Load namespace function
  const loadNamespace = useCallback(async (namespace: string): Promise<boolean> => {
    if (!NAMESPACES.includes(namespace as any)) {
      console.warn(`Unknown namespace: ${namespace}`);
      return false;
    }

    const cacheKey = `${currentLanguage}-${namespace}`;
    
    // Check if already loading using functional state update to avoid dependency
    let isAlreadyLoading = false;
    setLoadingNamespaces(prev => {
      if (prev[cacheKey]) {
        isAlreadyLoading = true;
        return prev;
      }
      return { ...prev, [cacheKey]: true };
    });
    
    if (isAlreadyLoading) {
      return false;
    }

    try {
      const results = await loadTranslationNamespaces(currentLanguage, [namespace]);
      const success = results[namespace];
      
      if (success) {
        console.log(`Namespace loaded successfully: ${namespace}`);
      } else {
        console.warn(`Failed to load namespace: ${namespace}`);
      }
      
      return success;
      
    } catch (error) {
      console.error(`Error loading namespace: ${namespace}`, error);
      return false;
      
    } finally {
      setLoadingNamespaces(prev => {
        const newState = { ...prev };
        delete newState[cacheKey];
        return newState;
      });
    }
  }, [currentLanguage]); // Removed loadingNamespaces from dependencies

  // Language change handler with enhanced persistence
  const changeLanguage = useCallback(async (lang: SupportedLanguage) => {
    try {
      setIsLoading(true);
      
      // Validate language is supported
      if (!SUPPORTED_LANGUAGES.includes(lang)) {
        console.warn(`Unsupported language: ${lang}. Falling back to ${fallbackLanguage}`);
        lang = fallbackLanguage;
      }

      // Clear translation cache for the new language to ensure fresh data
      if (Math.random() < 0.1) { // Only log 10% of cache clears
        console.log(`Clearing translation cache for language switch to: ${lang}`);
      }
      await invalidateTranslationCache();

      // Ensure i18n is ready before changing language
      if (!i18n.isInitialized) {
        console.warn('i18n not initialized, waiting...');
        await new Promise<void>((resolve) => {
          const checkInitialized = () => {
            if (i18n.isInitialized) {
              resolve();
            } else {
              setTimeout(checkInitialized, 50);
            }
          };
          checkInitialized();
        });
      }

      // Load all namespaces for the new language (force reload to get fresh translations)
      if (Math.random() < 0.1) { // Only log 10% of language loads
        console.log(`Loading translations for language: ${lang}`);
      }
      const results = await loadTranslationNamespaces(lang, [...NAMESPACES], true); // Force reload
      
      // Check if all critical namespaces loaded successfully
      const criticalNamespaces = ['common', 'auth', 'reviews'];
      const criticalLoaded = criticalNamespaces.every(ns => results[ns]);
      
      if (!criticalLoaded) {
        console.warn('Some critical namespaces failed to load, but continuing with language change');
      }

      // Change language in i18n
      await i18n.changeLanguage(lang);
      
      // Enhanced persistence using utility
      ensureLanguagePersistence(lang);
      
      // Update user profile if user is logged in
      await persistLanguageToProfile(lang);
      
      // Reduce logging frequency
      if (Math.random() < 0.1) { // Only log 10% of language changes
        console.log(`Language changed to: ${lang}`);
      }
    } catch (error) {
      console.error('Failed to change language:', error);
      // Fallback to default language on error
      if (lang !== fallbackLanguage) {
        try {
          await i18n.changeLanguage(fallbackLanguage);
          ensureLanguagePersistence(fallbackLanguage);
        } catch (fallbackError) {
          console.error('Failed to fallback to default language:', fallbackError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [i18n, fallbackLanguage]);

  // Persist language preference to user profile using sync service
  const persistLanguageToProfile = async (language: SupportedLanguage) => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        return; // Skip if user is not logged in
      }

      // Use sync service to persist preferences
      const success = await syncService.syncToServer({ language });
      
      if (success) {
        console.log('Language preference persisted to profile:', language);
      } else {
        console.warn('Failed to update language preference in profile');
      }
    } catch (error) {
      console.warn('Error updating language preference:', error);
      // Don't throw error - language change should still work locally
    }
  };

  // Initialize i18n and handle ready state with enhanced language detection
  useEffect(() => {
    const initializeI18n = async () => {
      try {
        console.log('🚀 I18nProvider: Starting initialization...');
        console.log('🔍 i18n.isInitialized:', i18n.isInitialized);
        console.log('🔍 currentLanguage:', currentLanguage);
        
        // Check if we have a saved language preference using the utility
        const savedLanguage = getSavedLanguagePreference();
        console.log('💾 Saved language from localStorage:', savedLanguage);
        console.log('🔍 Current i18n language:', i18n.language);
        
        // Wait for i18n to be initialized if not already
        if (!i18n.isInitialized) {
          console.log('⏳ Waiting for i18n initialization...');
          
          await new Promise<void>((resolve) => {
            const checkInitialized = () => {
              if (i18n.isInitialized) {
                console.log('✅ i18n initialization completed');
                resolve();
              } else {
                setTimeout(checkInitialized, 10);
              }
            };
            checkInitialized();
          });
        } else {
          console.log('✅ i18n already initialized');
        }
        
        // Determine the target language (prioritize saved preference)
        const targetLanguage = savedLanguage || i18n.language || currentLanguage;
        console.log('🎯 Target language determined:', targetLanguage);
        
        // If we have a saved language and it's different from current, change to it FIRST
        if (savedLanguage && savedLanguage !== i18n.language) {
          console.log('🔄 Changing i18n language to saved preference:', savedLanguage);
          await i18n.changeLanguage(savedLanguage);
          ensureLanguagePersistence(savedLanguage);
        }
        
        // Load critical namespaces for the target language
        const finalLanguage = savedLanguage || i18n.language || currentLanguage;
        console.log('📚 Loading translations for final language:', finalLanguage);
        
        // Load all critical namespaces
        const criticalNamespaces = ['common', 'auth', 'buyer', 'farmer', 'products', 'reviews'];
        const results = await loadTranslationNamespaces(finalLanguage, criticalNamespaces);
        console.log('📊 Translation loading results:', results);
        
        // Check if critical namespaces loaded
        const criticalLoaded = results['common'] && results['auth'] && results['reviews'];
        if (!criticalLoaded) {
          console.warn('⚠️ Critical namespaces failed to load, but continuing...');
        } else {
          console.log('✅ Critical namespaces loaded successfully');
        }
        
        // Verify translations are actually available in i18n store
        const availableResources = i18n.store.data[finalLanguage];
        console.log('🔍 Available resources for', finalLanguage, ':', availableResources ? Object.keys(availableResources) : 'NONE');
        
        // Test a sample translation to ensure it's working
        if (availableResources && availableResources.common) {
          const testTranslation = i18n.t('common.buttons.save');
          console.log('🧪 Test translation result:', testTranslation);
          
          // Only set ready if we actually have working translations
          if (testTranslation && testTranslation !== 'common.buttons.save') {
            setIsReady(true);
            setIsLoading(false);
            console.log('🎉 I18nProvider initialization complete with working translations');
          } else {
            console.warn('⚠️ Translations loaded but not working properly, retrying...');
            // Wait a bit and try again
            setTimeout(() => {
              const retryTest = i18n.t('common.buttons.save');
              if (retryTest && retryTest !== 'common.buttons.save') {
                setIsReady(true);
                setIsLoading(false);
                console.log('🎉 I18nProvider initialization complete after retry');
              } else {
                console.warn('⚠️ Translations still not working, proceeding anyway');
                setIsReady(true);
                setIsLoading(false);
              }
            }, 500);
          }
        } else {
          console.warn('⚠️ No translations available, proceeding anyway');
          setIsReady(true);
          setIsLoading(false);
        }
        
      } catch (error) {
        console.error('❌ Failed to initialize i18n:', error);
        setIsLoading(false);
        setIsReady(true); // Set ready even on error to prevent infinite loading
      }
    };

    initializeI18n();
  }, [i18n]); // Removed currentLanguage dependency to prevent loops

  // Update loading states from translation loader - disabled to prevent performance issues
  useEffect(() => {
    // Temporarily disable polling for loading states to fix message handler violations
    // This will be re-enabled in V2 with better optimization
    const updateLoadingStates = () => {
      const states = getTranslationLoadingState();
      setLoadingNamespaces(states);
    };

    // Only update once on mount, no polling
    updateLoadingStates();
    
    // Disabled polling to prevent message handler violations
    // const interval = setInterval(updateLoadingStates, 2000); // Would be every 2 seconds if enabled
    // return () => clearInterval(interval);
  }, []);

  // Listen for language changes from i18n
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      // Reduce logging frequency
      if (Math.random() < 0.1) { // Only log 10% of language change events
        console.log('Language changed event:', lng);
      }
      // Force re-render when language changes
      setIsReady(true);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  // Load user's saved language preference on mount and after authentication
  useEffect(() => {
    const loadUserLanguagePreference = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return; // Skip if user is not logged in
        }

        const response = await fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const profile = await response.json();
          if (profile.data?.user?.language && profile.data.user.language !== currentLanguage) {
            console.log('Loading user language preference:', profile.data.user.language);
            await changeLanguage(profile.data.user.language);
          }
        }
      } catch (error) {
        console.warn('Failed to load user language preference:', error);
        // Continue with current language
      }
    };

    if (isReady) {
      loadUserLanguagePreference();
    }
  }, [isReady]); // Removed currentLanguage and changeLanguage from dependencies to prevent infinite loops

  // Enhanced cross-device synchronization using sync service and storage listener
  useEffect(() => {
    const handlePreferenceUpdate = async (preferences: SyncableUserPreferences) => {
      if (preferences.language !== currentLanguage) {
        console.log('Applying language preference from sync:', preferences.language);
        await changeLanguage(preferences.language);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      syncService.handleStorageChange(e);
    };

    const handleWindowFocus = () => {
      syncService.handleWindowFocus();
    };

    // Set up cross-tab language synchronization
    const cleanupStorageListener = setupLanguageStorageListener(async (newLanguage) => {
      if (newLanguage !== currentLanguage) {
        console.log('Language changed in another tab, syncing:', newLanguage);
        await changeLanguage(newLanguage);
      }
    });

    // Start sync service if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      syncService.startPeriodicSync();
      syncService.addUpdateListener(handlePreferenceUpdate);
    }

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      syncService.stopPeriodicSync();
      syncService.removeUpdateListener(handlePreferenceUpdate);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleWindowFocus);
      cleanupStorageListener();
    };
  }, []); // Removed dependencies to prevent infinite loops - this should only run once

  // Context value - memoized to prevent unnecessary re-renders
  const contextValue: I18nContextValue = useMemo(() => ({
    language: currentLanguage,
    changeLanguage,
    t,
    isLoading,
    isReady,
    availableLanguages: SUPPORTED_LANGUAGES,
    loadingNamespaces,
    loadNamespace
  }), [currentLanguage, changeLanguage, t, isLoading, isReady, loadingNamespaces, loadNamespace]);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

// Custom hook to use I18n context
export const useI18n = (): I18nContextValue => {
  const context = useContext(I18nContext);
  
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  
  return context;
};

// Enhanced useTranslation hook with TypeScript support and circuit breaker
export const useAppTranslation = (namespace?: string) => {
  const { t: originalT, i18n } = useTranslation(namespace);
  const { language, changeLanguage, isLoading, isReady, loadNamespace } = useI18n();
  
  // Circuit breaker to prevent excessive translation attempts - using refs to avoid re-renders
  const translationErrorsRef = useRef(0);
  const lastErrorTimeRef = useRef(0);
  const MAX_ERRORS = 5;
  const ERROR_RESET_TIME = 30000; // 30 seconds

  // Auto-load namespace if not available
  useEffect(() => {
    const targetNamespace = namespace || 'common';
    const currentLang = i18n.language || language;
    const availableResources = i18n.store.data[currentLang];
    
    if (isReady && !isLoading && (!availableResources || !availableResources[targetNamespace])) {
      console.log(`🔄 Auto-loading missing namespace: ${targetNamespace} for language: ${currentLang}`);
      console.log(`📊 Available namespaces:`, availableResources ? Object.keys(availableResources) : 'NONE');
      loadNamespace(targetNamespace);
    }
  }, [namespace, language, isReady, isLoading, i18n, loadNamespace]);

  // Typed translation function with circuit breaker
  const t = useCallback((key: string, options?: any) => {
    try {
      // Check circuit breaker
      const now = Date.now();
      if (translationErrorsRef.current >= MAX_ERRORS && (now - lastErrorTimeRef.current) < ERROR_RESET_TIME) {
        // Circuit breaker is open, return fallback
        return options?.defaultValue || key;
      }
      
      // Reset error count if enough time has passed
      if ((now - lastErrorTimeRef.current) > ERROR_RESET_TIME && translationErrorsRef.current > 0) {
        translationErrorsRef.current = 0;
      }
      
      // Don't attempt translation if i18n is not ready or still loading
      if (!isReady || isLoading || !i18n.isInitialized) {
        return options?.defaultValue || key; // Return key as fallback while loading
      }

      // Check if the current language has the required namespace loaded
      const currentLang = i18n.language || language;
      const availableResources = i18n.store.data[currentLang];
      const targetNamespace = namespace || 'common';
      
      if (!availableResources || !availableResources[targetNamespace]) {
        console.warn(`🚫 Namespace ${targetNamespace} not loaded for language ${currentLang}`);
        console.warn(`📊 Available namespaces:`, availableResources ? Object.keys(availableResources) : 'NONE');
        return options?.defaultValue || key;
      }

      const result = originalT(key, options);
      
      // Reset error count on successful translation
      if (result !== key && translationErrorsRef.current > 0) {
        translationErrorsRef.current = 0;
      }
      
      // If result is the same as key, it means translation was not found
      if (result === key && !options?.defaultValue) {
        console.warn(`Translation not found: ${key} in namespace ${targetNamespace} for language ${currentLang}`);
      }
      
      return result;
    } catch (error) {
      // Increment error count
      translationErrorsRef.current += 1;
      lastErrorTimeRef.current = Date.now();
      
      console.warn(`Translation error for key: ${key}`, error);
      return options?.defaultValue || key; // Return key as fallback
    }
  }, [originalT, language, isReady, isLoading, i18n, namespace]);

  return {
    t,
    language,
    changeLanguage,
    isLoading,
    isReady,
    i18n
  };
};

// Legacy hook for backward compatibility - use useLocaleFormatting from hooks instead
export const useLocaleFormatting = () => {
  const { language } = useI18n();

  const formatDate = useCallback((date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const locale = language === 'ne' ? 'ne-NP' : 'en-US';
    
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    }).format(dateObj);
  }, [language]);

  const formatTime = useCallback((date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const locale = language === 'ne' ? 'ne-NP' : 'en-US';
    
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }).format(dateObj);
  }, [language]);

  const formatNumber = useCallback((number: number, options?: Intl.NumberFormatOptions) => {
    const locale = language === 'ne' ? 'ne-NP' : 'en-US';
    
    return new Intl.NumberFormat(locale, options).format(number);
  }, [language]);

  const formatCurrency = useCallback((amount: number, currency: string = 'NPR') => {
    const locale = language === 'ne' ? 'ne-NP' : 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }, [language]);

  return {
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency,
    locale: language === 'ne' ? 'ne-NP' : 'en-US'
  };
};

export default I18nProvider;