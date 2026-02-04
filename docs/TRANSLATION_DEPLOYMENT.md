# Translation Assets Deployment Guide

[![CDN](https://img.shields.io/badge/CDN-Multi%20Provider-orange)](https://www.cloudflare.com/)
[![AWS S3](https://img.shields.io/badge/AWS-S3-FF9900?logo=amazon-s3&logoColor=white)](https://aws.amazon.com/s3/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-CDN-F38020?logo=cloudflare&logoColor=white)](https://www.cloudflare.com/)
[![Azure](https://img.shields.io/badge/Azure-CDN-0078D4?logo=microsoft-azure&logoColor=white)](https://azure.microsoft.com/en-us/services/cdn/)
[![Compression](https://img.shields.io/badge/Compression-Gzip%20%7C%20Brotli-green)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Compression)
[![Versioning](https://img.shields.io/badge/Versioning-Content%20Hash-blue)](https://webpack.js.org/guides/caching/)
[![i18next](https://img.shields.io/badge/i18next-25.7+-26A69A?logo=i18next&logoColor=white)](https://www.i18next.com/)

This guide explains how to deploy translation assets to CDN for the Farmer Marketplace Platform's internationalization system.

## Overview

The translation deployment system provides:

- **Compression and Optimization**: Minifies JSON files and applies gzip/brotli compression
- **Versioning**: Creates versioned URLs with content hashes for cache busting
- **CDN Support**: Supports multiple CDN providers (AWS, Cloudflare, Azure, Local)
- **Integrity Checking**: Generates checksums for security validation
- **Caching Strategy**: Implements service worker caching for offline support

## Quick Start

### 1. Optimize and Deploy Translations

```bash
# From frontend directory
npm run translations:deploy
```

This command will:
- Optimize all translation files
- Generate versioned assets with content hashes
- Upload to the configured CDN provider
- Create manifest and integrity files

### 2. Deploy to Specific CDN Provider

```bash
# Deploy to AWS S3 + CloudFront
npm run translations:deploy:aws

# Deploy to Cloudflare
npm run translations:deploy:cloudflare

# Deploy to Azure CDN
npm run translations:deploy:azure
```

## File Structure

After deployment, the following structure is created:

```
frontend/dist/translations/
├── manifest.json              # File manifest with URLs and metadata
├── integrity.json             # Security checksums
├── versions.json              # Version history
├── cdn-config.json           # CDN configuration
├── deployment-report.txt     # Deployment summary
├── en/                       # Original English files
├── ne/                       # Original Nepali files
├── versioned/                # Versioned files with hashes
│   ├── en/
│   │   ├── common.abc12345.json
│   │   └── auth.def67890.json
│   └── ne/
├── compressed/               # Compressed files
│   ├── en/
│   │   ├── common.json.gz
│   │   └── common.json.br
│   └── ne/
└── cdn/                      # Local CDN simulation
    └── 20260110-153632/
```

## CDN Provider Configuration

### AWS S3 + CloudFront

Set environment variables:

```bash
export CDN_PROVIDER=aws
export AWS_S3_BUCKET=farmer-marketplace-translations
export AWS_REGION=us-east-1
export AWS_CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Cloudflare Workers KV

Set environment variables:

```bash
export CDN_PROVIDER=cloudflare
export CF_ACCOUNT_ID=your-account-id
export CF_NAMESPACE_ID=your-namespace-id
export CF_API_TOKEN=your-api-token
export CF_ZONE_ID=your-zone-id  # Optional for cache purging
```

### Azure CDN

Set environment variables:

```bash
export CDN_PROVIDER=azure
export AZURE_STORAGE_ACCOUNT=your-storage-account
export AZURE_CONTAINER_NAME=translations
export AZURE_CDN_PROFILE=your-cdn-profile
export AZURE_CDN_ENDPOINT=your-cdn-endpoint
```

### Local Development

No configuration required. Files are copied to `frontend/dist/cdn/` for local testing.

## Scripts Reference

### Core Scripts

- `scripts/optimize-translations.js` - Optimizes and compresses translation files
- `scripts/cdn-config.js` - Handles CDN uploads and configuration
- `scripts/deploy-translations.sh` - Bash script for complete deployment workflow

### NPM Scripts

```json
{
  "translations:optimize": "node ../scripts/optimize-translations.js",
  "translations:deploy": "npm run translations:optimize && node ../scripts/cdn-config.js upload",
  "translations:deploy:aws": "CDN_PROVIDER=aws npm run translations:deploy",
  "translations:deploy:cloudflare": "CDN_PROVIDER=cloudflare npm run translations:deploy",
  "translations:deploy:azure": "CDN_PROVIDER=azure npm run translations:deploy",
  "translations:configure": "node ../scripts/cdn-config.js configure"
}
```

## Manifest File Format

The `manifest.json` file contains metadata about deployed translations:

```json
{
  "version": "20260110-153632",
  "timestamp": "2026-01-10T09:51:32.123Z",
  "environment": "production",
  "cdnEndpoint": "https://cdn.farmer-marketplace.gov.np",
  "files": {
    "en/common": {
      "hash": "abc12345",
      "originalSize": 5149,
      "minifiedSize": 4009,
      "gzipSize": 1665,
      "brotliSize": 1354,
      "url": "https://cdn.farmer-marketplace.gov.np/20260110-153632/en/common.abc12345.json",
      "compressionRatio": "32.34%"
    }
  }
}
```

## Frontend Integration

### Loading Translations from CDN

```typescript
import { translationLoader } from '@/config/translations';

// Load translation for specific language and namespace
const translations = await translationLoader.loadTranslation('ne', 'common');

// Preload translations for better performance
await translationLoader.preloadTranslations('ne', ['common', 'auth', 'products']);
```

### Service Worker Caching

The system includes a service worker for offline translation support:

```typescript
import { initializeTranslationServiceWorker } from '@/utils/translationServiceWorker';

// Initialize service worker (production only)
await initializeTranslationServiceWorker();
```

## Performance Optimization

### Compression Results

Typical compression ratios:
- English files: ~30-35% size reduction
- Nepali files: ~40-45% size reduction (due to Unicode characters)
- Overall: ~65% size reduction with gzip compression

### Caching Strategy

- **Versioned files**: Cached for 1 year (immutable)
- **Manifest files**: Cached for 5 minutes
- **Translation files**: Cached for 24 hours
- **Service Worker**: Provides offline fallback

### Loading Strategy

- **Lazy Loading**: Translation files loaded on-demand
- **Preloading**: Critical translations preloaded for performance
- **Fallback**: Graceful degradation to local files if CDN fails

## Deployment Workflow

### Development

```bash
# Optimize translations locally
npm run translations:optimize

# Test with local CDN simulation
npm run translations:deploy
```

### Production

```bash
# Set production environment
export NODE_ENV=production
export CDN_PROVIDER=aws  # or cloudflare/azure

# Deploy to production CDN
npm run translations:deploy
```

### CI/CD Integration

Add to your deployment pipeline:

```yaml
# GitHub Actions example
- name: Deploy Translations
  run: |
    cd frontend
    npm run translations:deploy:aws
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    AWS_S3_BUCKET: farmer-marketplace-translations
```

## Monitoring and Maintenance

### Version Management

- Versions are automatically generated with timestamp format: `YYYYMMDD-HHMMSS`
- Version history is maintained in `versions.json` (last 10 versions)
- Old versions can be cleaned up manually or via automated scripts

### Cache Management

```typescript
import { translationServiceWorker } from '@/utils/translationServiceWorker';

// Clear translation cache
await translationServiceWorker.clearCache();

// Get cache information
const cacheInfo = await translationServiceWorker.getCacheInfo();
console.log('Cache size:', cacheInfo.cacheSize);
```

### Integrity Verification

The system generates SHA-256 checksums for all translation files:

```json
{
  "version": "20260110-153632",
  "algorithm": "sha256",
  "checksums": {
    "en/common.abc12345.json": "sha256-abc12345",
    "ne/common.def67890.json": "sha256-def67890"
  }
}
```

## Troubleshooting

### Common Issues

1. **CDN Upload Fails**
   - Check environment variables
   - Verify CDN provider credentials
   - Check network connectivity

2. **Translation Files Not Loading**
   - Verify CDN URLs in manifest
   - Check CORS configuration
   - Verify service worker registration

3. **Cache Issues**
   - Clear browser cache
   - Clear service worker cache
   - Check cache headers

### Debug Mode

Enable debug logging:

```bash
export DEBUG=translation:*
npm run translations:deploy
```

### Logs and Reports

Check deployment reports:
- `frontend/dist/translations/deployment-report.txt`
- Browser console for service worker logs
- CDN provider logs for upload status

## Security Considerations

- All translation files include integrity checksums
- CDN URLs use HTTPS in production
- Service worker validates file integrity
- No sensitive data should be included in translation files

## Best Practices

1. **Version Control**: Keep translation source files in version control
2. **Automation**: Integrate deployment into CI/CD pipeline
3. **Monitoring**: Monitor CDN performance and cache hit rates
4. **Fallbacks**: Always provide local fallback files
5. **Testing**: Test translation loading in different network conditions
6. **Compression**: Use appropriate compression for your CDN provider
7. **Caching**: Configure appropriate cache headers for your use case

## Support

For issues or questions:
1. Check the deployment report for error details
2. Review CDN provider documentation
3. Check browser console for client-side errors
4. Verify environment variables and configuration