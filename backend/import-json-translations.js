const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@farmmarket.com';
const ADMIN_PASSWORD = 'AdminPass123!';

// Translation files to import
const translationFiles = {
  en: {
    common: '../frontend/src/i18n/locales/en/common.json',
    auth: '../frontend/src/i18n/locales/en/auth.json',
    products: '../frontend/src/i18n/locales/en/products.json',
    admin: '../frontend/src/i18n/locales/en/admin.json',
    buyer: '../frontend/src/i18n/locales/en/buyer.json',
    farmer: '../frontend/src/i18n/locales/en/farmer.json',
    reviews: '../frontend/src/i18n/locales/en/reviews.json',
    home: '../frontend/src/i18n/locales/en/home.json'
  },
  ne: {
    common: '../frontend/src/i18n/locales/ne/common.json',
    auth: '../frontend/src/i18n/locales/ne/auth.json',
    products: '../frontend/src/i18n/locales/ne/products.json',
    admin: '../frontend/src/i18n/locales/ne/admin.json',
    buyer: '../frontend/src/i18n/locales/ne/buyer.json',
    farmer: '../frontend/src/i18n/locales/ne/farmer.json',
    reviews: '../frontend/src/i18n/locales/ne/reviews.json',
    home: '../frontend/src/i18n/locales/ne/home.json'
  }
};

async function loginAsAdmin() {
  try {
    console.log('🔐 Logging in as admin...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (response.data.success) {
      console.log('✅ Admin login successful');
      return response.data.data.token;
    } else {
      throw new Error('Login failed: ' + response.data.error);
    }
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data || error.message);
    throw error;
  }
}

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

function loadTranslationFile(filePath) {
  try {
    const fullPath = path.resolve(__dirname, filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error loading file ${filePath}:`, error.message);
    return null;
  }
}

async function createTranslation(token, key, namespace, translations, context = '') {
  try {
    const translationData = {
      key,
      namespace,
      translations,
      context,
      isRequired: true
    };

    const response = await axios.post(`${API_BASE_URL}/translations`, translationData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      return { success: true, key };
    } else {
      return { success: false, key, error: response.data.error };
    }
  } catch (error) {
    if (error.response?.status === 409) {
      // Translation already exists, try to update it
      return await updateTranslation(token, key, translations, context);
    } else {
      return { 
        success: false, 
        key, 
        error: error.response?.data?.error || error.message 
      };
    }
  }
}

async function updateTranslation(token, key, translations, context = '') {
  try {
    const updateData = {
      translations,
      context,
      isRequired: true
    };

    const response = await axios.put(`${API_BASE_URL}/translations/${encodeURIComponent(key)}`, updateData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      return { success: true, key, updated: true };
    } else {
      return { success: false, key, error: response.data.error };
    }
  } catch (error) {
    return { 
      success: false, 
      key, 
      error: error.response?.data?.error || error.message 
    };
  }
}

async function importNamespaceTranslations(token, namespace, enData, neData) {
  console.log(`\n📝 Importing ${namespace} namespace translations...`);
  
  const enFlat = flattenObject(enData);
  const neFlat = flattenObject(neData);
  
  const allKeys = new Set([...Object.keys(enFlat), ...Object.keys(neFlat)]);
  
  let successCount = 0;
  let updateCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (const key of allKeys) {
    const fullKey = `${namespace}.${key}`;
    const translations = {
      en: enFlat[key] || '',
      ne: neFlat[key] || ''
    };
    
    // Skip if both translations are empty
    if (!translations.en && !translations.ne) {
      continue;
    }
    
    const result = await createTranslation(
      token, 
      fullKey, 
      namespace, 
      translations, 
      `Imported from JSON files - ${key}`
    );
    
    if (result.success) {
      if (result.updated) {
        updateCount++;
        console.log(`🔄 Updated: ${fullKey}`);
      } else {
        successCount++;
        console.log(`✅ Created: ${fullKey}`);
      }
    } else {
      errorCount++;
      errors.push({ key: fullKey, error: result.error });
      console.log(`❌ Failed: ${fullKey} - ${result.error}`);
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log(`\n📊 ${namespace} namespace summary:`);
  console.log(`   ✅ Created: ${successCount}`);
  console.log(`   🔄 Updated: ${updateCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  return { successCount, updateCount, errorCount, errors };
}

async function main() {
  try {
    console.log('🚀 Starting JSON translations import...\n');

    // Login as admin
    const token = await loginAsAdmin();

    let totalSuccess = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    const allErrors = [];

    // Import each namespace
    for (const namespace of ['common', 'auth', 'products', 'admin', 'buyer', 'farmer', 'reviews', 'home']) {
      console.log(`\n📂 Processing ${namespace} namespace...`);
      
      // Load English and Nepali files
      const enData = loadTranslationFile(translationFiles.en[namespace]);
      const neData = loadTranslationFile(translationFiles.ne[namespace]);
      
      if (!enData) {
        console.log(`❌ Failed to load English ${namespace} file`);
        continue;
      }
      
      if (!neData) {
        console.log(`⚠️  Failed to load Nepali ${namespace} file, proceeding with English only`);
      }
      
      const result = await importNamespaceTranslations(
        token, 
        namespace, 
        enData, 
        neData || {}
      );
      
      totalSuccess += result.successCount;
      totalUpdated += result.updateCount;
      totalErrors += result.errorCount;
      allErrors.push(...result.errors);
    }

    console.log(`\n🎉 JSON translations import completed!`);
    console.log(`\n📊 Overall Summary:`);
    console.log(`   ✅ Total Created: ${totalSuccess}`);
    console.log(`   🔄 Total Updated: ${totalUpdated}`);
    console.log(`   ❌ Total Errors: ${totalErrors}`);
    
    if (allErrors.length > 0) {
      console.log(`\n❌ Errors encountered:`);
      allErrors.forEach(error => {
        console.log(`   - ${error.key}: ${error.error}`);
      });
    }
    
    console.log(`\n📋 Next steps:`);
    console.log(`1. Visit http://localhost:3001/i18n-test to test the integration`);
    console.log(`2. Visit http://localhost:3001/admin/translations to verify imports`);
    console.log(`3. Test language switching to see all translations working`);
    console.log(`4. The fallback system will still work if any translations are missing`);

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Run the import
main();