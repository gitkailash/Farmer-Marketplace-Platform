const axios = require('axios');

async function checkFarmerTranslations() {
    try {
        console.log('🔍 Checking farmer translation keys in database...\n');
        
        // Test English translations
        console.log('📥 Fetching English products translations...');
        const enResponse = await axios.get('http://localhost:5000/api/translations?namespace=products&language=en');
        
        if (enResponse.data.success) {
            const enTranslations = enResponse.data.data.translations;
            console.log('✅ English translations loaded successfully');
            
            // Check farmer keys
            const farmerKeys = ['rating', 'reviewsCount', 'name', 'address', 'phone', 'callButton'];
            console.log('\n🔍 Checking farmer keys in English:');
            
            farmerKeys.forEach(key => {
                const fullPath = `farmer.${key}`;
                const value = enTranslations.farmer?.[key];
                if (value) {
                    console.log(`✅ ${fullPath}: "${value}"`);
                } else {
                    console.log(`❌ ${fullPath}: MISSING`);
                }
            });
        } else {
            console.log('❌ Failed to load English translations:', enResponse.data.message);
        }
        
        // Test Nepali translations
        console.log('\n📥 Fetching Nepali products translations...');
        const neResponse = await axios.get('http://localhost:5000/api/translations?namespace=products&language=ne');
        
        if (neResponse.data.success) {
            const neTranslations = neResponse.data.data.translations;
            console.log('✅ Nepali translations loaded successfully');
            
            // Check farmer keys
            const farmerKeys = ['rating', 'reviewsCount', 'name', 'address', 'phone', 'callButton'];
            console.log('\n🔍 Checking farmer keys in Nepali:');
            
            farmerKeys.forEach(key => {
                const fullPath = `farmer.${key}`;
                const value = neTranslations.farmer?.[key];
                if (value) {
                    console.log(`✅ ${fullPath}: "${value}"`);
                } else {
                    console.log(`❌ ${fullPath}: MISSING`);
                }
            });
        } else {
            console.log('❌ Failed to load Nepali translations:', neResponse.data.message);
        }
        
        console.log('\n🎯 Summary:');
        console.log('If all keys show ✅, then the translations are properly stored in the database.');
        console.log('If you still see raw keys on the frontend, try:');
        console.log('1. Hard refresh the browser (Ctrl+F5)');
        console.log('2. Clear browser cache');
        console.log('3. Check browser console for any errors');
        console.log('4. Verify the frontend is loading translations from the database');
        
    } catch (error) {
        console.error('❌ Error checking translations:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

checkFarmerTranslations();