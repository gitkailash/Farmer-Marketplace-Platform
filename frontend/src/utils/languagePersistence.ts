/**
 * Language Persistence Utility
 * Ensures language preferences are properly saved and restored across browser sessions
 */

import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../i18n';

const LANGUAGE_STORAGE_KEY = 'i18nextLng';

/**
 * Save language preference to localStorage
 */
export const saveLanguagePreference = (language: SupportedLanguage): void => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    console.log('Language preference saved:', language);
  } catch (error) {
    console.warn('Failed to save language preference:', error);
  }
};

/**
 * Get saved language preference from localStorage
 */
export const getSavedLanguagePreference = (): SupportedLanguage | null => {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    
    if (saved && SUPPORTED_LANGUAGES.includes(saved as SupportedLanguage)) {
      console.log('Retrieved saved language preference:', saved);
      return saved as SupportedLanguage;
    }
    
    console.log('No valid saved language preference found');
    return null;
  } catch (error) {
    console.warn('Failed to retrieve language preference:', error);
    return null;
  }
};

/**
 * Clear saved language preference
 */
export const clearLanguagePreference = (): void => {
  try {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    console.log('Language preference cleared');
  } catch (error) {
    console.warn('Failed to clear language preference:', error);
  }
};

/**
 * Ensure language preference is properly persisted
 * This function should be called after successful language changes
 */
export const ensureLanguagePersistence = (language: SupportedLanguage): void => {
  // Save to localStorage
  saveLanguagePreference(language);
  
  // Also set on HTML tag for better detection
  try {
    document.documentElement.lang = language;
    console.log('HTML lang attribute updated:', language);
  } catch (error) {
    console.warn('Failed to update HTML lang attribute:', error);
  }
};

/**
 * Initialize language from saved preference or browser default
 */
export const initializeLanguagePreference = (): SupportedLanguage => {
  // First, try to get from localStorage
  const saved = getSavedLanguagePreference();
  if (saved) {
    return saved;
  }
  
  // Fallback to browser language
  try {
    const browserLang = navigator.language.split('-')[0];
    if (SUPPORTED_LANGUAGES.includes(browserLang as SupportedLanguage)) {
      console.log('Using browser language:', browserLang);
      return browserLang as SupportedLanguage;
    }
  } catch (error) {
    console.warn('Failed to detect browser language:', error);
  }
  
  // Final fallback to English
  console.log('Using default language: en');
  return 'en';
};

/**
 * Listen for storage changes to sync language across tabs
 */
export const setupLanguageStorageListener = (
  onLanguageChange: (language: SupportedLanguage) => void
): (() => void) => {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === LANGUAGE_STORAGE_KEY && event.newValue) {
      const newLanguage = event.newValue;
      if (SUPPORTED_LANGUAGES.includes(newLanguage as SupportedLanguage)) {
        console.log('Language changed in another tab:', newLanguage);
        onLanguageChange(newLanguage as SupportedLanguage);
      }
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};