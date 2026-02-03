import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { useI18n, useAppTranslation } from '../../contexts/I18nProvider';
import { SupportedLanguage } from '../../i18n';

// Language configuration with flags and labels
const LANGUAGE_CONFIG = {
  en: {
    label: 'English',
    nativeLabel: 'English',
    flag: '🇺🇸',
    code: 'en'
  },
  ne: {
    label: 'Nepali',
    nativeLabel: 'नेपाली',
    flag: '🇳🇵',
    code: 'ne'
  }
} as const;

// Component props interface
interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'toggle' | 'buttons';
  showFlags?: boolean;
  showLabels?: boolean;
  className?: string;
  onLanguageChange?: (language: SupportedLanguage) => void;
  size?: 'sm' | 'md' | 'lg';
  position?: 'left' | 'right';
}

// Dropdown variant component
const DropdownLanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  showFlags = true,
  showLabels = true,
  className = '',
  onLanguageChange,
  size = 'md',
  position = 'right'
}) => {
  const { language, changeLanguage, isLoading, availableLanguages } = useI18n();
  const { t } = useAppTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleLanguageSelect = useCallback(async (lang: SupportedLanguage) => {
    if (lang === language) {
      setIsOpen(false);
      return;
    }

    try {
      await changeLanguage(lang);
      onLanguageChange?.(lang);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }, [language, changeLanguage, onLanguageChange]);

  const currentLangConfig = LANGUAGE_CONFIG[language];
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3'
  };

  const positionClasses = position === 'left' ? 'left-0' : 'right-0';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={`
          inline-flex items-center justify-center w-full rounded-md border border-gray-300 
          shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 
          focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200
          ${sizeClasses[size]}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={String(t('labels.language'))}
      >
        <div className="flex items-center space-x-2">
          {showFlags && (
            <span className="text-lg" role="img" aria-label={currentLangConfig.label}>
              {currentLangConfig.flag}
            </span>
          )}
          {showLabels && (
            <span className="font-medium text-gray-700">
              {currentLangConfig.nativeLabel}
            </span>
          )}
          <Globe className="w-4 h-4 text-gray-500" />
        </div>
        <ChevronDown 
          className={`ml-2 h-4 w-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div 
          className={`
            absolute z-50 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black 
            ring-opacity-5 focus:outline-none ${positionClasses}
          `}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1" role="none">
            {availableLanguages.map((lang) => {
              const langConfig = LANGUAGE_CONFIG[lang];
              const isSelected = lang === language;
              
              return (
                <button
                  key={lang}
                  className={`
                    group flex items-center w-full px-4 py-2 text-sm transition-colors duration-150
                    ${isSelected 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  role="menuitem"
                  onClick={() => handleLanguageSelect(lang)}
                  disabled={isLoading}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {showFlags && (
                      <span className="text-lg" role="img" aria-label={langConfig.label}>
                        {langConfig.flag}
                      </span>
                    )}
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{langConfig.nativeLabel}</span>
                      <span className="text-xs text-gray-500">{langConfig.label}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-primary-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Toggle variant component
const ToggleLanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  showFlags = true,
  className = '',
  onLanguageChange,
  size = 'md'
}) => {
  const { language, changeLanguage, isLoading } = useI18n();

  const handleToggle = useCallback(async () => {
    const newLanguage: SupportedLanguage = language === 'en' ? 'ne' : 'en';
    
    try {
      await changeLanguage(newLanguage);
      onLanguageChange?.(newLanguage);
    } catch (error) {
      console.error('Failed to toggle language:', error);
    }
  }, [language, changeLanguage, onLanguageChange]);

  const currentLangConfig = LANGUAGE_CONFIG[language];
  const nextLang: SupportedLanguage = language === 'en' ? 'ne' : 'en';
  const nextLangConfig = LANGUAGE_CONFIG[nextLang];

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3'
  };

  return (
    <button
      type="button"
      className={`
        inline-flex items-center justify-center rounded-md border border-gray-300 
        shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 
        focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200
        ${sizeClasses[size]}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={`Switch to ${nextLangConfig.label}`}
      title={`Switch to ${nextLangConfig.label}`}
    >
      <div className="flex items-center space-x-2">
        {showFlags && (
          <>
            <span className="text-lg" role="img" aria-label={currentLangConfig.label}>
              {currentLangConfig.flag}
            </span>
            <span className="text-gray-400">→</span>
            <span className="text-lg" role="img" aria-label={nextLangConfig.label}>
              {nextLangConfig.flag}
            </span>
          </>
        )}
        {!showFlags && (
          <span className="font-medium text-gray-700">
            {currentLangConfig.code.toUpperCase()}
          </span>
        )}
      </div>
    </button>
  );
};

// Button variant component
const ButtonLanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  showFlags = true,
  showLabels = false,
  className = '',
  onLanguageChange,
  size = 'md'
}) => {
  const { language, changeLanguage, isLoading, availableLanguages } = useI18n();

  const handleLanguageSelect = useCallback(async (lang: SupportedLanguage) => {
    if (lang === language) return;

    try {
      await changeLanguage(lang);
      onLanguageChange?.(lang);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }, [language, changeLanguage, onLanguageChange]);

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3'
  };

  return (
    <div className={`inline-flex rounded-md shadow-sm ${className}`} role="group">
      {availableLanguages.map((lang, index) => {
        const langConfig = LANGUAGE_CONFIG[lang];
        const isSelected = lang === language;
        const isFirst = index === 0;
        const isLast = index === availableLanguages.length - 1;
        
        return (
          <button
            key={lang}
            type="button"
            className={`
              relative inline-flex items-center border focus:z-10 focus:outline-none 
              focus:ring-2 focus:ring-primary-500 transition-colors duration-200
              ${sizeClasses[size]}
              ${isFirst ? 'rounded-l-md' : ''}
              ${isLast ? 'rounded-r-md' : ''}
              ${!isFirst ? '-ml-px' : ''}
              ${isSelected 
                ? 'bg-primary-600 border-primary-600 text-white z-10' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            onClick={() => handleLanguageSelect(lang)}
            disabled={isLoading}
            aria-pressed={isSelected}
            aria-label={langConfig.label}
          >
            <div className="flex items-center space-x-1">
              {showFlags && (
                <span className="text-lg" role="img" aria-label={langConfig.label}>
                  {langConfig.flag}
                </span>
              )}
              {showLabels && (
                <span className="font-medium">
                  {langConfig.code.toUpperCase()}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

// Main LanguageSwitcher component
const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  ...props
}) => {
  switch (variant) {
    case 'toggle':
      return <ToggleLanguageSwitcher {...props} />;
    case 'buttons':
      return <ButtonLanguageSwitcher {...props} />;
    case 'dropdown':
    default:
      return <DropdownLanguageSwitcher {...props} />;
  }
};

export default LanguageSwitcher;