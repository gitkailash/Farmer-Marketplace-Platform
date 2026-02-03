import { useMemo, useCallback } from 'react';
import { useI18n } from '../contexts/I18nProvider';
import { useAuth } from '../contexts/AuthProvider';
import { LocaleFormatter, createLocaleFormatter } from '../utils/localeFormatting';
import { ILocalePreferences } from '../types/api';

// Hook for accessing user's locale preferences
export function useUserLocalePreferences(): ILocalePreferences | null {
  const { user } = useAuth();
  
  // Return user's locale preferences if available
  return user?.localePreferences || null;
}

/**
 * Hook for locale-aware formatting
 */
export function useLocaleFormatting() {
  const { language } = useI18n();
  const userPreferences = useUserLocalePreferences();

  // Create formatter instance with memoization
  const formatter = useMemo(() => {
    return createLocaleFormatter(language, userPreferences || undefined);
  }, [language, userPreferences]);

  // Memoized formatting functions
  const formatDate = useCallback((date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
    return formatter.formatDate(date, options);
  }, [formatter]);

  const formatTime = useCallback((date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
    return formatter.formatTime(date, options);
  }, [formatter]);

  const formatDateTime = useCallback((date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
    return formatter.formatDateTime(date, options);
  }, [formatter]);

  const formatNumber = useCallback((number: number, options?: Intl.NumberFormatOptions) => {
    return formatter.formatNumber(number, options);
  }, [formatter]);

  const formatCurrency = useCallback((amount: number, currency?: string, options?: Intl.NumberFormatOptions) => {
    return formatter.formatCurrency(amount, currency, options);
  }, [formatter]);

  const formatPercentage = useCallback((value: number, options?: Intl.NumberFormatOptions) => {
    return formatter.formatPercentage(value, options);
  }, [formatter]);

  const formatRelativeTime = useCallback((date: Date | string | number) => {
    return formatter.formatRelativeTime(date);
  }, [formatter]);

  const formatFileSize = useCallback((bytes: number) => {
    return formatter.formatFileSize(bytes);
  }, [formatter]);

  // Get locale configuration
  const localeConfig = useMemo(() => {
    return formatter.getLocaleConfig();
  }, [formatter]);

  return {
    // Formatting functions
    formatDate,
    formatTime,
    formatDateTime,
    formatNumber,
    formatCurrency,
    formatPercentage,
    formatRelativeTime,
    formatFileSize,
    
    // Configuration
    localeConfig,
    language,
    
    // Direct access to formatter for advanced usage
    formatter
  };
}

/**
 * Hook for formatting with custom preferences (useful for admin interfaces)
 */
export function useCustomLocaleFormatting(
  language: 'en' | 'ne',
  preferences?: Partial<ILocalePreferences>
) {
  const formatter = useMemo(() => {
    return createLocaleFormatter(language, preferences);
  }, [language, preferences]);

  const formatDate = useCallback((date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
    return formatter.formatDate(date, options);
  }, [formatter]);

  const formatTime = useCallback((date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
    return formatter.formatTime(date, options);
  }, [formatter]);

  const formatDateTime = useCallback((date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
    return formatter.formatDateTime(date, options);
  }, [formatter]);

  const formatNumber = useCallback((number: number, options?: Intl.NumberFormatOptions) => {
    return formatter.formatNumber(number, options);
  }, [formatter]);

  const formatCurrency = useCallback((amount: number, currency?: string, options?: Intl.NumberFormatOptions) => {
    return formatter.formatCurrency(amount, currency, options);
  }, [formatter]);

  const formatPercentage = useCallback((value: number, options?: Intl.NumberFormatOptions) => {
    return formatter.formatPercentage(value, options);
  }, [formatter]);

  const formatRelativeTime = useCallback((date: Date | string | number) => {
    return formatter.formatRelativeTime(date);
  }, [formatter]);

  const formatFileSize = useCallback((bytes: number) => {
    return formatter.formatFileSize(bytes);
  }, [formatter]);

  return {
    formatDate,
    formatTime,
    formatDateTime,
    formatNumber,
    formatCurrency,
    formatPercentage,
    formatRelativeTime,
    formatFileSize,
    formatter
  };
}

export default useLocaleFormatting;