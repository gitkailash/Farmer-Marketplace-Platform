const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Define TranslationKey schema directly in JavaScript
const translationKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  namespace: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  translations: {
    en: {
      type: String,
      required: true,
      trim: true
    },
    ne: {
      type: String,
      trim: true
    }
  },
  context: {
    type: String,
    trim: true
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const TranslationKey = mongoose.model('TranslationKey', translationKeySchema);

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmer-market', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Function to flatten nested JSON object into dot notation keys
const flattenObject = (obj, prefix = '') => {
  const flattened = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        // Recursively flatten nested objects
        Object.assign(flattened, flattenObject(obj[key], newKey));
      } else {
        // Store the value
        flattened[newKey] = obj[key];
      }
    }
  }
  
  return flattened;
};

// Function to import translations for a specific language
const importTranslations = async (language, filePath, namespace) => {
  try {
    console.log(`📖 Reading ${language} translations from ${filePath}...`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    const rawData = fs.readFileSync(filePath, 'utf8');
    const translations = JSON.parse(rawData);
    
    // Flatten the nested JSON structure
    const flattenedTranslations = flattenObject(translations);
    
    console.log(`📝 Found ${Object.keys(flattenedTranslations).length} translation keys for ${language}`);
    
    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Process each translation key
    for (const [key, value] of Object.entries(flattenedTranslations)) {
      const fullKey = `${namespace}.${key}`;
      
      try {
        // Check if translation key already exists
        const existingTranslation = await TranslationKey.findOne({ key: fullKey });
        
        if (existingTranslation) {
          // Update existing translation if the value is different
          const currentValue = existingTranslation.translations[language];
          if (currentValue !== value) {
            existingTranslation.translations[language] = value;
            existingTranslation.lastUpdated = new Date();
            await existingTranslation.save();
            updatedCount++;
            console.log(`🔄 Updated: ${fullKey} (${language})`);
          } else {
            skippedCount++;
          }
        } else {
          // Create new translation key
          const translationData = {
            key: fullKey,
            namespace: namespace,
            translations: {},
            lastUpdated: new Date()
          };
          
          // Set the translation for the specific language
          translationData.translations[language] = value;
          
          // If this is not English, we need to set a placeholder English translation
          if (language !== 'en') {
            translationData.translations.en = value; // Use same value as placeholder
          }
          
          const newTranslation = new TranslationKey(translationData);
          await newTranslation.save();
          importedCount++;
          console.log(`✅ Created: ${fullKey} (${language})`);
        }
      } catch (error) {
        console.error(`❌ Error processing key ${fullKey}:`, error.message);
      }
    }
    
    console.log(`\n📊 ${language.toUpperCase()} Import Summary:`);
    console.log(`   • New translations: ${importedCount}`);
    console.log(`   • Updated translations: ${updatedCount}`);
    console.log(`   • Skipped (unchanged): ${skippedCount}`);
    console.log(`   • Total processed: ${importedCount + updatedCount + skippedCount}`);
    
  } catch (error) {
    console.error(`❌ Error importing ${language} translations:`, error);
  }
};

// Main function
const main = async () => {
  console.log('🚀 Starting review translations import...\n');
  
  await connectDB();
  
  const frontendPath = path.join(__dirname, '../frontend/src/i18n/locales');
  
  // Import English translations
  const enPath = path.join(frontendPath, 'en/reviews.json');
  await importTranslations('en', enPath, 'reviews');
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Import Nepali translations
  const nePath = path.join(frontendPath, 'ne/reviews.json');
  await importTranslations('ne', nePath, 'reviews');
  
  console.log('\n🎉 Review translations import completed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Update review components to use translation keys');
  console.log('   2. Test multilingual functionality');
  console.log('   3. Verify translations in the frontend');
  
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});