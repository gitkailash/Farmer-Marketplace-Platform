const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin123';

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
      `Imported from ${namespace} JSON files - ${key}`
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

async function importHomeTranslations() {
  console.log('🚀 Starting Home page translations import...');
  
  try {
    // Login as admin
    const token = await loginAsAdmin();

    // Load common translations for both languages
    const enCommonPath = path.join(__dirname, '../frontend/src/i18n/locales/en/common.json');
    const neCommonPath = path.join(__dirname, '../frontend/src/i18n/locales/ne/common.json');

    const enCommon = JSON.parse(fs.readFileSync(enCommonPath, 'utf8'));
    const neCommon = JSON.parse(fs.readFileSync(neCommonPath, 'utf8'));

    // Extract only the basic sections we need
    const basicSections = ['gallery', 'products', 'features'];
    
    console.log('\n📂 Processing common namespace with basic sections...');
    
    // Process English translations
    const enTranslations = {};
    basicSections.forEach(section => {
      if (enCommon[section]) {
        enTranslations[section] = enCommon[section];
      }
    });

    // Process Nepali translations  
    const neTranslations = {};
    basicSections.forEach(section => {
      if (neCommon[section]) {
        neTranslations[section] = neCommon[section];
      }
    });

    // Import translations using the new format
    const result = await importNamespaceTranslations(token, 'common', enTranslations, neTranslations);

    console.log('\n🎉 Home page translations import completed!');
    
    console.log('\n📊 Overall Summary:');
    console.log(`   ✅ Total Created: ${result.successCount}`);
    console.log(`   🔄 Total Updated: ${result.updateCount}`);
    console.log(`   ❌ Total Errors: ${result.errorCount}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      result.errors.forEach(error => {
        console.log(`   - ${error.key}: ${error.error}`);
      });
    }

    console.log('\n📋 Next steps:');
    console.log('1. Visit http://localhost:3001/admin/translations to verify imports');
    console.log('2. Select "common" from the namespace dropdown');
    console.log('3. Test the translations in the home page');
    console.log('4. The basic sections (gallery, products, features) are now available for translation');

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Run the import
importHomeTranslations();