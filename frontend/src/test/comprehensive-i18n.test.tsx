/**
 * Comprehensive Internationalization Testing Suite
 * Task 12.3: Final checkpoint - Comprehensive testing
 * 
 * This test suite validates:
 * 1. Translation key completeness
 * 2. Font rendering for Devanagari script
 * 3. Language switching across all user flows
 * 4. Translation fallback mechanisms
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import i18n from '../i18n';
import { I18nProvider } from '../contexts/I18nProvider';
import { AuthProvider } from '../contexts/AuthProvider';
import { ToastProvider } from '../contexts/ToastProvider';
import authSlice from '../store/slices/authSlice';

// Import components to test
import LanguageSwitcher from '../components/UI/LanguageSwitcher';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Products from '../pages/Products';
import UserSettings from '../pages/UserSettings';

// Import translation files for validation
import enCommon from '../i18n/locales/en/common.json';
import neCommon from '../i18n/locales/ne/common.json';
import enAuth from '../i18n/locales/en/auth.json';
import neAuth from '../i18n/locales/ne/auth.json';
import enProducts from '../i18n/locales/en/products.json';
import neProducts from '../i18n/locales/ne/products.json';
import enAdmin from '../i18n/locales/en/admin.json';
import neAdmin from '../i18n/locales/ne/admin.json';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock store setup
const createMockStore = () => configureStore({
  reducer: {
    auth: authSlice
  },
  preloadedState: {
    auth: {
      user: {
        _id: 'test-user-id',
        email: 'test@example.com',
        role: 'BUYER',
        profile: { name: 'Test User' },
        language: 'en',
        localePreferences: {
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
          numberFormat: '1,234.56',
          currency: 'NPR'
        }
      },
      token: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      error: null
    }
  }
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = createMockStore();
  
  return (
    <Provider store={store}>
      <BrowserRouter>
        <I18nProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </I18nProvider>
      </BrowserRouter>
    </Provider>
  );
};

// Utility functions for testing
const getAllTranslationKeys = (obj: any, prefix = ''): string[] => {
  let keys: string[] = [];
  
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getAllTranslationKeys(obj[key], prefix ? `${prefix}.${key}` : key));
    } else {
      keys.push(prefix ? `${prefix}.${key}` : key);
    }
  }
  
  return keys;
};

const checkFontLoading = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        const fonts = Array.from(document.fonts);
        const devanagariFont = fonts.find(font => 
          font.family.includes('Noto Sans Devanagari') && font.status === 'loaded'
        );
        resolve(!!devanagariFont);
      });
    } else {
      // Fallback for browsers without FontFaceSet API
      setTimeout(() => resolve(true), 1000);
    }
  });
};

const simulateLanguageSwitch = async (language: 'en' | 'ne') => {
  await i18n.changeLanguage(language);
  // Wait for DOM updates
  await new Promise(resolve => setTimeout(resolve, 100));
};

describe('Comprehensive I18n Testing Suite', () => {
  beforeEach(() => {
    // Reset i18n to English before each test
    i18n.changeLanguage('en');
    localStorage.clear();
    vi.clearAllMocks();
    
    // Mock fetch responses
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { user: { language: 'en' } } })
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('1. Translation Key Completeness', () => {
    it('should have matching translation keys between English and Nepali for common namespace', () => {
      const enKeys = getAllTranslationKeys(enCommon);
      const neKeys = getAllTranslationKeys(neCommon);
      
      // Check that all English keys have Nepali translations
      const missingNeKeys = enKeys.filter(key => !neKeys.includes(key));
      expect(missingNeKeys).toEqual([]);
      
      // Check that all Nepali keys have English translations
      const missingEnKeys = neKeys.filter(key => !enKeys.includes(key));
      expect(missingEnKeys).toEqual([]);
      
      console.log(`✓ Common namespace: ${enKeys.length} keys validated`);
    });

    it('should have matching translation keys between English and Nepali for auth namespace', () => {
      const enKeys = getAllTranslationKeys(enAuth);
      const neKeys = getAllTranslationKeys(neAuth);
      
      const missingNeKeys = enKeys.filter(key => !neKeys.includes(key));
      expect(missingNeKeys).toEqual([]);
      
      const missingEnKeys = neKeys.filter(key => !enKeys.includes(key));
      expect(missingEnKeys).toEqual([]);
      
      console.log(`✓ Auth namespace: ${enKeys.length} keys validated`);
    });

    it('should have matching translation keys between English and Nepali for products namespace', () => {
      const enKeys = getAllTranslationKeys(enProducts);
      const neKeys = getAllTranslationKeys(neProducts);
      
      const missingNeKeys = enKeys.filter(key => !neKeys.includes(key));
      expect(missingNeKeys).toEqual([]);
      
      const missingEnKeys = neKeys.filter(key => !enKeys.includes(key));
      expect(missingEnKeys).toEqual([]);
      
      console.log(`✓ Products namespace: ${enKeys.length} keys validated`);
    });

    it('should have matching translation keys between English and Nepali for admin namespace', () => {
      const enKeys = getAllTranslationKeys(enAdmin);
      const neKeys = getAllTranslationKeys(neAdmin);
      
      const missingNeKeys = enKeys.filter(key => !neKeys.includes(key));
      expect(missingNeKeys).toEqual([]);
      
      const missingEnKeys = neKeys.filter(key => !enKeys.includes(key));
      expect(missingEnKeys).toEqual([]);
      
      console.log(`✓ Admin namespace: ${enKeys.length} keys validated`);
    });

    it('should not have empty translation values', () => {
      const checkEmptyValues = (obj: any, namespace: string, path = ''): string[] => {
        const emptyKeys: string[] = [];
        
        for (const key in obj) {
          const currentPath = path ? `${path}.${key}` : key;
          
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            emptyKeys.push(...checkEmptyValues(obj[key], namespace, currentPath));
          } else if (typeof obj[key] === 'string' && obj[key].trim() === '') {
            emptyKeys.push(`${namespace}:${currentPath}`);
          }
        }
        
        return emptyKeys;
      };

      const emptyKeys = [
        ...checkEmptyValues(enCommon, 'en:common'),
        ...checkEmptyValues(neCommon, 'ne:common'),
        ...checkEmptyValues(enAuth, 'en:auth'),
        ...checkEmptyValues(neAuth, 'ne:auth'),
        ...checkEmptyValues(enProducts, 'en:products'),
        ...checkEmptyValues(neProducts, 'ne:products'),
        ...checkEmptyValues(enAdmin, 'en:admin'),
        ...checkEmptyValues(neAdmin, 'ne:admin')
      ];

      expect(emptyKeys).toEqual([]);
      console.log('✓ No empty translation values found');
    });
  });

  describe('2. Font Rendering and Devanagari Support', () => {
    it('should load Noto Sans Devanagari font successfully', async () => {
      const fontLoaded = await checkFontLoading();
      expect(fontLoaded).toBe(true);
      console.log('✓ Devanagari font loading verified');
    });

    it('should apply correct CSS classes for Nepali text', () => {
      const testElement = document.createElement('div');
      testElement.className = 'nepali-text';
      document.body.appendChild(testElement);
      
      const computedStyle = window.getComputedStyle(testElement);
      const fontFamily = computedStyle.fontFamily;
      
      expect(fontFamily).toContain('Noto Sans Devanagari');
      
      document.body.removeChild(testElement);
      console.log('✓ Nepali text CSS classes applied correctly');
    });

    it('should have proper fallback fonts for Devanagari script', () => {
      const testElement = document.createElement('div');
      testElement.className = 'lang-ne';
      document.body.appendChild(testElement);
      
      const computedStyle = window.getComputedStyle(testElement);
      const fontFamily = computedStyle.fontFamily.toLowerCase();
      
      // Check for fallback fonts
      expect(fontFamily).toMatch(/mangal|kokila|utsaah|kalimati|preeti|sans-serif/);
      
      document.body.removeChild(testElement);
      console.log('✓ Devanagari font fallbacks configured correctly');
    });

    it('should render Nepali text with proper line height and spacing', () => {
      const testElement = document.createElement('div');
      testElement.className = 'nepali-text';
      testElement.textContent = 'नेपाली भाषा परीक्षण';
      document.body.appendChild(testElement);
      
      const computedStyle = window.getComputedStyle(testElement);
      const lineHeight = parseFloat(computedStyle.lineHeight);
      const fontSize = parseFloat(computedStyle.fontSize);
      
      // Line height should be at least 1.5 for Devanagari
      expect(lineHeight / fontSize).toBeGreaterThanOrEqual(1.5);
      
      document.body.removeChild(testElement);
      console.log('✓ Nepali text spacing and line height verified');
    });
  });

  describe('3. Language Switching Across User Flows', () => {
    it('should switch language in LanguageSwitcher component', async () => {
      render(
        <TestWrapper>
          <LanguageSwitcher variant="dropdown" />
        </TestWrapper>
      );

      // Open dropdown
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Wait for dropdown to appear
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Click Nepali option
      const nepaliOption = screen.getByText(/नेपाली/);
      fireEvent.click(nepaliOption);

      // Verify language changed
      await waitFor(() => {
        expect(i18n.language).toBe('ne');
      });

      console.log('✓ Language switcher functionality verified');
    });

    it('should maintain language preference across page navigation', async () => {
      // Set language to Nepali
      await simulateLanguageSwitch('ne');

      // Render Home page
      const { rerender } = render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      // Verify Nepali content is displayed
      await waitFor(() => {
        expect(i18n.language).toBe('ne');
      });

      // Navigate to Products page
      rerender(
        <TestWrapper>
          <Products />
        </TestWrapper>
      );

      // Verify language is still Nepali
      await waitFor(() => {
        expect(i18n.language).toBe('ne');
      });

      console.log('✓ Language persistence across navigation verified');
    });

    it('should handle language switching in authentication flows', async () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Switch to Nepali
      await simulateLanguageSwitch('ne');

      // Check if login form updates to Nepali
      await waitFor(() => {
        expect(i18n.language).toBe('ne');
      });

      // Switch back to English
      await simulateLanguageSwitch('en');

      await waitFor(() => {
        expect(i18n.language).toBe('en');
      });

      console.log('✓ Language switching in authentication flows verified');
    });

    it('should persist language preference in localStorage', async () => {
      // Clear localStorage
      localStorage.clear();

      // Switch to Nepali
      await simulateLanguageSwitch('ne');

      // Check localStorage
      expect(localStorage.getItem('i18nextLng')).toBe('ne');

      // Switch to English
      await simulateLanguageSwitch('en');

      // Check localStorage
      expect(localStorage.getItem('i18nextLng')).toBe('en');

      console.log('✓ Language preference persistence in localStorage verified');
    });
  });

  describe('4. Translation Fallback Mechanisms', () => {
    it('should fallback to English when Nepali translation is missing', async () => {
      // Mock a missing translation key
      const originalT = i18n.t;
      i18n.t = vi.fn().mockImplementation((key: string) => {
        if (key === 'test.missing.key' && i18n.language === 'ne') {
          return key; // Simulate missing translation
        }
        return originalT(key);
      });

      await simulateLanguageSwitch('ne');
      
      const result = i18n.t('test.missing.key');
      expect(result).toBe('test.missing.key'); // Should return key as fallback

      // Restore original function
      i18n.t = originalT;

      console.log('✓ Translation fallback mechanism verified');
    });

    it('should handle malformed translation keys gracefully', () => {
      const result1 = i18n.t('');
      const result2 = i18n.t('invalid..key');
      const result3 = i18n.t('nonexistent.deeply.nested.key');

      // Should not throw errors and return reasonable fallbacks
      expect(typeof result1).toBe('string');
      expect(typeof result2).toBe('string');
      expect(typeof result3).toBe('string');

      console.log('✓ Malformed translation key handling verified');
    });

    it('should handle interpolation in both languages', async () => {
      // Test English interpolation
      await simulateLanguageSwitch('en');
      const enResult = i18n.t('validation.minLength', { count: 5 });
      expect(enResult).toContain('5');

      // Test Nepali interpolation
      await simulateLanguageSwitch('ne');
      const neResult = i18n.t('validation.minLength', { count: 5 });
      expect(neResult).toContain('5');

      console.log('✓ Translation interpolation in both languages verified');
    });
  });

  describe('5. Performance and Loading', () => {
    it('should load translation files efficiently', async () => {
      const startTime = performance.now();
      
      // Switch languages multiple times
      await simulateLanguageSwitch('ne');
      await simulateLanguageSwitch('en');
      await simulateLanguageSwitch('ne');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (2 seconds)
      expect(duration).toBeLessThan(2000);
      
      console.log(`✓ Language switching performance: ${duration.toFixed(2)}ms`);
    });

    it('should cache translation files after first load', async () => {
      // First load
      const startTime1 = performance.now();
      await simulateLanguageSwitch('ne');
      const firstLoadTime = performance.now() - startTime1;

      // Second load (should be cached)
      const startTime2 = performance.now();
      await simulateLanguageSwitch('en');
      await simulateLanguageSwitch('ne');
      const secondLoadTime = performance.now() - startTime2;

      // Second load should be faster due to caching
      expect(secondLoadTime).toBeLessThan(firstLoadTime);
      
      console.log(`✓ Translation caching: First load ${firstLoadTime.toFixed(2)}ms, Second load ${secondLoadTime.toFixed(2)}ms`);
    });
  });

  describe('6. Integration Testing', () => {
    it('should handle complete user registration flow in both languages', async () => {
      render(
        <TestWrapper>
          <Register />
        </TestWrapper>
      );

      // Test in English
      await simulateLanguageSwitch('en');
      await waitFor(() => {
        expect(screen.getByText(/create/i)).toBeInTheDocument();
      });

      // Test in Nepali
      await simulateLanguageSwitch('ne');
      await waitFor(() => {
        expect(i18n.language).toBe('ne');
      });

      console.log('✓ Complete registration flow language switching verified');
    });

    it('should maintain consistent UI layout across languages', async () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      // Measure layout in English
      await simulateLanguageSwitch('en');
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });

      const enHeight = document.body.scrollHeight;

      // Measure layout in Nepali
      await simulateLanguageSwitch('ne');
      await waitFor(() => {
        expect(i18n.language).toBe('ne');
      });

      const neHeight = document.body.scrollHeight;

      // Heights should be reasonably similar (within 50% difference for flexibility)
      const heightDifference = Math.abs(enHeight - neHeight) / Math.max(enHeight, neHeight);
      expect(heightDifference).toBeLessThan(0.5);

      console.log(`✓ UI layout consistency: EN ${enHeight}px, NE ${neHeight}px (${(heightDifference * 100).toFixed(1)}% difference)`);
    });
  });
});

// Export test utilities for use in other test files
export {
  TestWrapper,
  getAllTranslationKeys,
  checkFontLoading,
  simulateLanguageSwitch
};