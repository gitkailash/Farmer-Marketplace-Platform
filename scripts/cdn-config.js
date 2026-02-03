#!/usr/bin/env node

/**
 * CDN Configuration and Upload Script
 * Supports multiple CDN providers for translation asset deployment
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// CDN Provider configurations
const CDN_PROVIDERS = {
  aws: {
    name: 'Amazon CloudFront + S3',
    upload: uploadToAWS,
    configure: configureAWS
  },
  cloudflare: {
    name: 'Cloudflare',
    upload: uploadToCloudflare,
    configure: configureCloudflare
  },
  azure: {
    name: 'Azure CDN',
    upload: uploadToAzure,
    configure: configureAzure
  },
  local: {
    name: 'Local Development',
    upload: uploadToLocal,
    configure: configureLocal
  }
};

// Configuration
const CONFIG = {
  provider: process.env.CDN_PROVIDER || 'local',
  translationsDir: path.join(__dirname, '../frontend/dist/translations'),
  version: process.env.TRANSLATION_VERSION || generateVersion(),
  environment: process.env.NODE_ENV || 'development'
};

function log(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateVersion() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
}

// AWS S3 + CloudFront Upload
async function uploadToAWS() {
  log('🚀 Uploading to AWS S3 + CloudFront...', 'blue');
  
  const bucket = process.env.AWS_S3_BUCKET || 'farmer-marketplace-translations';
  const region = process.env.AWS_REGION || 'us-east-1';
  const distributionId = process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID;
  
  try {
    // Check if AWS CLI is available
    execSync('aws --version', { stdio: 'ignore' });
    
    // Upload compressed files to S3
    const uploadCommand = `aws s3 sync "${CONFIG.translationsDir}/compressed/" "s3://${bucket}/${CONFIG.version}/" \
      --delete \
      --cache-control "public, max-age=31536000, immutable" \
      --content-encoding gzip \
      --metadata version="${CONFIG.version},environment=${CONFIG.environment}" \
      --region ${region}`;
    
    log('📤 Syncing files to S3...', 'yellow');
    execSync(uploadCommand, { stdio: 'inherit' });
    
    // Upload manifest and integrity files
    const manifestCommand = `aws s3 cp "${CONFIG.translationsDir}/manifest.json" "s3://${bucket}/${CONFIG.version}/manifest.json" \
      --cache-control "public, max-age=300" \
      --content-type "application/json" \
      --region ${region}`;
    
    execSync(manifestCommand, { stdio: 'inherit' });
    
    // Invalidate CloudFront cache if distribution ID is provided
    if (distributionId) {
      log('🔄 Invalidating CloudFront cache...', 'yellow');
      const invalidateCommand = `aws cloudfront create-invalidation \
        --distribution-id ${distributionId} \
        --paths "/${CONFIG.version}/*" \
        --region ${region}`;
      
      execSync(invalidateCommand, { stdio: 'inherit' });
    }
    
    const cdnUrl = `https://${bucket}.s3.${region}.amazonaws.com/${CONFIG.version}`;
    log(`✅ AWS upload completed. CDN URL: ${cdnUrl}`, 'green');
    
    return { success: true, url: cdnUrl };
    
  } catch (error) {
    log(`❌ AWS upload failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Cloudflare Workers KV Upload
async function uploadToCloudflare() {
  log('🚀 Uploading to Cloudflare...', 'blue');
  
  const accountId = process.env.CF_ACCOUNT_ID;
  const namespaceId = process.env.CF_NAMESPACE_ID;
  const apiToken = process.env.CF_API_TOKEN;
  const zoneId = process.env.CF_ZONE_ID;
  
  if (!accountId || !namespaceId || !apiToken) {
    throw new Error('Missing Cloudflare configuration. Please set CF_ACCOUNT_ID, CF_NAMESPACE_ID, and CF_API_TOKEN');
  }
  
  try {
    // Read manifest file
    const manifestPath = path.join(CONFIG.translationsDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Upload each translation file to KV
    for (const [key, fileInfo] of Object.entries(manifest.files)) {
      const [language, namespace] = key.split('/');
      const filePath = path.join(CONFIG.translationsDir, 'compressed', language, `${namespace}.json`);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const kvKey = `${CONFIG.version}/${key}`;
        
        await uploadToCloudflareKV(accountId, namespaceId, apiToken, kvKey, content);
        log(`📤 Uploaded: ${kvKey}`, 'yellow');
      }
    }
    
    // Upload manifest
    await uploadToCloudflareKV(
      accountId, 
      namespaceId, 
      apiToken, 
      `${CONFIG.version}/manifest.json`, 
      JSON.stringify(manifest)
    );
    
    // Purge cache if zone ID is provided
    if (zoneId) {
      await purgeCloudflareCache(zoneId, apiToken, [`https://cdn.farmer-marketplace.gov.np/${CONFIG.version}/*`]);
    }
    
    const cdnUrl = `https://cdn.farmer-marketplace.gov.np/${CONFIG.version}`;
    log(`✅ Cloudflare upload completed. CDN URL: ${cdnUrl}`, 'green');
    
    return { success: true, url: cdnUrl };
    
  } catch (error) {
    log(`❌ Cloudflare upload failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function uploadToCloudflareKV(accountId, namespaceId, apiToken, key, value) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify([{ key, value }]);
    
    const options = {
      hostname: 'api.cloudflare.com',
      port: 443,
      path: `/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/bulk`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function purgeCloudflareCache(zoneId, apiToken, urls) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ files: urls });
    
    const options = {
      hostname: 'api.cloudflare.com',
      port: 443,
      path: `/client/v4/zones/${zoneId}/purge_cache`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Azure CDN Upload
async function uploadToAzure() {
  log('🚀 Uploading to Azure CDN...', 'blue');
  
  const storageAccount = process.env.AZURE_STORAGE_ACCOUNT;
  const containerName = process.env.AZURE_CONTAINER_NAME || 'translations';
  const cdnProfile = process.env.AZURE_CDN_PROFILE;
  const cdnEndpoint = process.env.AZURE_CDN_ENDPOINT;
  
  try {
    // Check if Azure CLI is available
    execSync('az --version', { stdio: 'ignore' });
    
    // Upload files to Azure Blob Storage
    const uploadCommand = `az storage blob upload-batch \
      --destination ${containerName} \
      --source "${CONFIG.translationsDir}/compressed" \
      --destination-path "${CONFIG.version}" \
      --account-name ${storageAccount} \
      --content-encoding gzip \
      --content-cache-control "public, max-age=31536000"`;
    
    log('📤 Uploading to Azure Blob Storage...', 'yellow');
    execSync(uploadCommand, { stdio: 'inherit' });
    
    // Purge CDN cache if profile and endpoint are provided
    if (cdnProfile && cdnEndpoint) {
      log('🔄 Purging Azure CDN cache...', 'yellow');
      const purgeCommand = `az cdn endpoint purge \
        --profile-name ${cdnProfile} \
        --name ${cdnEndpoint} \
        --content-paths "/${CONFIG.version}/*"`;
      
      execSync(purgeCommand, { stdio: 'inherit' });
    }
    
    const cdnUrl = `https://${storageAccount}.blob.core.windows.net/${containerName}/${CONFIG.version}`;
    log(`✅ Azure upload completed. CDN URL: ${cdnUrl}`, 'green');
    
    return { success: true, url: cdnUrl };
    
  } catch (error) {
    log(`❌ Azure upload failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Local Development Upload (simulation)
async function uploadToLocal() {
  log('🧪 Simulating CDN upload for local development...', 'blue');
  
  const localCdnDir = path.join(__dirname, '../frontend/dist/cdn');
  const versionDir = path.join(localCdnDir, CONFIG.version);
  
  // Create local CDN directory structure
  if (!fs.existsSync(versionDir)) {
    fs.mkdirSync(versionDir, { recursive: true });
  }
  
  // Copy compressed files to local CDN directory
  const compressedDir = path.join(CONFIG.translationsDir, 'compressed');
  if (fs.existsSync(compressedDir)) {
    // Use Node.js fs operations instead of shell commands for Windows compatibility
    const copyRecursive = (src, dest) => {
      const stats = fs.statSync(src);
      if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        const files = fs.readdirSync(src);
        files.forEach(file => {
          copyRecursive(path.join(src, file), path.join(dest, file));
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };
    
    copyRecursive(compressedDir, versionDir);
  }
  
  // Copy manifest and integrity files
  const manifestPath = path.join(CONFIG.translationsDir, 'manifest.json');
  const integrityPath = path.join(CONFIG.translationsDir, 'integrity.json');
  
  if (fs.existsSync(manifestPath)) {
    fs.copyFileSync(manifestPath, path.join(versionDir, 'manifest.json'));
  }
  
  if (fs.existsSync(integrityPath)) {
    fs.copyFileSync(integrityPath, path.join(versionDir, 'integrity.json'));
  }
  
  const cdnUrl = `http://localhost:3000/cdn/${CONFIG.version}`;
  log(`✅ Local CDN simulation completed. URL: ${cdnUrl}`, 'green');
  
  return { success: true, url: cdnUrl };
}

// Configuration functions
function configureAWS() {
  log('⚙️ AWS Configuration:', 'blue');
  log('Required environment variables:', 'yellow');
  log('  AWS_S3_BUCKET - S3 bucket name for translations', 'yellow');
  log('  AWS_REGION - AWS region (default: us-east-1)', 'yellow');
  log('  AWS_CLOUDFRONT_DISTRIBUTION_ID - CloudFront distribution ID (optional)', 'yellow');
  log('  AWS_ACCESS_KEY_ID - AWS access key', 'yellow');
  log('  AWS_SECRET_ACCESS_KEY - AWS secret key', 'yellow');
}

function configureCloudflare() {
  log('⚙️ Cloudflare Configuration:', 'blue');
  log('Required environment variables:', 'yellow');
  log('  CF_ACCOUNT_ID - Cloudflare account ID', 'yellow');
  log('  CF_NAMESPACE_ID - Workers KV namespace ID', 'yellow');
  log('  CF_API_TOKEN - Cloudflare API token', 'yellow');
  log('  CF_ZONE_ID - Zone ID for cache purging (optional)', 'yellow');
}

function configureAzure() {
  log('⚙️ Azure Configuration:', 'blue');
  log('Required environment variables:', 'yellow');
  log('  AZURE_STORAGE_ACCOUNT - Azure storage account name', 'yellow');
  log('  AZURE_CONTAINER_NAME - Blob container name (default: translations)', 'yellow');
  log('  AZURE_CDN_PROFILE - CDN profile name (optional)', 'yellow');
  log('  AZURE_CDN_ENDPOINT - CDN endpoint name (optional)', 'yellow');
}

function configureLocal() {
  log('⚙️ Local Development Configuration:', 'blue');
  log('No additional configuration required.', 'green');
  log('Files will be copied to frontend/dist/cdn/', 'yellow');
}

async function main() {
  const command = process.argv[2];
  
  if (command === 'configure') {
    const provider = process.argv[3] || CONFIG.provider;
    if (CDN_PROVIDERS[provider]) {
      CDN_PROVIDERS[provider].configure();
    } else {
      log(`❌ Unknown provider: ${provider}`, 'red');
      log(`Available providers: ${Object.keys(CDN_PROVIDERS).join(', ')}`, 'yellow');
      process.exit(1);
    }
    return;
  }
  
  if (command === 'upload' || !command) {
    const provider = CDN_PROVIDERS[CONFIG.provider];
    
    if (!provider) {
      log(`❌ Unknown CDN provider: ${CONFIG.provider}`, 'red');
      log(`Available providers: ${Object.keys(CDN_PROVIDERS).join(', ')}`, 'yellow');
      process.exit(1);
    }
    
    log(`🌐 Starting CDN upload with ${provider.name}`, 'green');
    log(`📦 Version: ${CONFIG.version}`, 'blue');
    log(`🏗️ Environment: ${CONFIG.environment}`, 'blue');
    
    try {
      const result = await provider.upload();
      
      if (result.success) {
        log('🎉 CDN upload completed successfully!', 'green');
        
        // Update CDN configuration file
        const cdnConfigPath = path.join(CONFIG.translationsDir, 'cdn-config.json');
        const cdnConfig = {
          provider: CONFIG.provider,
          version: CONFIG.version,
          url: result.url,
          timestamp: new Date().toISOString(),
          environment: CONFIG.environment
        };
        
        fs.writeFileSync(cdnConfigPath, JSON.stringify(cdnConfig, null, 2));
        log(`📋 CDN configuration saved to: ${cdnConfigPath}`, 'blue');
        
      } else {
        log(`❌ CDN upload failed: ${result.error}`, 'red');
        process.exit(1);
      }
      
    } catch (error) {
      log(`❌ CDN upload error: ${error.message}`, 'red');
      process.exit(1);
    }
  } else {
    log('Usage:', 'blue');
    log('  node cdn-config.js upload          - Upload translations to CDN', 'yellow');
    log('  node cdn-config.js configure [provider] - Show configuration for provider', 'yellow');
    log('', 'reset');
    log('Available providers:', 'blue');
    Object.entries(CDN_PROVIDERS).forEach(([key, provider]) => {
      log(`  ${key.padEnd(12)} - ${provider.name}`, 'yellow');
    });
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  CDN_PROVIDERS,
  CONFIG,
  uploadToAWS,
  uploadToCloudflare,
  uploadToAzure,
  uploadToLocal
};