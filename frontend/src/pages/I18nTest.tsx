import React, { useState, useEffect } from 'react';
import { useI18n } from '../contexts/I18nProvider';
import { LanguageSwitcher } from '../components/UI';
import { loadTranslationNamespace, invalidateTranslationCache, getTranslationCacheStats } from '../i18n';

const I18nTest: React.FC = () => {
  const { language, t, isReady, isLoading, changeLanguage } = useI18n();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>(null);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const updateCacheStats = () => {
    const stats = getTranslationCacheStats();
    setCacheStats(stats);
  };

  useEffect(() => {
    updateCacheStats();
  }, []);

  const runTranslationTest = async () => {
    setIsTestRunning(true);
    setTestResults([]);
    
    try {
      addTestResult('🚀 Starting Translation Management API integration test...');
      
      // Test 1: Load common namespace for English
      addTestResult('📥 Loading common namespace for English...');
      const enCommonLoaded = await loadTranslationNamespace('en', 'common');
      addTestResult(`✅ English common loaded: ${enCommonLoaded ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 2: Load common namespace for Nepali
      addTestResult('📥 Loading common namespace for Nepali...');
      const neCommonLoaded = await loadTranslationNamespace('ne', 'common');
      addTestResult(`✅ Nepali common loaded: ${neCommonLoaded ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 3: Test translation keys from Translation Management
      addTestResult('🔍 Testing translation keys from database...');
      const testKeys = [
        'common.buttons.save',
        'common.buttons.cancel',
        'common.buttons.edit',
        'common.buttons.delete',
        'common.navigation.home',
        'common.navigation.products'
      ];
      
      for (const key of testKeys) {
        const translation = t(key);
        const isTranslated = translation !== key;
        addTestResult(`${isTranslated ? '✅' : '❌'} "${key}": "${translation}"`);
      }
      
      // Test 4: Language switching
      addTestResult('🔄 Testing language switching...');
      const currentLang = language;
      const targetLang = currentLang === 'en' ? 'ne' : 'en';
      
      await changeLanguage(targetLang);
      addTestResult(`🌐 Language changed to: ${targetLang}`);
      
      // Test translations in new language
      addTestResult('🔍 Testing translations in new language...');
      for (const key of testKeys.slice(0, 3)) { // Test first 3 keys
        const translation = t(key);
        const isTranslated = translation !== key;
        addTestResult(`${isTranslated ? '✅' : '❌'} "${key}" in ${targetLang}: "${translation}"`);
      }
      
      // Switch back
      await changeLanguage(currentLang);
      addTestResult(`🔄 Language switched back to: ${currentLang}`);
      
      addTestResult('🎉 Translation Management API integration test completed!');
      
    } catch (error) {
      addTestResult(`❌ Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestRunning(false);
      updateCacheStats();
    }
  };

  const clearCache = async () => {
    try {
      await invalidateTranslationCache();
      addTestResult('🗑️ Translation cache cleared successfully');
      updateCacheStats();
    } catch (error) {
      addTestResult(`❌ Cache clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Loading translations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Translation Management System Test
            </h1>
            <LanguageSwitcher variant="dropdown" showFlags={true} showLabels={true} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - System Status & Controls */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">System Status</h2>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div><strong>Current Language:</strong> {language}</div>
                  <div><strong>i18n Ready:</strong> {isReady ? '✅ Yes' : '❌ No'}</div>
                  <div><strong>Loading:</strong> {isLoading ? '⏳ Yes' : '✅ No'}</div>
                  <div><strong>Test Status:</strong> {isTestRunning ? '🔄 Running...' : '✅ Ready'}</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Cache Statistics</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                  {cacheStats ? (
                    <div className="space-y-1">
                      <div><strong>Memory Entries:</strong> {cacheStats.memory.entries}</div>
                      <div><strong>Cached Keys:</strong> {cacheStats.memory.keys.join(', ') || 'None'}</div>
                    </div>
                  ) : (
                    <div>Loading cache stats...</div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Test Controls</h3>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={runTranslationTest}
                    disabled={isTestRunning}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isTestRunning ? '🔄 Running API Test...' : '🚀 Run API Integration Test'}
                  </button>
                  
                  <button
                    onClick={clearCache}
                    disabled={isTestRunning}
                    className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
                  >
                    🗑️ Clear Translation Cache
                  </button>
                  
                  <button
                    onClick={() => changeLanguage(language === 'en' ? 'ne' : 'en')}
                    disabled={isTestRunning}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    🌐 Switch to {language === 'en' ? 'Nepali' : 'English'}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Live Translation Examples</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Common Buttons:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Save:</strong> {t('common.buttons.save')}</div>
                      <div><strong>Cancel:</strong> {t('common.buttons.cancel')}</div>
                      <div><strong>Edit:</strong> {t('common.buttons.edit')}</div>
                      <div><strong>Delete:</strong> {t('common.buttons.delete')}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Navigation:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Home:</strong> {t('common.navigation.home')}</div>
                      <div><strong>Products:</strong> {t('common.navigation.products')}</div>
                      <div><strong>Profile:</strong> {t('common.navigation.profile')}</div>
                      <div><strong>Settings:</strong> {t('common.navigation.settings')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Test Results */}
            <div>
              <h3 className="text-lg font-semibold mb-3">API Integration Test Results</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm">
                {testResults.length === 0 ? (
                  <p className="text-gray-500">No test results yet. Click "Run API Integration Test" to start.</p>
                ) : (
                  <div className="space-y-1">
                    {testResults.map((result, index) => (
                      <div key={index} className="whitespace-pre-wrap">
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2 text-blue-800">How This Works:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
              <li><strong>Translation Management API:</strong> Translations are now loaded from the database via the Translation Management system</li>
              <li><strong>Fallback System:</strong> If API fails, the system falls back to static JSON files</li>
              <li><strong>Caching:</strong> Translations are cached in memory and IndexedDB for performance</li>
              <li><strong>Live Updates:</strong> When admins update translations, they can be refreshed without app restart</li>
              <li><strong>Language Switching:</strong> Users can switch between English and Nepali dynamically</li>
            </ol>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold mb-2 text-green-800">Next Steps:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
              <li>Add translations via the Admin Panel at <code>/admin/translations</code></li>
              <li>Test language switching in real components like dashboards</li>
              <li>Replace hardcoded text in components with translation keys</li>
              <li>Set up cache invalidation when translations are updated</li>
            </ul>
            
            <div className="mt-4">
              <a 
                href="/dashboard-example" 
                className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                📖 View Dashboard Translation Example
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default I18nTest;