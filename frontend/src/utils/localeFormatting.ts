import { ILocalePreferences } from '../types/api';

// Supported locales
export const SUPPORTED_LOCALES = {
  'en': 'en-US',
  'ne': 'ne-NP'
} as const;

// Default locale preferences
export const DEFAULT_LOCALE_PREFERENCES: ILocalePreferences = {
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  numberFormat: '1,234.56',
  currency: 'NPR'
};

// Date format patterns
export const DATE_FORMAT_PATTERNS = {
  'DD/MM/YYYY': { day: '2-digit', month: '2-digit', year: 'numeric' },
  'MM/DD/YYYY': { month: '2-digit', day: '2-digit', year: 'numeric' },
  'YYYY-MM-DD': { year: 'numeric', month: '2-digit', day: '2-digit' },
  'DD-MM-YYYY': { day: '2-digit', month: '2-digit', year: 'numeric' }
} as const;

// Time format patterns
export const TIME_FORMAT_PATTERNS = {
  '12h': { hour: '2-digit', minute: '2-digit', hour12: true },
  '24h': { hour: '2-digit', minute: '2-digit', hour12: false }
} as const;

// Number format configurations
export const NUMBER_FORMAT_CONFIGS = {
  '1,234.56': { useGrouping: true, minimumFractionDigits: 0, maximumFractionDigits: 2 },
  '1.234,56': { useGrouping: true, minimumFractionDigits: 0, maximumFractionDigits: 2 },
  '1 234,56': { useGrouping: true, minimumFractionDigits: 0, maximumFractionDigits: 2 },
  '1234.56': { useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 2 }
} as const;

/**
 * Locale formatting utility class
 */
export class LocaleFormatter {
  private language: 'en' | 'ne';
  private preferences: ILocalePreferences;
  private locale: string;

  constructor(language: 'en' | 'ne', preferences?: Partial<ILocalePreferences>) {
    this.language = language;
    this.preferences = { ...DEFAULT_LOCALE_PREFERENCES, ...preferences };
    this.locale = SUPPORTED_LOCALES[language];
  }

  /**
   * Format date according to user preferences
   */
  formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date');
      }

      const formatPattern = DATE_FORMAT_PATTERNS[this.preferences.dateFormat];
      const formatOptions = { ...formatPattern, ...options };

      return new Intl.DateTimeFormat(this.locale, formatOptions).format(dateObj);
    } catch (error) {
      console.warn('Date formatting error:', error);
      return String(date);
    }
  }

  /**
   * Format time according to user preferences
   */
  formatTime(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date');
      }

      const formatPattern = TIME_FORMAT_PATTERNS[this.preferences.timeFormat];
      const formatOptions = { ...formatPattern, ...options };

      return new Intl.DateTimeFormat(this.locale, formatOptions).format(dateObj);
    } catch (error) {
      console.warn('Time formatting error:', error);
      return String(date);
    }
  }

  /**
   * Format datetime according to user preferences
   */
  formatDateTime(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date');
      }

      const datePattern = DATE_FORMAT_PATTERNS[this.preferences.dateFormat];
      const timePattern = TIME_FORMAT_PATTERNS[this.preferences.timeFormat];
      const formatOptions = { ...datePattern, ...timePattern, ...options };

      return new Intl.DateTimeFormat(this.locale, formatOptions).format(dateObj);
    } catch (error) {
      console.warn('DateTime formatting error:', error);
      return String(date);
    }
  }

  /**
   * Format number according to user preferences
   */
  formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    try {
      if (typeof number !== 'number' || isNaN(number)) {
        throw new Error('Invalid number');
      }

      const formatConfig = NUMBER_FORMAT_CONFIGS[this.preferences.numberFormat];
      const formatOptions = { ...formatConfig, ...options };

      // Handle different number format styles
      let formatted = new Intl.NumberFormat(this.locale, formatOptions).format(number);

      // Apply custom formatting based on user preference
      if (this.preferences.numberFormat === '1.234,56') {
        // European style: swap comma and period
        formatted = formatted.replace(/,/g, 'TEMP').replace(/\./g, ',').replace(/TEMP/g, '.');
      } else if (this.preferences.numberFormat === '1 234,56') {
        // French style: space as thousand separator, comma as decimal
        formatted = formatted.replace(/,/g, ' ').replace(/\./, ',');
      }

      return formatted;
    } catch (error) {
      console.warn('Number formatting error:', error);
      return String(number);
    }
  }

  /**
   * Format currency according to user preferences
   */
  formatCurrency(amount: number, currency?: string, options?: Intl.NumberFormatOptions): string {
    try {
      if (typeof amount !== 'number' || isNaN(amount)) {
        throw new Error('Invalid amount');
      }

      const currencyCode = currency || this.preferences.currency;
      const formatOptions: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options
      };

      return new Intl.NumberFormat(this.locale, formatOptions).format(amount);
    } catch (error) {
      console.warn('Currency formatting error:', error);
      // Fallback to simple format
      const currencyCode = currency || this.preferences.currency;
      return `${currencyCode} ${this.formatNumber(amount)}`;
    }
  }

  /**
   * Format percentage
   */
  formatPercentage(value: number, options?: Intl.NumberFormatOptions): string {
    try {
      if (typeof value !== 'number' || isNaN(value)) {
        throw new Error('Invalid percentage value');
      }

      const formatOptions: Intl.NumberFormatOptions = {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        ...options
      };

      return new Intl.NumberFormat(this.locale, formatOptions).format(value);
    } catch (error) {
      console.warn('Percentage formatting error:', error);
      return `${this.formatNumber(value * 100)}%`;
    }
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelativeTime(date: Date | string | number): string {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date');
      }

      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

      // Use Intl.RelativeTimeFormat if available
      if (typeof Intl.RelativeTimeFormat !== 'undefined') {
        const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: 'auto' });

        if (Math.abs(diffInSeconds) < 60) {
          return rtf.format(-diffInSeconds, 'second');
        } else if (Math.abs(diffInSeconds) < 3600) {
          return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
        } else if (Math.abs(diffInSeconds) < 86400) {
          return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
        } else if (Math.abs(diffInSeconds) < 2592000) {
          return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
        } else if (Math.abs(diffInSeconds) < 31536000) {
          return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
        } else {
          return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
        }
      }

      // Fallback for older browsers
      return this.formatDateTime(dateObj);
    } catch (error) {
      console.warn('Relative time formatting error:', error);
      return this.formatDateTime(date);
    }
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    try {
      if (typeof bytes !== 'number' || bytes < 0) {
        throw new Error('Invalid file size');
      }

      const units = this.language === 'ne' 
        ? ['बाइट', 'केबी', 'एमबी', 'जीबी', 'टीबी']
        : ['bytes', 'KB', 'MB', 'GB', 'TB'];

      if (bytes === 0) return `0 ${units[0]}`;

      const k = 1024;
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      const size = bytes / Math.pow(k, i);

      return `${this.formatNumber(size, { maximumFractionDigits: 1 })} ${units[i]}`;
    } catch (error) {
      console.warn('File size formatting error:', error);
      return `${bytes} bytes`;
    }
  }

  /**
   * Get locale-specific configuration
   */
  getLocaleConfig() {
    return {
      language: this.language,
      locale: this.locale,
      preferences: this.preferences,
      isRTL: false, // Neither English nor Nepali are RTL
      decimalSeparator: this.preferences.numberFormat.includes(',') ? ',' : '.',
      thousandSeparator: this.preferences.numberFormat.includes(',') ? '.' : ',',
      currencySymbol: this.getCurrencySymbol()
    };
  }

  /**
   * Get currency symbol
   */
  private getCurrencySymbol(): string {
    try {
      const formatter = new Intl.NumberFormat(this.locale, {
        style: 'currency',
        currency: this.preferences.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      
      // Extract symbol from formatted zero
      const formatted = formatter.format(0);
      return formatted.replace(/[\d\s]/g, '').trim();
    } catch (error) {
      // Fallback symbols
      const symbols: Record<string, string> = {
        'NPR': 'रू',
        'USD': '$',
        'EUR': '€'
      };
      return symbols[this.preferences.currency] || this.preferences.currency;
    }
  }

  /**
   * Update preferences
   */
  updatePreferences(newPreferences: Partial<ILocalePreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
  }

  /**
   * Update language
   */
  updateLanguage(language: 'en' | 'ne'): void {
    this.language = language;
    this.locale = SUPPORTED_LOCALES[language];
  }
}

/**
 * Create a locale formatter instance
 */
export function createLocaleFormatter(
  language: 'en' | 'ne',
  preferences?: Partial<ILocalePreferences>
): LocaleFormatter {
  return new LocaleFormatter(language, preferences);
}

/**
 * Utility functions for common formatting tasks
 */
export const localeUtils = {
  /**
   * Get default preferences for a language
   */
  getDefaultPreferences(language: 'en' | 'ne'): ILocalePreferences {
    if (language === 'ne') {
      return {
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        numberFormat: '1,234.56',
        currency: 'NPR'
      };
    }
    return DEFAULT_LOCALE_PREFERENCES;
  },

  /**
   * Validate locale preferences
   */
  validatePreferences(preferences: Partial<ILocalePreferences>): boolean {
    const validDateFormats = Object.keys(DATE_FORMAT_PATTERNS);
    const validTimeFormats = Object.keys(TIME_FORMAT_PATTERNS);
    const validNumberFormats = Object.keys(NUMBER_FORMAT_CONFIGS);
    const validCurrencies = ['NPR', 'USD', 'EUR'];

    if (preferences.dateFormat && !validDateFormats.includes(preferences.dateFormat)) {
      return false;
    }
    if (preferences.timeFormat && !validTimeFormats.includes(preferences.timeFormat)) {
      return false;
    }
    if (preferences.numberFormat && !validNumberFormats.includes(preferences.numberFormat)) {
      return false;
    }
    if (preferences.currency && !validCurrencies.includes(preferences.currency)) {
      return false;
    }

    return true;
  },

  /**
   * Get locale-specific examples
   */
  getFormatExamples(language: 'en' | 'ne', preferences: ILocalePreferences) {
    const formatter = new LocaleFormatter(language, preferences);
    const sampleDate = new Date('2024-03-15T14:30:00');
    const sampleNumber = 1234.56;
    const sampleCurrency = 1500.75;

    return {
      date: formatter.formatDate(sampleDate),
      time: formatter.formatTime(sampleDate),
      dateTime: formatter.formatDateTime(sampleDate),
      number: formatter.formatNumber(sampleNumber),
      currency: formatter.formatCurrency(sampleCurrency),
      percentage: formatter.formatPercentage(0.1234),
      fileSize: formatter.formatFileSize(1048576) // 1MB
    };
  }
};

export default LocaleFormatter;