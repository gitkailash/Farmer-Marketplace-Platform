#!/usr/bin/env node

/**
 * Translation Optimization Script
 * Handles compression, minification, and optimization of translation files
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

// Configuration
const CONFIG = {
  translationsDir: path.join(__dirname, '../frontend/src/i18n/locales'),
  outputDir: path.join(__dirname, '../frontend/dist/translations'),
  cdnEndpoint: process.env.CDN_ENDPOINT || 'https://cdn.farmer-marketplace.gov.np',
  version: process.env.TRANSLATION_VERSION || generateVersion(),
  environment: process.env.NODE_ENV || 'development'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateVersion() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
}

function generateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 8);
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function minifyJson(jsonContent) {
  try {
    const parsed = JSON.parse(jsonContent);
    return JSON.stringify(parsed);
  } catch (error) {
    log(`Error minifying JSON: ${error.message}`, 'red');
    return jsonContent;
  }
}

function compressContent(content) {
  const gzipped = zlib.gzipSync(content);
  const brotli = zlib.brotliCompressSync ? zlib.brotliCompressSync(content) : null;
  
  return {
    original: Buffer.from(content),
    gzip: gzipped,
    brotli: brotli
  };
}

function processTranslationFile(filePath, language, namespace) {
  log(`  📄 Processing: ${namespace}.json`, 'yellow');
  
  const content = fs.readFileSync(filePath, 'utf8');
  const minified = minifyJson(content);
  const hash = generateHash(minified);
  const compressed = compressContent(minified);
  
  // Create versioned filename
  const versionedName = `${namespace}.${hash}.json`;
  
  // Ensure output directories exist
  const langDir = path.join(CONFIG.outputDir, language);
  const versionedDir = path.join(CONFIG.outputDir, 'versioned', language);
  const compressedDir = path.join(CONFIG.outputDir, 'compressed', language);
  
  ensureDirectoryExists(langDir);
  ensureDirectoryExists(versionedDir);
  ensureDirectoryExists(compressedDir);
  
  // Write files
  fs.writeFileSync(path.join(langDir, `${namespace}.json`), minified);
  fs.writeFileSync(path.join(versionedDir, versionedName), minified);
  
  // Write compressed versions
  fs.writeFileSync(path.join(compressedDir, `${namespace}.json`), compressed.original);
  fs.writeFileSync(path.join(compressedDir, `${namespace}.json.gz`), compressed.gzip);
  fs.writeFileSync(path.join(versionedDir, `${versionedName}.gz`), compressed.gzip);
  
  if (compressed.brotli) {
    fs.writeFileSync(path.join(compressedDir, `${namespace}.json.br`), compressed.brotli);
    fs.writeFileSync(path.join(versionedDir, `${versionedName}.br`), compressed.brotli);
  }
  
  return {
    namespace,
    hash,
    originalSize: content.length,
    minifiedSize: minified.length,
    gzipSize: compressed.gzip.length,
    brotliSize: compressed.brotli ? compressed.brotli.length : null,
    url: `${CONFIG.cdnEndpoint}/${CONFIG.version}/${language}/${versionedName}`
  };
}

function generateManifest(processedFiles) {
  const manifest = {
    version: CONFIG.version,
    timestamp: new Date().toISOString(),
    environment: CONFIG.environment,
    cdnEndpoint: CONFIG.cdnEndpoint,
    files: {}
  };
  
  processedFiles.forEach(file => {
    const key = `${file.language}/${file.namespace}`;
    manifest.files[key] = {
      hash: file.hash,
      originalSize: file.originalSize,
      minifiedSize: file.minifiedSize,
      gzipSize: file.gzipSize,
      brotliSize: file.brotliSize,
      url: file.url,
      compressionRatio: (file.gzipSize / file.originalSize * 100).toFixed(2) + '%'
    };
  });
  
  return manifest;
}

function generateIntegrityFile(processedFiles) {
  const integrity = {
    version: CONFIG.version,
    algorithm: 'sha256',
    checksums: {}
  };
  
  processedFiles.forEach(file => {
    const key = `${file.language}/${file.namespace}.${file.hash}.json`;
    integrity.checksums[key] = `sha256-${file.hash}`;
  });
  
  return integrity;
}

function updateVersionHistory(manifest) {
  const versionsFile = path.join(CONFIG.outputDir, 'versions.json');
  let versions = { current: CONFIG.version, versions: [] };
  
  if (fs.existsSync(versionsFile)) {
    try {
      versions = JSON.parse(fs.readFileSync(versionsFile, 'utf8'));
    } catch (error) {
      log(`Warning: Could not read existing versions file: ${error.message}`, 'yellow');
    }
  }
  
  // Add new version
  const newVersion = {
    version: CONFIG.version,
    timestamp: new Date().toISOString(),
    environment: CONFIG.environment,
    fileCount: Object.keys(manifest.files).length,
    totalSize: Object.values(manifest.files).reduce((sum, file) => sum + file.originalSize, 0),
    compressedSize: Object.values(manifest.files).reduce((sum, file) => sum + file.gzipSize, 0)
  };
  
  versions.versions.unshift(newVersion);
  versions.versions = versions.versions.slice(0, 10); // Keep only last 10 versions
  versions.current = CONFIG.version;
  
  return versions;
}

function generateDeploymentReport(processedFiles, manifest) {
  const totalOriginalSize = processedFiles.reduce((sum, file) => sum + file.originalSize, 0);
  const totalGzipSize = processedFiles.reduce((sum, file) => sum + file.gzipSize, 0);
  const compressionRatio = ((totalGzipSize / totalOriginalSize) * 100).toFixed(2);
  
  const report = `
Translation Assets Optimization Report
=====================================

Version: ${CONFIG.version}
Environment: ${CONFIG.environment}
Timestamp: ${new Date().toISOString()}
CDN Endpoint: ${CONFIG.cdnEndpoint}

Summary:
--------
Files Processed: ${processedFiles.length}
Languages: ${[...new Set(processedFiles.map(f => f.language))].join(', ')}
Namespaces: ${[...new Set(processedFiles.map(f => f.namespace))].join(', ')}

Size Analysis:
--------------
Original Total: ${(totalOriginalSize / 1024).toFixed(2)} KB
Minified Total: ${(processedFiles.reduce((sum, file) => sum + file.minifiedSize, 0) / 1024).toFixed(2)} KB
Gzipped Total: ${(totalGzipSize / 1024).toFixed(2)} KB
Compression Ratio: ${compressionRatio}%
Space Saved: ${((totalOriginalSize - totalGzipSize) / 1024).toFixed(2)} KB

File Details:
-------------
${processedFiles.map(file => 
  `${file.language}/${file.namespace}: ${(file.originalSize / 1024).toFixed(2)} KB → ${(file.gzipSize / 1024).toFixed(2)} KB (${((file.gzipSize / file.originalSize) * 100).toFixed(1)}%)`
).join('\n')}

CDN URLs:
---------
${processedFiles.map(file => `${file.language}/${file.namespace}: ${file.url}`).join('\n')}

Status: SUCCESS
Generated: ${new Date().toISOString()}
`;
  
  return report;
}

async function main() {
  try {
    log('🌐 Starting translation optimization process', 'green');
    log(`📦 Version: ${CONFIG.version}`, 'blue');
    log(`🏗️ Environment: ${CONFIG.environment}`, 'blue');
    
    // Ensure output directory exists
    ensureDirectoryExists(CONFIG.outputDir);
    
    const processedFiles = [];
    
    // Process each language directory
    const languageDirs = fs.readdirSync(CONFIG.translationsDir).filter(item => {
      const itemPath = path.join(CONFIG.translationsDir, item);
      return fs.statSync(itemPath).isDirectory();
    });
    
    for (const language of languageDirs) {
      log(`📁 Processing language: ${language}`, 'blue');
      const langPath = path.join(CONFIG.translationsDir, language);
      
      const translationFiles = fs.readdirSync(langPath).filter(file => file.endsWith('.json'));
      
      for (const file of translationFiles) {
        const namespace = path.basename(file, '.json');
        const filePath = path.join(langPath, file);
        
        const result = processTranslationFile(filePath, language, namespace);
        result.language = language;
        processedFiles.push(result);
      }
    }
    
    // Generate manifest
    log('📋 Generating manifest file...', 'yellow');
    const manifest = generateManifest(processedFiles);
    fs.writeFileSync(
      path.join(CONFIG.outputDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    // Generate integrity file
    log('🔐 Generating integrity checksums...', 'yellow');
    const integrity = generateIntegrityFile(processedFiles);
    fs.writeFileSync(
      path.join(CONFIG.outputDir, 'integrity.json'),
      JSON.stringify(integrity, null, 2)
    );
    
    // Update version history
    log('📚 Updating version history...', 'yellow');
    const versions = updateVersionHistory(manifest);
    fs.writeFileSync(
      path.join(CONFIG.outputDir, 'versions.json'),
      JSON.stringify(versions, null, 2)
    );
    
    // Generate deployment report
    log('📊 Generating deployment report...', 'yellow');
    const report = generateDeploymentReport(processedFiles, manifest);
    fs.writeFileSync(
      path.join(CONFIG.outputDir, 'deployment-report.txt'),
      report
    );
    
    // Success summary
    log('🎉 Translation optimization completed successfully!', 'green');
    log(`📋 Summary:`, 'blue');
    log(`  Files processed: ${processedFiles.length}`, 'blue');
    log(`  Languages: ${[...new Set(processedFiles.map(f => f.language))].length}`, 'blue');
    log(`  Version: ${CONFIG.version}`, 'blue');
    log(`  Output directory: ${CONFIG.outputDir}`, 'blue');
    
    const totalOriginalSize = processedFiles.reduce((sum, file) => sum + file.originalSize, 0);
    const totalGzipSize = processedFiles.reduce((sum, file) => sum + file.gzipSize, 0);
    log(`  Original size: ${(totalOriginalSize / 1024).toFixed(2)} KB`, 'blue');
    log(`  Compressed size: ${(totalGzipSize / 1024).toFixed(2)} KB`, 'blue');
    log(`  Space saved: ${((totalOriginalSize - totalGzipSize) / 1024).toFixed(2)} KB`, 'blue');
    
  } catch (error) {
    log(`❌ Error during optimization: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  processTranslationFile,
  generateManifest,
  generateIntegrityFile,
  CONFIG
};