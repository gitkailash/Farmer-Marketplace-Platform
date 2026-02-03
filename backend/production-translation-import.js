#!/usr/bin/env node

/**
 * Production Translation Import Script
 * 
 * This script imports all translation files into the production database.
 * It handles authentication, validation, and provides comprehensive logging.
 * 
 * Usage:
 *   node production-translation-import.js [options]
 * 
 * Options:
 *   --admin-email <email>     Admin email (default: admin@farmmarket.com)
 *   --admin-password <pass>   Admin password (required)
 *   --api-url <url>          API base URL (default: http://localhost:5000/api)
 *   --dry-run                Show what would be imported without making changes
 *   --force                  Overwrite existing translations
 *   --namespace <ns>         Import only specific namespace (optional)
 *   --help                   Show this help message
 * 
 * Environment Variables:
 *   ADMIN_EMAIL              Admin email address
 *   ADMIN_PASSWORD           Admin password
 *   API_BASE_URL             API base URL
 * 
 * Examples:
 *   # Import all translations
 *   node production-translation-import.js --admin-password "YourPassword123!"
 * 
 *   # Dry run to see what would be imported
 *   node production-translation-import.js --admin-password "YourPassword123!" --dry-run
 * 
 *   # Import only buyer namespace
 *   node production-translation-import.js --admin-password "YourPassword123!" --namespace buyer
 * 
 *   # Force overwrite existing translations
 *   node production-translation-import.js --admin-password "YourPassword123!" --force
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { program } = require('commander');

// Configure command line options
program
  .name('production-translation-import')
  .description('Import translation files into production database')
  .option('--admin-email <email>', 'Admin email address', process.env.ADMIN_EMAIL || 'admin@farmmarket.com')
  .option('--admin-password <password>', 'Admin password', process.env.ADMIN_PASSWORD)
  .option('--api-url <url>', 'API base URL', process.env.API_BASE_URL || 'http://localhost:5000/api')
  .option('--dry-run', 'Show what would be imported without making changes', false)
  .option('--force', 'Overwrite existing translations', false)
  .option('--namespace <namespace>', 'Import only specific namespace')
  .option('--verbose', 'Enable verbose logging', false)
  .parse();

const options = program.opts();

// Validate required options
if (!options.adminPassword) {
  console.error('❌ Error: Admin password is required');
  console.error('Use --admin-password option or set ADMIN_PASSWORD environment variable');
  process.exit(1);
}

// Configuration
const CONFIG = {
  API_BASE_URL: options.apiUrl,
  ADMIN_EMAIL: options.adminEmail,
  ADMIN_PASSWORD: options.adminPassword,
  DRY_RUN: options.dryRun,
  FORCE: options.force,
  NAMESPACE_FILTER: options.namespace,
  VERBOSE: options.verbose
};

// Translation files to import - organized by namespace
const TRANSLATION_FILES = {
  common: {
    en: '../frontend/src/i18n/locales/en/common.json',
    ne: '../frontend/src/i18n/locales/ne/common.json'
  },
  auth: {
    en: '../frontend/src/i18n/locales/en/auth.json',
    ne: '../frontend/src/i18n/locales/ne/auth.json'
  },
  products: {
    en: '../frontend/src/i18n/locales/en/products.json',
    ne: '../frontend/src/i18n/locales/ne/products.json'
  },
  admin: {
    en: '../frontend/src/i18n/locales/en/admin.json',
    ne: '../frontend/src/i18n/locales/ne/admin.json'
  },
  buyer: {
    en: '../frontend/src/i18n/locales/en/buyer.json',
    ne: '../frontend/src/i18n/locales/ne/buyer.json'
  },
  farmer: {
    en: '../frontend/src/i18n/locales/en/farmer.json',
    ne: '../frontend/src/i18n/locales/ne/farmer.json'
  },
  reviews: {
    en: '../frontend/src/i18n/locales/en/reviews.json',
    ne: '../frontend/src/i18n/locales/ne/reviews.json'
  },
  home: {
    en: '../frontend/src/i18n/locales/en/home.json',
    ne: '../frontend/src/i18n/locales/ne/home.json'
  }
};

// Statistics tracking
const stats = {
  totalProcessed: 0,
  created: 0,
  updated: 0,
  skipped: 0,
  errors: 0,
  errorDetails: []
};

/**
 * Log message with timestamp and level
 */
function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] ${level.toUpperCase()}:`;
  
  if (level === 'verbose' && !CONFIG.VERBOSE) {
    return;
  }
  
  console.log(prefix, message, ...args);
}

/**
 * Authenticate with the API and get access token
 */
async function authenticate() {
  try {
    log('info', '🔐 Authenticating with API...');
    log('verbose', `Using email: ${CONFIG.ADMIN_EMAIL}`);
    log('verbose', `API URL: ${CONFIG.API_BASE_URL}`);
    
    const response = await axios.post(`${CONFIG.API_BASE_URL}/auth/login`, {
      email: CONFIG.ADMIN_EMAIL,
      password: CONFIG.ADMIN_PASSWORD
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      log('info', '✅ Authentication successful');
      return response.data.data.token;
    } else {
      throw new Error(`Authentication failed: ${response.data.error || 'Unknown error'}`);
    }
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error || error.response.statusText;
      throw new Error(`Authentication failed (${status}): ${message}`);
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error(`Cannot connect to API at ${CONFIG.API_BASE_URL}. Is the server running?`);
    } else {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }
}

/**
 * Load and parse translation file
 */
function loadTranslationFile(filePath) {
  try {
    const fullPath = path.resolve(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      log('verbose', `Translation file not found: ${fullPath}`);
      return null;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(content);
    
    log('verbose', `Loaded translation file: ${filePath}`);
    return data;
  } catch (error) {
    log('error', `Failed to load translation file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Flatten nested object into dot-notation keys
 */
function flattenObject(obj, prefix = '', result = {}) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        flattenObject(obj[key], newKey, result);
      } else {
        result[newKey] = obj[key];
      }
    }
  }
  return result;
}

/**
 * Create or update translation in the database
 */
async function upsertTranslation(token, key, namespace, translations, context = '') {
  try {
    stats.totalProcessed++;
    
    const translationData = {
      key,
      namespace,
      translations,
      context,
      isRequired: true
    };

    if (CONFIG.DRY_RUN) {
      log('info', `[DRY RUN] Would create/update: ${key}`);
      stats.created++;
      return { success: true, key, dryRun: true };
    }

    // Try to create first
    try {
      const response = await axios.post(`${CONFIG.API_BASE_URL}/translations`, translationData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (response.data.success) {
        stats.created++;
        log('verbose', `✅ Created: ${key}`);
        return { success: true, key, created: true };
      } else {
        throw new Error(response.data.error || 'Unknown error');
      }
    } catch (createError) {
      // If creation fails due to conflict (409), try to update
      if (createError.response?.status === 409) {
        if (!CONFIG.FORCE) {
          stats.skipped++;
          log('verbose', `⏭️  Skipped existing: ${key} (use --force to overwrite)`);
          return { success: true, key, skipped: true };
        }
        
        // Try to update
        const updateData = {
          translations,
          context,
          isRequired: true
        };

        const updateResponse = await axios.put(`${CONFIG.API_BASE_URL}/translations/${encodeURIComponent(key)}`, updateData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });

        if (updateResponse.data.success) {
          stats.updated++;
          log('verbose', `🔄 Updated: ${key}`);
          return { success: true, key, updated: true };
        } else {
          throw new Error(updateResponse.data.error || 'Update failed');
        }
      } else {
        throw createError;
      }
    }
  } catch (error) {
    stats.errors++;
    const errorMessage = error.response?.data?.error || error.message;
    stats.errorDetails.push({ key, error: errorMessage });
    log('error', `❌ Failed: ${key} - ${errorMessage}`);
    return { success: false, key, error: errorMessage };
  }
}

/**
 * Import translations for a specific namespace
 */
async function importNamespaceTranslations(token, namespace, enData, neData) {
  log('info', `\n📝 Processing ${namespace} namespace...`);
  
  if (!enData && !neData) {
    log('info', `⚠️  No translation files found for ${namespace} namespace`);
    return;
  }
  
  const enFlat = enData ? flattenObject(enData) : {};
  const neFlat = neData ? flattenObject(neData) : {};
  
  const allKeys = new Set([...Object.keys(enFlat), ...Object.keys(neFlat)]);
  
  log('info', `Found ${allKeys.size} translation keys in ${namespace} namespace`);
  
  let namespaceStats = { created: 0, updated: 0, skipped: 0, errors: 0 };
  
  for (const key of allKeys) {
    const fullKey = `${namespace}.${key}`;
    const translations = {
      en: enFlat[key] || '',
      ne: neFlat[key] || ''
    };
    
    // Skip if both translations are empty
    if (!translations.en && !translations.ne) {
      log('verbose', `Skipping empty translation: ${fullKey}`);
      continue;
    }
    
    const result = await upsertTranslation(
      token, 
      fullKey, 
      namespace, 
      translations, 
      `Imported from ${namespace} JSON files - ${key}`
    );
    
    if (result.success) {
      if (result.created) namespaceStats.created++;
      else if (result.updated) namespaceStats.updated++;
      else if (result.skipped) namespaceStats.skipped++;
    } else {
      namespaceStats.errors++;
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  log('info', `📊 ${namespace} namespace summary:`);
  log('info', `   ✅ Created: ${namespaceStats.created}`);
  log('info', `   🔄 Updated: ${namespaceStats.updated}`);
  log('info', `   ⏭️  Skipped: ${namespaceStats.skipped}`);
  log('info', `   ❌ Errors: ${namespaceStats.errors}`);
}

/**
 * Main import function
 */
async function main() {
  const startTime = Date.now();
  
  try {
    log('info', '🚀 Starting Production Translation Import...\n');
    
    if (CONFIG.DRY_RUN) {
      log('info', '🔍 DRY RUN MODE - No changes will be made\n');
    }
    
    log('info', 'Configuration:');
    log('info', `  API URL: ${CONFIG.API_BASE_URL}`);
    log('info', `  Admin Email: ${CONFIG.ADMIN_EMAIL}`);
    log('info', `  Dry Run: ${CONFIG.DRY_RUN}`);
    log('info', `  Force Overwrite: ${CONFIG.FORCE}`);
    log('info', `  Namespace Filter: ${CONFIG.NAMESPACE_FILTER || 'All'}`);
    log('info', `  Verbose Logging: ${CONFIG.VERBOSE}\n`);

    // Authenticate
    const token = await authenticate();

    // Get list of namespaces to process
    const namespacesToProcess = CONFIG.NAMESPACE_FILTER 
      ? [CONFIG.NAMESPACE_FILTER]
      : Object.keys(TRANSLATION_FILES);
    
    log('info', `Processing namespaces: ${namespacesToProcess.join(', ')}\n`);

    // Import each namespace
    for (const namespace of namespacesToProcess) {
      if (!TRANSLATION_FILES[namespace]) {
        log('error', `❌ Unknown namespace: ${namespace}`);
        continue;
      }
      
      const files = TRANSLATION_FILES[namespace];
      
      // Load English and Nepali files
      const enData = loadTranslationFile(files.en);
      const neData = loadTranslationFile(files.ne);
      
      await importNamespaceTranslations(token, namespace, enData, neData);
    }

    // Final summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log('info', `\n🎉 Translation import completed in ${duration}s!`);
    log('info', `\n📊 Overall Summary:`);
    log('info', `   ✅ Total Created: ${stats.created}`);
    log('info', `   🔄 Total Updated: ${stats.updated}`);
    log('info', `   ⏭️  Total Skipped: ${stats.skipped}`);
    log('info', `   ❌ Total Errors: ${stats.errors}`);
    log('info', `   📝 Total Processed: ${stats.totalProcessed}`);
    
    if (stats.errors > 0) {
      log('info', `\n❌ Error Details:`);
      stats.errorDetails.forEach(error => {
        log('info', `   - ${error.key}: ${error.error}`);
      });
    }
    
    if (!CONFIG.DRY_RUN) {
      log('info', `\n📋 Next Steps:`);
      log('info', `1. Verify imports in the admin panel: ${CONFIG.API_BASE_URL.replace('/api', '')}/admin/translations`);
      log('info', `2. Test language switching in the application`);
      log('info', `3. Clear any frontend translation caches if needed`);
      log('info', `4. Monitor application logs for any missing translations`);
    } else {
      log('info', `\n📋 To actually import these translations:`);
      log('info', `Run the same command without --dry-run flag`);
    }

    // Exit with appropriate code
    process.exit(stats.errors > 0 ? 1 : 0);

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log('error', `\n❌ Import failed after ${duration}s:`, error.message);
    
    if (error.stack && CONFIG.VERBOSE) {
      log('verbose', 'Stack trace:', error.stack);
    }
    
    process.exit(1);
  }
}

// Handle process signals gracefully
process.on('SIGINT', () => {
  log('info', '\n⚠️  Import interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  log('info', '\n⚠️  Import terminated');
  process.exit(143);
});

// Run the import
if (require.main === module) {
  main();
}

module.exports = { main, CONFIG, TRANSLATION_FILES };