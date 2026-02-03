#!/usr/bin/env node

/**
 * Simple translation validation script
 * Can be run as part of CI/CD pipeline
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales');
const LANGUAGES = ['en', 'ne'];
const NAMESPACES = ['common', 'auth', 'products', 'admin'];

/**
 * Get all keys from a nested object
 */
function getAllKeys(obj, prefix = '') {
  const keys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

/**
 * Load translation file
 */
function loadTranslation(language, namespace) {
  const filePath = path.join(LOCALES_DIR, language, `${namespace}.json`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error loading ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Validate translations
 */
function validateTranslations() {
  console.log('🔍 Validating translations...\n');
  
  let hasErrors = false;
  const results = [];
  
  // Use English as the reference
  const referenceLanguage = 'en';
  
  for (const namespace of NAMESPACES) {
    console.log(`📁 Namespace: ${namespace}`);
    
    // Load reference translation
    const referenceTranslation = loadTranslation(referenceLanguage, namespace);
    if (!referenceTranslation) {
      hasErrors = true;
      continue;
    }
    
    const referenceKeys = getAllKeys(referenceTranslation);
    console.log(`   Reference keys (${referenceLanguage}): ${referenceKeys.length}`);
    
    // Check other languages
    for (const language of LANGUAGES) {
      if (language === referenceLanguage) continue;
      
      const translation = loadTranslation(language, namespace);
      if (!translation) {
        hasErrors = true;
        continue;
      }
      
      const translationKeys = getAllKeys(translation);
      const missingKeys = referenceKeys.filter(key => !translationKeys.includes(key));
      const extraKeys = translationKeys.filter(key => !referenceKeys.includes(key));
      
      const completeness = referenceKeys.length > 0 
        ? Math.round(((referenceKeys.length - missingKeys.length) / referenceKeys.length) * 100)
        : 100;
      
      console.log(`   ${language.toUpperCase()}: ${completeness}% complete (${translationKeys.length}/${referenceKeys.length} keys)`);
      
      if (missingKeys.length > 0) {
        console.log(`   ⚠️  Missing keys in ${language}:`);
        missingKeys.forEach(key => console.log(`      - ${key}`));
        hasErrors = true;
      }
      
      if (extraKeys.length > 0) {
        console.log(`   ℹ️  Extra keys in ${language}:`);
        extraKeys.forEach(key => console.log(`      + ${key}`));
      }
      
      results.push({
        language,
        namespace,
        completeness,
        missingKeys: missingKeys.length,
        extraKeys: extraKeys.length,
        totalKeys: referenceKeys.length
      });
    }
    
    console.log('');
  }
  
  // Summary
  console.log('📊 Summary:');
  const byLanguage = results.reduce((acc, result) => {
    if (!acc[result.language]) {
      acc[result.language] = { total: 0, missing: 0, completeness: [] };
    }
    acc[result.language].total += result.totalKeys;
    acc[result.language].missing += result.missingKeys;
    acc[result.language].completeness.push(result.completeness);
    return acc;
  }, {});
  
  Object.entries(byLanguage).forEach(([lang, stats]) => {
    const avgCompleteness = Math.round(
      stats.completeness.reduce((sum, c) => sum + c, 0) / stats.completeness.length
    );
    console.log(`   ${lang.toUpperCase()}: ${avgCompleteness}% average completeness, ${stats.missing} missing keys`);
  });
  
  if (hasErrors) {
    console.log('\n❌ Translation validation failed. Please fix the missing translations.');
    process.exit(1);
  } else {
    console.log('\n✅ All translations are valid!');
  }
}

// Run validation
validateTranslations();