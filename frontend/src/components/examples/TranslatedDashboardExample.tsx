import React from 'react';
import { useAppTranslation } from '../../contexts/I18nProvider';
import { LanguageSwitcher } from '../UI';

// Example showing how to convert hardcoded text to translations
const TranslatedDashboardExample: React.FC = () => {
  const { t } = useAppTranslation();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Translation Integration Example
        </h1>
        <LanguageSwitcher variant="dropdown" showFlags={true} showLabels={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Before - Hardcoded Text */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-4">
            ❌ Before: Hardcoded Text
          </h2>
          
          <div className="space-y-4">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-medium mb-2">Dashboard Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">12</div>
                  <div className="text-sm text-gray-600">Total Orders</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">8</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                  View All Orders
                </button>
                <button className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700">
                  Manage Profile
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-red-100 rounded text-sm text-red-700">
            <strong>Problems:</strong>
            <ul className="list-disc list-inside mt-1">
              <li>Text is hardcoded in English only</li>
              <li>No support for other languages</li>
              <li>Difficult to maintain and update</li>
            </ul>
          </div>
        </div>

        {/* After - Using Translations */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">
            ✅ After: Using Translation Keys
          </h2>
          
          <div className="space-y-4">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-medium mb-2">
                {t('dashboard.overview.title')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">12</div>
                  <div className="text-sm text-gray-600">
                    {t('dashboard.stats.total_orders')}
                  </div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">8</div>
                  <div className="text-sm text-gray-600">
                    {t('dashboard.stats.completed')}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                  {t('dashboard.actions.view_all_orders')}
                </button>
                <button className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700">
                  {t('dashboard.actions.manage_profile')}
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-100 rounded text-sm text-green-700">
            <strong>Benefits:</strong>
            <ul className="list-disc list-inside mt-1">
              <li>Supports multiple languages dynamically</li>
              <li>Centralized translation management</li>
              <li>Easy to update via admin panel</li>
              <li>Consistent terminology across app</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Translation Keys Reference */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Translation Keys Used in This Example
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Dashboard Namespace:</h3>
            <div className="bg-white p-3 rounded border text-sm font-mono space-y-1">
              <div><span className="text-blue-600">dashboard.overview.title</span></div>
              <div><span className="text-blue-600">dashboard.stats.total_orders</span></div>
              <div><span className="text-blue-600">dashboard.stats.completed</span></div>
              <div><span className="text-blue-600">dashboard.actions.view_all_orders</span></div>
              <div><span className="text-blue-600">dashboard.actions.manage_profile</span></div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">How to Add These Keys:</h3>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Go to <code>/admin/translations</code></li>
              <li>Click "Add New Translation"</li>
              <li>Use namespace: <code>dashboard</code></li>
              <li>Add keys like: <code>dashboard.overview.title</code></li>
              <li>Provide English and Nepali translations</li>
              <li>Save and test here!</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Code Example */}
      <div className="bg-gray-900 text-green-400 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Code Example: Converting Hardcoded Text
        </h2>
        
        <div className="space-y-4 text-sm font-mono">
          <div>
            <div className="text-red-400 mb-2">// ❌ Before (hardcoded):</div>
            <div className="bg-gray-800 p-3 rounded">
              <div className="text-gray-300">&lt;h3&gt;Dashboard Overview&lt;/h3&gt;</div>
              <div className="text-gray-300">&lt;button&gt;View All Orders&lt;/button&gt;</div>
            </div>
          </div>
          
          <div>
            <div className="text-green-400 mb-2">// ✅ After (using translations):</div>
            <div className="bg-gray-800 p-3 rounded">
              <div className="text-gray-300">const &#123; t &#125; = useAppTranslation();</div>
              <div className="text-gray-300">&lt;h3&gt;&#123;t('dashboard.overview.title')&#125;&lt;/h3&gt;</div>
              <div className="text-gray-300">&lt;button&gt;&#123;t('dashboard.actions.view_all_orders')&#125;&lt;/button&gt;</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslatedDashboardExample;