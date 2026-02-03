const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin123';

// Cart and checkout keys to verify
const keysToCheck = [
  'common.cart.title',
  'common.cart.empty.title',
  'common.cart.empty.description',
  'common.cart.items',
  'common.cart.total',
  'common.cart.proceedToCheckout',
  'common.cart.continueShopping',
  'common.checkout.title',
  'common.checkout.subtitle',
  'common.checkout.deliveryInformation',
  'common.checkout.placeOrder',
  'common.checkout.orderSummary'
];

async function verifyKeysInDatabase() {
  try {
    console.log('🔐 Authenticating...');
    
    // Login as admin
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (!loginResponse.data.success) {
      throw new Error('Authentication failed');
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Authentication successful');

    // Get all translations
    console.log('\n📋 Fetching all translations from database...');
    const translationsResponse = await axios.get(`${API_BASE_URL}/translations/keys`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!translationsResponse.data.success) {
      throw new Error('Failed to fetch translations');
    }

    const allTranslations = translationsResponse.data.data.keys;
    console.log(`📊 Total translations in database: ${allTranslations.length}`);

    // Create a map for quick lookup
    const translationMap = {};
    allTranslations.forEach(translation => {
      translationMap[translation.key] = translation;
    });

    console.log('\n🔍 Checking specific cart and checkout keys:');
    console.log('='.repeat(80));

    let foundCount = 0;
    let missingCount = 0;

    keysToCheck.forEach(key => {
      const translation = translationMap[key];
      if (translation) {
        foundCount++;
        console.log(`✅ ${key}`);
        console.log(`   EN: "${translation.translations.en}"`);
        console.log(`   NE: "${translation.translations.ne}"`);
        console.log('');
      } else {
        missingCount++;
        console.log(`❌ ${key} - NOT FOUND`);
      }
    });

    console.log('='.repeat(80));
    console.log(`📊 Summary:`);
    console.log(`   ✅ Found: ${foundCount}`);
    console.log(`   ❌ Missing: ${missingCount}`);
    console.log(`   📝 Total checked: ${keysToCheck.length}`);

    // Check for cart and checkout related keys in general
    console.log('\n🔍 All keys currently in database:');
    allTranslations.forEach((translation, index) => {
      console.log(`   ${index + 1}. ${translation.key}`);
    });

    if (allTranslations.length === 0) {
      console.log('\n⚠️  WARNING: No translations found in database!');
      console.log('This suggests the database is empty or the API is not working correctly.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

verifyKeysInDatabase();