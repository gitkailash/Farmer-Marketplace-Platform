#!/usr/bin/env node

/**
 * Quick Admin Setup and Translation Test
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const ADMIN_USER = {
  email: 'admin@farmmarket.com',
  password: 'AdminPass123!',
  profile: { name: 'System Admin' },
  role: 'ADMIN'
};

async function quickSetup() {
  console.log('🚀 Quick Translation System Setup\n');
  
  // Step 1: Check server
  console.log('1. Checking server...');
  try {
    await axios.get('http://localhost:5000/health');
    console.log('✅ Server is running');
  } catch (error) {
    console.log('❌ Server not responding');
    return;
  }
  
  // Step 2: Create admin user
  console.log('\n2. Creating admin user...');
  try {
    await axios.post(`${BASE_URL}/auth/register`, ADMIN_USER);
    console.log('✅ Admin user created');
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('✅ Admin user already exists');
    } else {
      console.log('❌ Failed to create admin:', error.response?.data?.message);
      return;
    }
  }
  
  // Step 3: Login
  console.log('\n3. Logging in...');
  let authToken;
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: ADMIN_USER.email,
      password: ADMIN_USER.password
    });
    authToken = response.data.token;
    console.log('✅ Login successful');
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message);
    return;
  }
  
  // Step 4: Test translation creation
  console.log('\n4. Testing translation creation...');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };
  
  const testTranslation = {
    key: 'common.buttons.save_product',
    namespace: 'common',
    translations: {
      en: 'Save Product',
      ne: 'उत्पादन सेभ गर्नुहोस्'
    },
    context: 'Button text for saving product form',
    isRequired: true
  };
  
  try {
    await axios.post(`${BASE_URL}/translations`, testTranslation, { headers });
    console.log('✅ Translation created successfully!');
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('✅ Translation already exists (this is fine)');
    } else {
      console.log('❌ Translation creation failed:');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', JSON.stringify(error.response?.data, null, 2));
    }
  }
  
  // Step 5: Test invalid format
  console.log('\n5. Testing invalid format (should be rejected)...');
  const invalidTranslation = {
    key: 'Common.Buttons.SaveProduct', // Invalid: uppercase
    namespace: 'common',
    translations: { en: 'Save Product' },
    context: 'Test',
    isRequired: false
  };
  
  try {
    await axios.post(`${BASE_URL}/translations`, invalidTranslation, { headers });
    console.log('❌ Invalid format was accepted (validation not working)');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Invalid format correctly rejected');
    } else {
      console.log('⚠️  Unexpected error:', error.response?.status);
    }
  }
  
  // Step 6: Get translations
  console.log('\n6. Testing translation retrieval...');
  try {
    const response = await axios.get(`${BASE_URL}/translations/keys`, { headers });
    console.log(`✅ Retrieved ${response.data.data.keys.length} translation keys`);
  } catch (error) {
    console.log('❌ Failed to retrieve translations:', error.response?.data);
  }
  
  // Final result
  console.log('\n🎉 SETUP COMPLETE!');
  console.log('\n📋 Admin Credentials:');
  console.log(`Email: ${ADMIN_USER.email}`);
  console.log(`Password: ${ADMIN_USER.password}`);
  console.log('\n🌐 Access Points:');
  console.log('Admin Panel: http://localhost:3000/admin/translations');
  console.log('API: http://localhost:5000/api');
  console.log('\n✅ Valid Key Format: common.buttons.save_product');
  console.log('❌ Invalid Key Format: Common.Buttons.SaveProduct');
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Go to http://localhost:3000/admin/translations');
  console.log('2. Login with the credentials above');
  console.log('3. Click "Add Translation"');
  console.log('4. Use format: common.buttons.your_button_name');
}

quickSetup().catch(console.error);