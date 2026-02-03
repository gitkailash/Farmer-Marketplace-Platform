import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nProvider';
import { useAuth } from '../../contexts/AuthProvider';
import Button from './Button';

interface OnboardingWelcomeProps {
  onComplete: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

export const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({
  onComplete,
  onSkip,
  showSkip = true
}) => {
  const { language, t, changeLanguage } = useI18n();
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ne'>(language);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync selected language with current i18n language
  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  const handleLanguageChange = async (newLanguage: 'en' | 'ne') => {
    try {
      setSelectedLanguage(newLanguage);
      await changeLanguage(newLanguage);
    } catch (error) {
      console.error('Failed to change language during onboarding:', error);
    }
  };

  const handleComplete = async () => {
    try {
      setIsUpdating(true);
      
      // Ensure language preference is saved to user profile
      if (selectedLanguage !== user?.language) {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch('/api/auth/profile', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              language: selectedLanguage,
              localePreferences: {
                dateFormat: 'DD/MM/YYYY',
                timeFormat: '24h',
                numberFormat: '1,234.56',
                currency: 'NPR'
              }
            })
          });

          if (!response.ok) {
            console.warn('Failed to update language preference in profile');
          }
        }
      }

      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Still complete onboarding even if profile update fails
      onComplete();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v10a2 2 0 002 2h6a2 2 0 002-2V8M9 12h6" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t('auth.onboarding.welcome', 'Welcome to Farmer Marketplace!')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {user?.profile?.name && (
              <>
                {t('auth.onboarding.greeting', 'Hello')}, {user.profile.name}! 
              </>
            )}
            {t('auth.onboarding.subtitle', 'Let\'s set up your preferences to get started.')}
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-lg space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t('auth.onboarding.languageTitle', 'Choose Your Preferred Language')}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('auth.onboarding.languageDescription', 'Select the language you\'d like to use throughout the platform. You can change this later in your settings.')}
            </p>
            
            <div className="space-y-3">
              <div 
                className={`relative rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedLanguage === 'en' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleLanguageChange('en')}
              >
                <div className="p-4 flex items-center">
                  <input
                    type="radio"
                    name="language"
                    value="en"
                    checked={selectedLanguage === 'en'}
                    onChange={() => handleLanguageChange('en')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <div className="ml-3 flex items-center">
                    <span className="text-2xl mr-3">🇺🇸</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {t('common.languages.english', 'English')}
                      </div>
                      <div className="text-xs text-gray-500">
                        English (United States)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div 
                className={`relative rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedLanguage === 'ne' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleLanguageChange('ne')}
              >
                <div className="p-4 flex items-center">
                  <input
                    type="radio"
                    name="language"
                    value="ne"
                    checked={selectedLanguage === 'ne'}
                    onChange={() => handleLanguageChange('ne')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <div className="ml-3 flex items-center">
                    <span className="text-2xl mr-3">🇳🇵</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900 nepali-text">
                        {t('common.languages.nepali', 'नेपाली (Nepali)')}
                      </div>
                      <div className="text-xs text-gray-500">
                        नेपाली (Nepal)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <Button
              onClick={handleComplete}
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('auth.onboarding.saving', 'Saving preferences...')}
                </div>
              ) : (
                t('auth.onboarding.continue', 'Continue to Dashboard')
              )}
            </Button>
            
            {showSkip && (
              <button
                onClick={handleSkip}
                disabled={isUpdating}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {t('auth.onboarding.skip', 'Skip for now')}
              </button>
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            {t('auth.onboarding.helpText', 'Need help? You can change these settings anytime in your profile.')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWelcome;