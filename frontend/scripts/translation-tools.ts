#!/usr/bin/env node

/**
 * Translation Tools
 * 
 * This script provides utilities for:
 * 1. Extracting translation keys from React components
 * 2. Validating translation completeness
 * 3. Generating translation reports
 * 4. Finding unused translation keys
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Configuration
const CONFIG = {
  srcDir: path.join(__dirname, '../src'),
  translationDir: path.join(__dirname, '../src/i18n/locales'),
  supportedLanguages: ['en', 'ne'],
  namespaces: ['common', 'auth', 'products', 'admin'],
  outputDir: path.join(__dirname, '../translation-reports'),
};

// Types
interface TranslationKey {
  key: string;
  namespace: string;
  file: string;
  line: number;
  context?: string;
}

interface TranslationReport {
  language: string;
  namespace: string;
  totalKeys: number;
  translatedKeys: number;
  missingKeys: string[];
  completeness: number;
}

interface ValidationResult {
  reports: TranslationReport[];
  unusedKeys: string[];
  extractedKeys: TranslationKey[];
  summary: {
    totalFiles: number;
    totalKeys: number;
    averageCompleteness: number;
  };
}

/**
 * Extract translation keys from source files
 */
async function extractTranslationKeys(): Promise<TranslationKey[]> {
  const extractedKeys: TranslationKey[] = [];
  
  // Find all TypeScript/JavaScript files
  const files = await glob('**/*.{ts,tsx,js,jsx}', {
    cwd: CONFIG.srcDir,
    ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'],
  });

  console.log(`🔍 Scanning ${files.length} files for translation keys...`);

  for (const file of files) {
    const filePath = path.join(CONFIG.srcDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Regex patterns to match translation usage
    const patterns = [
      // t('key') or t("key")
      /\bt\s*\(\s*['"`]([^'"`]+)['"`]/g,
      // useTranslation().t('key')
      /\.t\s*\(\s*['"`]([^'"`]+)['"`]/g,
      // i18n.t('key')
      /i18n\.t\s*\(\s*['"`]([^'"`]+)['"`]/g,
      // useAppTranslation('namespace').t('key')
      /useAppTranslation\s*\(\s*['"`]([^'"`]+)['"`]\).*\.t\s*\(\s*['"`]([^'"`]+)['"`]/g,
    ];

    lines.forEach((line, lineIndex) => {
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const fullKey = match[1] || match[2];
          if (fullKey) {
            const [namespace, ...keyParts] = fullKey.split('.');
            const key = keyParts.join('.');
            
            // Validate namespace
            if (CONFIG.namespaces.includes(namespace) && key) {
              extractedKeys.push({
                key: fullKey,
                namespace,
                file,
                line: lineIndex + 1,
                context: line.trim(),
              });
            }
          }
        }
      });
    });
  }

  console.log(`✅ Extracted ${extractedKeys.length} translation keys`);
  return extractedKeys;
}

/**
 * Load translation files
 */
function loadTranslations(language: string, namespace: string): Record<string, any> {
  const filePath = path.join(CONFIG.translationDir, language, `${namespace}.json`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`⚠️  Could not load ${filePath}: ${error}`);
    return {};
  }
}

/**
 * Get all keys from a nested object with dot notation
 */
function getAllKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = [];
  
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
 * Validate translation completeness
 */
function validateTranslations(extractedKeys: TranslationKey[]): ValidationResult {
  const reports: TranslationReport[] = [];
  const allTranslationKeys = new Set<string>();
  
  // Group extracted keys by namespace
  const keysByNamespace = extractedKeys.reduce((acc, key) => {
    if (!acc[key.namespace]) {
      acc[key.namespace] = new Set();
    }
    acc[key.namespace].add(key.key);
    allTranslationKeys.add(key.key);
    return acc;
  }, {} as Record<string, Set<string>>);

  // Validate each language and namespace
  for (const language of CONFIG.supportedLanguages) {
    for (const namespace of CONFIG.namespaces) {
      const translations = loadTranslations(language, namespace);
      const availableKeys = getAllKeys(translations).map(key => `${namespace}.${key}`);
      const availableKeySet = new Set(availableKeys);
      
      const requiredKeys = Array.from(keysByNamespace[namespace] || []);
      const missingKeys = requiredKeys.filter(key => !availableKeySet.has(key));
      
      const report: TranslationReport = {
        language,
        namespace,
        totalKeys: requiredKeys.length,
        translatedKeys: requiredKeys.length - missingKeys.length,
        missingKeys,
        completeness: requiredKeys.length > 0 
          ? Math.round(((requiredKeys.length - missingKeys.length) / requiredKeys.length) * 100)
          : 100,
      };
      
      reports.push(report);
    }
  }

  // Find unused keys (keys in translation files but not used in code)
  const usedKeys = new Set(extractedKeys.map(k => k.key));
  const unusedKeys: string[] = [];
  
  for (const language of CONFIG.supportedLanguages) {
    for (const namespace of CONFIG.namespaces) {
      const translations = loadTranslations(language, namespace);
      const availableKeys = getAllKeys(translations).map(key => `${namespace}.${key}`);
      
      for (const key of availableKeys) {
        if (!usedKeys.has(key) && !unusedKeys.includes(key)) {
          unusedKeys.push(key);
        }
      }
    }
  }

  // Calculate summary
  const totalKeys = extractedKeys.length;
  const averageCompleteness = reports.length > 0 
    ? Math.round(reports.reduce((sum, r) => sum + r.completeness, 0) / reports.length)
    : 0;

  return {
    reports,
    unusedKeys,
    extractedKeys,
    summary: {
      totalFiles: new Set(extractedKeys.map(k => k.file)).size,
      totalKeys,
      averageCompleteness,
    },
  };
}

/**
 * Generate HTML report
 */
function generateHTMLReport(result: ValidationResult): string {
  const { reports, unusedKeys, extractedKeys, summary } = result;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Translation Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; color: #1e40af; }
        .stat-label { color: #64748b; font-size: 0.9em; margin-top: 5px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; color: #374151; }
        .completeness { font-weight: bold; }
        .completeness.high { color: #059669; }
        .completeness.medium { color: #d97706; }
        .completeness.low { color: #dc2626; }
        .missing-keys { background: #fef2f2; border-left: 4px solid #ef4444; padding: 10px; margin: 10px 0; }
        .unused-keys { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 10px; margin: 10px 0; }
        .key-list { font-family: 'Monaco', 'Menlo', monospace; font-size: 0.9em; }
        .timestamp { color: #64748b; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Translation Report</h1>
            <p class="timestamp">Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="content">
            <div class="summary">
                <div class="stat-card">
                    <div class="stat-value">${summary.totalFiles}</div>
                    <div class="stat-label">Files Scanned</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${summary.totalKeys}</div>
                    <div class="stat-label">Translation Keys</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${summary.averageCompleteness}%</div>
                    <div class="stat-label">Average Completeness</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${unusedKeys.length}</div>
                    <div class="stat-label">Unused Keys</div>
                </div>
            </div>

            <div class="section">
                <h2>Translation Completeness by Language & Namespace</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Language</th>
                            <th>Namespace</th>
                            <th>Total Keys</th>
                            <th>Translated</th>
                            <th>Missing</th>
                            <th>Completeness</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reports.map(report => `
                            <tr>
                                <td>${report.language.toUpperCase()}</td>
                                <td>${report.namespace}</td>
                                <td>${report.totalKeys}</td>
                                <td>${report.translatedKeys}</td>
                                <td>${report.missingKeys.length}</td>
                                <td class="completeness ${report.completeness >= 90 ? 'high' : report.completeness >= 70 ? 'medium' : 'low'}">
                                    ${report.completeness}%
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            ${reports.filter(r => r.missingKeys.length > 0).length > 0 ? `
            <div class="section">
                <h2>Missing Translations</h2>
                ${reports.filter(r => r.missingKeys.length > 0).map(report => `
                    <div class="missing-keys">
                        <h3>${report.language.toUpperCase()} - ${report.namespace}</h3>
                        <div class="key-list">
                            ${report.missingKeys.map(key => `<div>• ${key}</div>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            ${unusedKeys.length > 0 ? `
            <div class="section">
                <h2>Unused Translation Keys</h2>
                <div class="unused-keys">
                    <p>These keys exist in translation files but are not used in the codebase:</p>
                    <div class="key-list">
                        ${unusedKeys.map(key => `<div>• ${key}</div>`).join('')}
                    </div>
                </div>
            </div>
            ` : ''}

            <div class="section">
                <h2>Extracted Keys by File</h2>
                <table>
                    <thead>
                        <tr>
                            <th>File</th>
                            <th>Line</th>
                            <th>Key</th>
                            <th>Context</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${extractedKeys.slice(0, 100).map(key => `
                            <tr>
                                <td>${key.file}</td>
                                <td>${key.line}</td>
                                <td class="key-list">${key.key}</td>
                                <td><code>${key.context || ''}</code></td>
                            </tr>
                        `).join('')}
                        ${extractedKeys.length > 100 ? `
                            <tr>
                                <td colspan="4" style="text-align: center; color: #64748b; font-style: italic;">
                                    ... and ${extractedKeys.length - 100} more keys
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim();
}

/**
 * Generate JSON report
 */
function generateJSONReport(result: ValidationResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting translation analysis...\n');

  try {
    // Ensure output directory exists
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    // Extract keys and validate translations
    const extractedKeys = await extractTranslationKeys();
    const validationResult = validateTranslations(extractedKeys);

    // Generate reports
    const htmlReport = generateHTMLReport(validationResult);
    const jsonReport = generateJSONReport(validationResult);

    // Write reports to files
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const htmlPath = path.join(CONFIG.outputDir, `translation-report-${timestamp}.html`);
    const jsonPath = path.join(CONFIG.outputDir, `translation-report-${timestamp}.json`);

    fs.writeFileSync(htmlPath, htmlReport);
    fs.writeFileSync(jsonPath, jsonReport);

    // Print summary
    console.log('\n📊 Translation Analysis Summary:');
    console.log(`   Files scanned: ${validationResult.summary.totalFiles}`);
    console.log(`   Translation keys found: ${validationResult.summary.totalKeys}`);
    console.log(`   Average completeness: ${validationResult.summary.averageCompleteness}%`);
    console.log(`   Unused keys: ${validationResult.unusedKeys.length}`);

    console.log('\n📋 Completeness by Language:');
    const byLanguage = validationResult.reports.reduce((acc, report) => {
      if (!acc[report.language]) {
        acc[report.language] = { total: 0, translated: 0 };
      }
      acc[report.language].total += report.totalKeys;
      acc[report.language].translated += report.translatedKeys;
      return acc;
    }, {} as Record<string, { total: number; translated: number }>);

    Object.entries(byLanguage).forEach(([lang, stats]) => {
      const completeness = stats.total > 0 ? Math.round((stats.translated / stats.total) * 100) : 100;
      console.log(`   ${lang.toUpperCase()}: ${completeness}% (${stats.translated}/${stats.total})`);
    });

    console.log(`\n📄 Reports generated:`);
    console.log(`   HTML: ${htmlPath}`);
    console.log(`   JSON: ${jsonPath}`);

    // Exit with error code if translations are incomplete
    const hasIncompleteTranslations = validationResult.reports.some(r => r.completeness < 100);
    if (hasIncompleteTranslations) {
      console.log('\n⚠️  Some translations are incomplete. Check the report for details.');
      process.exit(1);
    } else {
      console.log('\n✅ All translations are complete!');
    }

  } catch (error) {
    console.error('❌ Error during translation analysis:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

export {
  extractTranslationKeys,
  validateTranslations,
  generateHTMLReport,
  generateJSONReport,
  CONFIG,
};