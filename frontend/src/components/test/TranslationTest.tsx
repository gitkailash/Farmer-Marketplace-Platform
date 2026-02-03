import React, { useState, useEffect } from 'react';
import { useAppTranslation } from '../../contexts/I18nProvider';
import { loadTranslationNamespace, invalidateTranslationCache } from '../../i18n';

const TranslationTest: React.FC = () => {
  const { t, language, changeLanguage, isLoading, isReady } = useAppTranslation();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTranslationTest = async () => {
    setIsTestRunning(true);
    setTestResults([]);
    
    try {
      addTestResult('Starting translation integration test...');
      
      // Test 1: Load common namespace for English
      addTestResult('Loading common namespace for English...');
      const enCommonLoaded = await loadTranslationNamespace('en', 'common');
      addTestResult(`English common loaded: ${enCommonLoaded ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 2: Load common namespace for Nepali
      addTestResult('Loading common namespace for Nepali...');
      const neCommonLoaded = await loadTranslationNamespace('ne', 'common');
      addTestResult(`Nepali common loaded: ${neCommonLoaded ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 3: Test translation keys
      addTestResult('Testing translation keys...');
      const testKeys = [
        'common.buttons.save',
        'common.buttons.cancel',
        'common.buttons.edit',
        'common.buttons.delete'
      ];
      
      for (const key of testKeys) {
        const translation = t(key);
        addTestResult(`Key "${key}": "${translation}"`);
      }
      
      // Test 4: Language switching
      addTestResult('Testing language switching...');
      const currentLang = language;
      const targetLang = currentLang === 'en' ? 'ne' : 'en';
      
      await changeLanguage(targetLang);
      addTestResult(`Language changed to: ${targetLang}`);
      
      // Test translations in new language
      for (const key of testKeys) {
        const translation = t(key);
        addTestResult(`Key "${key}" in ${targetLang}: "${translation}"`);
      }
      
      // Switch back
      await changeLanguage(currentLang);
      addTestResult(`Language switched back to: ${currentLang}`);
      
      addTestResult('Translation integration test completed!');
      
    } catch (error) {
      addTestResult(`Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestRunning(false);
    }
  };

  const clearCache = async () => {
    try {
      await invalidateTranslationCache();
      addTestResult('Translation cache cleared successfully');
    } catch (error) {
      addTestResult(`Cache clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Translation System Integration Test</h2>
        
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <strong>Current Language:</strong> {language}
            </div>
            <div>
              <strong>i18n Ready:</strong> {isReady ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Test Status:</strong> {isTestRunning ? 'Running...' : 'Ready'}
            </div>
          </div>
          
          <div className="flex gap-4 mb-4">
            <button
              onClick={runTranslationTest}
              disabled={isTestRunning}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isTestRunning ? 'Running Test...' : 'Run Translation Test'}
            </button>
            
            <button
              onClick={clearCache}
              disabled={isTestRunning}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
            >
              Clear Cache
            </button>
            
            <button
              onClick={() => changeLanguage(language === 'en' ? 'ne' : 'en')}
              disabled={isTestRunning}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Switch to {language === 'en' ? 'Nepali' : 'English'}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Sample Translations</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Common Buttons:</h4>
              <ul className="space-y-1 text-sm">
                <li><strong>Save:</strong> {t('common.buttons.save')}</li>
                <li><strong>Cancel:</strong> {t('common.buttons.cancel')}</li>
                <li><strong>Edit:</strong> {t('common.buttons.edit')}</li>
                <li><strong>Delete:</strong> {t('common.buttons.delete')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Navigation:</h4>
              <ul className="space-y-1 text-sm">
                <li><strong>Home:</strong> {t('common.navigation.home')}</li>
                <li><strong>Products:</strong> {t('common.navigation.products')}</li>
                <li><strong>Profile:</strong> {t('common.navigation.profile')}</li>
                <li><strong>Settings:</strong> {t('common.navigation.settings')}</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Test Results</h3>
          <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No test results yet. Click "Run Translation Test" to start.</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationTest;