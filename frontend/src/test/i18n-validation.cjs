/**
 * Manual I18n Validation Script
 * Task 12.3: Final checkpoint - Comprehensive testing
 * 
 * This script performs comprehensive validation of the internationalization implementation
 * without relying on complex test frameworks that may have mocking issues.
 */

// Import translation files directly
const fs = require('fs');
const path = require('path');

// Helper function to read JSON files
const readJsonFile = (filePath) => {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
};

// Helper function to get all translation keys recursively
const getAllTranslationKeys = (obj, prefix = '') => {
  let keys = [];
  
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getAllTranslationKeys(obj[key], prefix ? `${prefix}.${key}` : key));
    } else {
      keys.push(prefix ? `${prefix}.${key}` : key);
    }
  }
  
  return keys;
};

// Helper function to check for empty values
const checkEmptyValues = (obj, namespace, path = '') => {
  const emptyKeys = [];
  
  for (const key in obj) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      emptyKeys.push(...checkEmptyValues(obj[key], namespace, currentPath));
    } else if (typeof obj[key] === 'string' && obj[key].trim() === '') {
      emptyKeys.push(`${namespace}:${currentPath}`);
    }
  }
  
  return emptyKeys;
};

// Helper function to get nested value from object
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current && current[key], obj);
};

// Main validation function
const validateI18n = () => {
  console.log('🌐 Starting Comprehensive I18n Validation...\n');
  
  let totalErrors = 0;
  let totalWarnings = 0;
  
  // Load translation files
  const translations = {
    en: {
      common: readJsonFile('i18n/locales/en/common.json'),
      auth: readJsonFile('i18n/locales/en/auth.json'),
      products: readJsonFile('i18n/locales/en/products.json'),
      admin: readJsonFile('i18n/locales/en/admin.json')
    },
    ne: {
      common: readJsonFile('i18n/locales/ne/common.json'),
      auth: readJsonFile('i18n/locales/ne/auth.json'),
      products: readJsonFile('i18n/locales/ne/products.json'),
      admin: readJsonFile('i18n/locales/ne/admin.json')
    }
  };
  
  // 1. Translation Key Completeness Validation
  console.log('📋 1. TRANSLATION KEY COMPLETENESS');
  console.log('=====================================');
  
  const namespaces = ['common', 'auth', 'products', 'admin'];
  
  for (const namespace of namespaces) {
    const enTranslation = translations.en[namespace];
    const neTranslation = translations.ne[namespace];
    
    if (!enTranslation || !neTranslation) {
      console.error(`❌ Missing translation files for ${namespace} namespace`);
      totalErrors++;
      continue;
    }
    
    const enKeys = getAllTranslationKeys(enTranslation);
    const neKeys = getAllTranslationKeys(neTranslation);
    
    // Check for missing Nepali translations
    const missingNeKeys = enKeys.filter(key => !neKeys.includes(key));
    if (missingNeKeys.length > 0) {
      console.error(`❌ ${namespace}: Missing ${missingNeKeys.length} Nepali translations:`);
      missingNeKeys.slice(0, 5).forEach(key => console.error(`   - ${key}`));
      if (missingNeKeys.length > 5) {
        console.error(`   ... and ${missingNeKeys.length - 5} more`);
      }
      totalErrors += missingNeKeys.length;
    }
    
    // Check for missing English translations
    const missingEnKeys = neKeys.filter(key => !enKeys.includes(key));
    if (missingEnKeys.length > 0) {
      console.error(`❌ ${namespace}: Missing ${missingEnKeys.length} English translations:`);
      missingEnKeys.slice(0, 5).forEach(key => console.error(`   - ${key}`));
      if (missingEnKeys.length > 5) {
        console.error(`   ... and ${missingEnKeys.length - 5} more`);
      }
      totalErrors += missingEnKeys.length;
    }
    
    if (missingNeKeys.length === 0 && missingEnKeys.length === 0) {
      console.log(`✅ ${namespace}: All ${enKeys.length} translation keys match`);
    }
  }
  
  // 2. Empty Translation Values Check
  console.log('\n📝 2. EMPTY TRANSLATION VALUES CHECK');
  console.log('====================================');
  
  let totalEmptyKeys = 0;
  
  for (const lang of ['en', 'ne']) {
    for (const namespace of namespaces) {
      const translation = translations[lang][namespace];
      if (translation) {
        const emptyKeys = checkEmptyValues(translation, `${lang}:${namespace}`);
        if (emptyKeys.length > 0) {
          console.error(`❌ ${lang}:${namespace}: Found ${emptyKeys.length} empty values:`);
          emptyKeys.forEach(key => console.error(`   - ${key}`));
          totalEmptyKeys += emptyKeys.length;
        }
      }
    }
  }
  
  if (totalEmptyKeys === 0) {
    console.log('✅ No empty translation values found');
  } else {
    totalErrors += totalEmptyKeys;
  }
  
  // 3. Font and CSS Configuration Check
  console.log('\n🎨 3. FONT AND CSS CONFIGURATION CHECK');
  console.log('======================================');
  
  try {
    const cssPath = path.join(__dirname, '..', 'index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Check for Noto Sans Devanagari import
    if (cssContent.includes('Noto+Sans+Devanagari')) {
      console.log('✅ Noto Sans Devanagari font import found');
    } else {
      console.error('❌ Noto Sans Devanagari font import missing');
      totalErrors++;
    }
    
    // Check for Nepali text classes
    const nepaliClasses = ['.nepali-text', '.font-nepali', '.lang-ne'];
    let foundClasses = 0;
    
    for (const className of nepaliClasses) {
      if (cssContent.includes(className)) {
        foundClasses++;
      }
    }
    
    if (foundClasses >= 2) {
      console.log(`✅ Found ${foundClasses} Nepali text CSS classes`);
    } else {
      console.error(`❌ Only found ${foundClasses} Nepali text CSS classes (expected at least 2)`);
      totalErrors++;
    }
    
    // Check for font fallbacks
    if (cssContent.includes('Mangal') && cssContent.includes('Kokila')) {
      console.log('✅ Devanagari font fallbacks configured');
    } else {
      console.warn('⚠️  Some Devanagari font fallbacks may be missing');
      totalWarnings++;
    }
    
    // Check for proper line height
    if (cssContent.includes('line-height: 1.6')) {
      console.log('✅ Proper line height for Devanagari text found');
    } else {
      console.warn('⚠️  Optimal line height for Devanagari text may be missing');
      totalWarnings++;
    }
    
  } catch (error) {
    console.error('❌ Error reading CSS file:', error.message);
    totalErrors++;
  }
  
  // 4. Translation File Structure Validation
  console.log('\n🏗️  4. TRANSLATION FILE STRUCTURE VALIDATION');
  console.log('=============================================');
  
  const expectedStructure = {
    common: ['buttons', 'navigation', 'labels', 'messages', 'languages', 'validation'],
    auth: ['login', 'register', 'onboarding', 'profile', 'messages'],
    products: [], // Products structure may vary
    admin: [] // Admin structure may vary
  };
  
  for (const namespace of ['common', 'auth']) {
    const expectedSections = expectedStructure[namespace];
    
    for (const lang of ['en', 'ne']) {
      const translation = translations[lang][namespace];
      if (translation) {
        const missingSections = expectedSections.filter(section => !translation[section]);
        
        if (missingSections.length > 0) {
          console.error(`❌ ${lang}:${namespace}: Missing sections: ${missingSections.join(', ')}`);
          totalErrors += missingSections.length;
        } else {
          console.log(`✅ ${lang}:${namespace}: All expected sections present`);
        }
      }
    }
  }
  
  // 5. Translation Quality Check
  console.log('\n🔍 5. TRANSLATION QUALITY CHECK');
  console.log('===============================');
  
  // Check for potential issues in translations
  const qualityIssues = [];
  
  for (const namespace of namespaces) {
    const enTranslation = translations.en[namespace];
    const neTranslation = translations.ne[namespace];
    
    if (enTranslation && neTranslation) {
      const enKeys = getAllTranslationKeys(enTranslation);
      
      for (const key of enKeys.slice(0, 10)) { // Check first 10 keys as sample
        const enValue = getNestedValue(enTranslation, key);
        const neValue = getNestedValue(neTranslation, key);
        
        if (enValue && neValue) {
          // Check if Nepali translation is just English (potential missing translation)
          if (neValue === enValue && /^[a-zA-Z\s]+$/.test(enValue)) {
            qualityIssues.push(`${namespace}:${key} - Nepali translation appears to be English`);
          }
          
          // Check for placeholder patterns
          if (neValue.includes('{{') && neValue.includes('}}')) {
            // This is expected for interpolation
          } else if (neValue.includes('TODO') || neValue.includes('FIXME')) {
            qualityIssues.push(`${namespace}:${key} - Contains TODO/FIXME placeholder`);
          }
        }
      }
    }
  }
  
  if (qualityIssues.length > 0) {
    console.warn(`⚠️  Found ${qualityIssues.length} potential quality issues:`);
    qualityIssues.slice(0, 5).forEach(issue => console.warn(`   - ${issue}`));
    if (qualityIssues.length > 5) {
      console.warn(`   ... and ${qualityIssues.length - 5} more`);
    }
    totalWarnings += qualityIssues.length;
  } else {
    console.log('✅ No obvious quality issues found in sample translations');
  }
  
  // 6. File Size and Performance Check
  console.log('\n⚡ 6. FILE SIZE AND PERFORMANCE CHECK');
  console.log('====================================');
  
  let totalSize = 0;
  
  for (const lang of ['en', 'ne']) {
    for (const namespace of namespaces) {
      try {
        const filePath = path.join(__dirname, '..', `i18n/locales/${lang}/${namespace}.json`);
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        totalSize += stats.size;
        
        if (stats.size > 50000) { // 50KB
          console.warn(`⚠️  ${lang}:${namespace}.json is large (${sizeKB}KB) - consider splitting`);
          totalWarnings++;
        } else {
          console.log(`✅ ${lang}:${namespace}.json size: ${sizeKB}KB`);
        }
      } catch (error) {
        console.error(`❌ Error checking size of ${lang}:${namespace}.json`);
        totalErrors++;
      }
    }
  }
  
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  console.log(`📊 Total translation files size: ${totalSizeKB}KB`);
  
  if (totalSize > 500000) { // 500KB
    console.warn('⚠️  Total translation size is quite large - consider lazy loading optimization');
    totalWarnings++;
  }
  
  // Final Summary
  console.log('\n📊 VALIDATION SUMMARY');
  console.log('====================');
  
  if (totalErrors === 0 && totalWarnings === 0) {
    console.log('🎉 ALL CHECKS PASSED! Internationalization implementation is excellent.');
  } else {
    console.log(`📋 Validation completed with ${totalErrors} errors and ${totalWarnings} warnings.`);
    
    if (totalErrors > 0) {
      console.log('❌ Critical issues found that should be addressed.');
    }
    
    if (totalWarnings > 0) {
      console.log('⚠️  Minor issues found that could be improved.');
    }
  }
  
  return { errors: totalErrors, warnings: totalWarnings };
};

// Run validation if this script is executed directly
if (require.main === module) {
  validateI18n();
}

module.exports = { validateI18n, getAllTranslationKeys, checkEmptyValues };