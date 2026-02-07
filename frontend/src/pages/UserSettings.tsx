import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { useI18n, useAppTranslation } from '../contexts/I18nProvider';
import { useLocaleFormatting } from '../hooks/useLocaleFormatting';
import { useCrossDeviceSync, SyncableUserPreferences } from '../services/syncService';
import { DashboardLayout } from '../components/UI';
import { LoadingSpinner, Button } from '../components/UI';

// Types for user preferences
interface LocalePreferences {
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY';
  timeFormat: '12h' | '24h';
  numberFormat: '1,234.56' | '1.234,56' | '1 234,56' | '1234.56';
  currency: 'NPR' | 'USD' | 'EUR';
}

interface UserSettingsData {
  language: 'en' | 'ne';
  localePreferences: LocalePreferences;
}

// Sync status type
type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

// Simple Toast Component
interface SimpleToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

const SimpleToast: React.FC<SimpleToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return { bg: 'bg-green-50 border-green-200', text: 'text-green-800', icon: '✅' };
      case 'error':
        return { bg: 'bg-red-50 border-red-200', text: 'text-red-800', icon: '❌' };
      case 'warning':
        return { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', icon: '⚠️' };
      case 'info':
        return { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', icon: 'ℹ️' };
      default:
        return { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-800', icon: 'ℹ️' };
    }
  };

  const styles = getToastStyles();

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${styles.bg} border rounded-lg shadow-lg p-4`}>
      <div className="flex items-center">
        <span className="text-lg mr-3">{styles.icon}</span>
        <p className={`text-sm font-medium ${styles.text} flex-1`}>{message}</p>
        <button
          onClick={onClose}
          className="ml-3 text-gray-400 hover:text-gray-600"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Sync Status Indicator Component
interface SyncStatusIndicatorProps {
  status: SyncStatus;
  lastSyncTime?: Date;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ status, lastSyncTime }) => {
  const { t } = useAppTranslation();

  const getStatusDisplay = () => {
    switch (status) {
      case 'syncing':
        return {
          icon: (
            <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ),
          text: t('common.settings.syncStatus.syncing') as string,
          color: 'text-blue-600'
        };
      case 'success':
        return {
          icon: (
            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ),
          text: t('common.settings.syncStatus.synced') as string,
          color: 'text-green-600'
        };
      case 'error':
        return {
          icon: (
            <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
          text: t('common.settings.syncStatus.error') as string,
          color: 'text-red-600'
        };
      default:
        return {
          icon: (
            <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          ),
          text: t('common.settings.syncStatus.idle') as string,
          color: 'text-gray-500'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="flex items-center space-x-2 text-sm">
      {statusDisplay.icon}
      <span className={statusDisplay.color}>{statusDisplay.text}</span>
      {lastSyncTime && status === 'success' && (
        <span className="text-gray-400">
          • {t('common.settings.lastSync') as string}: {lastSyncTime.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

const UserSettings: React.FC = () => {
  const { user, refreshAuth } = useAuth();
  const { language, changeLanguage, availableLanguages } = useI18n();
  const { t } = useAppTranslation();
  const { formatDate, formatTime, formatNumber, formatCurrency } = useLocaleFormatting();
  const { startSync, stopSync, forceSync, syncToServer, getSyncStatus, addListener, removeListener } = useCrossDeviceSync();

  // State management
  const [settings, setSettings] = useState<UserSettingsData>({
    language: language,
    localePreferences: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      numberFormat: '1,234.56',
      currency: 'NPR'
    }
  });
  const [originalSettings, setOriginalSettings] = useState<UserSettingsData>(settings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | undefined>(undefined);

  // Load user settings on component mount
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        if (user) {
          const userSettings: UserSettingsData = {
            language: user.language || 'en',
            localePreferences: user.localePreferences || {
              dateFormat: 'DD/MM/YYYY',
              timeFormat: '24h',
              numberFormat: '1,234.56',
              currency: 'NPR'
            }
          };
          setSettings(userSettings);
          setOriginalSettings(userSettings);
          
          // Set last sync time based on user's lastLanguageUpdate
          if (user.lastLanguageUpdate) {
            setLastSyncTime(new Date(user.lastLanguageUpdate));
            setSyncStatus('success');
          }
        }
      } catch (error) {
        console.error('Failed to load user settings:', error);
        setToast({ message: t('errors.serverError') as string, type: 'error' });
        setSyncStatus('error');
      } finally {
        setLoading(false);
      }
    };

    loadUserSettings();
  }, [user, t]);

  // Check for changes
  useEffect(() => {
    const hasSettingsChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(hasSettingsChanged);
    
    // Update sync status when changes are detected
    if (hasSettingsChanged && syncStatus === 'success') {
      setSyncStatus('idle');
    }
  }, [settings, originalSettings, syncStatus]);

  // Handle language change
  const handleLanguageChange = useCallback(async (newLanguage: 'en' | 'ne') => {
    setSettings(prev => ({ ...prev, language: newLanguage }));
  }, []);

  // Handle locale preference changes
  const handleLocaleChange = useCallback((key: keyof LocalePreferences, value: string) => {
    setSettings(prev => ({
      ...prev,
      localePreferences: {
        ...prev.localePreferences,
        [key]: value
      }
    }));
  }, []);

  // Save settings with enhanced sync status tracking
  const handleSaveSettings = useCallback(async () => {
    if (!hasChanges) return;

    setSaving(true);
    setSyncStatus('syncing');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Update language in i18n context if changed
      if (settings.language !== language) {
        await changeLanguage(settings.language);
      }

      // Update user profile via API
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          language: settings.language,
          localePreferences: settings.localePreferences
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update settings');
      }

      // Refresh auth state to get updated user data
      await refreshAuth();

      // Update original settings to reflect saved state
      setOriginalSettings(settings);
      setLastSyncTime(new Date());
      setSyncStatus('success');
      setToast({ message: t('common.settings.settingsUpdated') as string, type: 'success' });

    } catch (error) {
      console.error('Failed to save settings:', error);
      setSyncStatus('error');
      
      // Provide more specific error messages
      let errorMessage = t('errors.serverError') as string;
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          errorMessage = t('errors.authenticationRequired') as string;
        } else if (error.message.includes('network')) {
          errorMessage = t('errors.networkError') as string;
        }
      }
      
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [settings, hasChanges, language, changeLanguage, refreshAuth, t]);

  // Reset to defaults
  const handleResetToDefaults = useCallback(() => {
    if (window.confirm(t('common.settings.resetConfirm') as string)) {
      const defaultSettings: UserSettingsData = {
        language: 'en',
        localePreferences: {
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
          numberFormat: '1,234.56',
          currency: 'NPR'
        }
      };
      setSettings(defaultSettings);
      setSyncStatus('idle');
    }
  }, [t]);

  // Manual sync function for retry scenarios
  const handleManualSync = useCallback(async () => {
    if (!hasChanges) {
      // Just refresh the auth state to check for updates from other devices
      setSyncStatus('syncing');
      try {
        await refreshAuth();
        setSyncStatus('success');
        setLastSyncTime(new Date());
        setToast({ message: t('common.settings.syncRefreshed') as string, type: 'info' });
      } catch (error) {
        setSyncStatus('error');
        setToast({ message: t('common.settings.syncFailed') as string, type: 'error' });
      }
    } else {
      // Save current changes
      await handleSaveSettings();
    }
  }, [hasChanges, refreshAuth, handleSaveSettings, t]);

  // Sample data for preview
  const sampleDate = new Date('2024-12-31T14:30:00');
  const sampleNumber = 1234.56;
  const samplePrice = 1500.75;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('common.settings.title') as string}
          </h1>
          <p className="text-gray-600">
            {t('common.settings.syncDescription') as string}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Form */}
          <div className="space-y-8">
            {/* Language Preferences */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('common.settings.languagePreferences') as string}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('common.settings.currentLanguage') as string}
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleLanguageChange(e.target.value as 'en' | 'ne')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {availableLanguages.map((lang) => (
                      <option key={lang} value={lang}>
                        {t(`common.languages.${lang}`) as string}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Locale Preferences */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('common.settings.localePreferences') as string}
              </h2>
              
              <div className="space-y-4">
                {/* Date Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('common.settings.dateFormat') as string}
                  </label>
                  <select
                    value={settings.localePreferences.dateFormat}
                    onChange={(e) => handleLocaleChange('dateFormat', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                    <option value="DD-MM-YYYY">DD-MM-YYYY (31-12-2024)</option>
                  </select>
                </div>

                {/* Time Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('common.settings.timeFormat') as string}
                  </label>
                  <select
                    value={settings.localePreferences.timeFormat}
                    onChange={(e) => handleLocaleChange('timeFormat', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="12h">12-hour (2:30 PM)</option>
                    <option value="24h">24-hour (14:30)</option>
                  </select>
                </div>

                {/* Number Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('common.settings.numberFormat') as string}
                  </label>
                  <select
                    value={settings.localePreferences.numberFormat}
                    onChange={(e) => handleLocaleChange('numberFormat', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="1,234.56">1,234.56</option>
                    <option value="1.234,56">1.234,56</option>
                    <option value="1 234,56">1 234,56</option>
                    <option value="1234.56">1234.56</option>
                  </select>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('common.settings.currency') as string}
                  </label>
                  <select
                    value={settings.localePreferences.currency}
                    onChange={(e) => handleLocaleChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="NPR">Nepali Rupee (NPR)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleSaveSettings}
                disabled={!hasChanges || saving}
                loading={saving}
                className="flex-1"
              >
                {t('common.settings.saveChanges') as string}
              </Button>
              
              <Button
                onClick={handleResetToDefaults}
                variant="outline"
                disabled={saving}
                className="flex-1"
              >
                {t('common.settings.resetToDefaults') as string}
              </Button>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('common.settings.previewSection') as string}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('common.settings.previewDescription') as string}
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">
                  {t('common.settings.sampleDate') as string}:
                </span>
                <span className="text-sm text-gray-900">
                  {formatDate(sampleDate)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">
                  {t('common.settings.sampleTime') as string}:
                </span>
                <span className="text-sm text-gray-900">
                  {formatTime(sampleDate)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">
                  {t('common.settings.sampleNumber') as string}:
                </span>
                <span className="text-sm text-gray-900">
                  {formatNumber(sampleNumber)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-700">
                  {t('common.settings.sampleCurrency') as string}:
                </span>
                <span className="text-sm text-gray-900">
                  {formatCurrency(samplePrice, settings.localePreferences.currency)}
                </span>
              </div>
            </div>

            {/* Sync Info with Status Indicator */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-blue-800">
                      {t('common.settings.syncAcrossDevices') as string}
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      {t('common.settings.syncDescription') as string}
                    </p>
                  </div>
                </div>
                
                {/* Manual sync button for error states */}
                {syncStatus === 'error' && (
                  <button
                    onClick={handleManualSync}
                    disabled={saving}
                    className="ml-3 text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {t('common.settings.retrySync') as string}
                  </button>
                )}
              </div>
              
              {/* Sync Status Indicator */}
              <div className="mt-3 pt-3 border-t border-blue-200">
                <SyncStatusIndicator status={syncStatus} lastSyncTime={lastSyncTime} />
              </div>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <SimpleToast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserSettings;