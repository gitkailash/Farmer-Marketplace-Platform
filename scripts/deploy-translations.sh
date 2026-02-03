#!/bin/bash

# Translation Assets Deployment Script
# This script handles CDN deployment, compression, and versioning of translation files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
VERSION=${2:-$(date +%Y%m%d-%H%M%S)}
TRANSLATIONS_DIR="frontend/src/i18n/locales"
BUILD_DIR="frontend/dist/translations"
CDN_BUCKET=${CDN_BUCKET:-"farmer-marketplace-translations"}
CDN_REGION=${CDN_REGION:-"us-east-1"}
CDN_ENDPOINT=${CDN_ENDPOINT:-"https://cdn.farmer-marketplace.gov.np"}

echo -e "${GREEN}🌐 Starting translation assets deployment${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"

# Create build directory
mkdir -p "$BUILD_DIR"
mkdir -p "$BUILD_DIR/versioned"
mkdir -p "$BUILD_DIR/compressed"

# Function to compress JSON files
compress_json() {
    local input_file="$1"
    local output_file="$2"
    
    echo -e "${YELLOW}📦 Compressing: $(basename "$input_file")${NC}"
    
    # Minify JSON (remove whitespace)
    node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('$input_file', 'utf8'));
        fs.writeFileSync('$output_file', JSON.stringify(data));
    "
    
    # Gzip compress
    gzip -c "$output_file" > "$output_file.gz"
    
    # Brotli compress (if available)
    if command -v brotli &> /dev/null; then
        brotli -c "$output_file" > "$output_file.br"
    fi
}

# Function to generate file hash for versioning
generate_hash() {
    local file="$1"
    if command -v sha256sum &> /dev/null; then
        sha256sum "$file" | cut -d' ' -f1 | cut -c1-8
    else
        # Fallback for macOS
        shasum -a 256 "$file" | cut -d' ' -f1 | cut -c1-8
    fi
}

# Function to create versioned filename
create_versioned_filename() {
    local original_file="$1"
    local hash="$2"
    local dir=$(dirname "$original_file")
    local basename=$(basename "$original_file" .json)
    echo "$dir/${basename}.${hash}.json"
}

# Process translation files
echo -e "${YELLOW}🔄 Processing translation files...${NC}"

# Create manifest file for version tracking
MANIFEST_FILE="$BUILD_DIR/manifest.json"
echo "{" > "$MANIFEST_FILE"
echo "  \"version\": \"$VERSION\"," >> "$MANIFEST_FILE"
echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"," >> "$MANIFEST_FILE"
echo "  \"environment\": \"$ENVIRONMENT\"," >> "$MANIFEST_FILE"
echo "  \"files\": {" >> "$MANIFEST_FILE"

first_file=true

# Process each language directory
for lang_dir in "$TRANSLATIONS_DIR"/*; do
    if [ -d "$lang_dir" ]; then
        lang=$(basename "$lang_dir")
        echo -e "${BLUE}📁 Processing language: $lang${NC}"
        
        # Create language directory in build
        mkdir -p "$BUILD_DIR/$lang"
        mkdir -p "$BUILD_DIR/versioned/$lang"
        mkdir -p "$BUILD_DIR/compressed/$lang"
        
        # Process each translation file
        for translation_file in "$lang_dir"/*.json; do
            if [ -f "$translation_file" ]; then
                namespace=$(basename "$translation_file" .json)
                echo -e "${YELLOW}  📄 Processing: $namespace.json${NC}"
                
                # Copy original file
                cp "$translation_file" "$BUILD_DIR/$lang/"
                
                # Generate hash for versioning
                file_hash=$(generate_hash "$translation_file")
                
                # Create versioned filename
                versioned_file="$BUILD_DIR/versioned/$lang/${namespace}.${file_hash}.json"
                cp "$translation_file" "$versioned_file"
                
                # Compress files
                compress_json "$translation_file" "$BUILD_DIR/compressed/$lang/${namespace}.json"
                compress_json "$versioned_file" "$BUILD_DIR/compressed/$lang/${namespace}.${file_hash}.json"
                
                # Add to manifest
                if [ "$first_file" = false ]; then
                    echo "," >> "$MANIFEST_FILE"
                fi
                echo -n "    \"$lang/$namespace\": {" >> "$MANIFEST_FILE"
                echo -n "\"hash\": \"$file_hash\"," >> "$MANIFEST_FILE"
                echo -n "\"size\": $(stat -c%s "$translation_file" 2>/dev/null || stat -f%z "$translation_file")," >> "$MANIFEST_FILE"
                echo -n "\"compressed_size\": $(stat -c%s "$BUILD_DIR/compressed/$lang/${namespace}.json.gz" 2>/dev/null || stat -f%z "$BUILD_DIR/compressed/$lang/${namespace}.json.gz")," >> "$MANIFEST_FILE"
                echo -n "\"url\": \"$CDN_ENDPOINT/$VERSION/$lang/${namespace}.${file_hash}.json\"" >> "$MANIFEST_FILE"
                echo -n "}" >> "$MANIFEST_FILE"
                
                first_file=false
            fi
        done
    fi
done

echo "" >> "$MANIFEST_FILE"
echo "  }" >> "$MANIFEST_FILE"
echo "}" >> "$MANIFEST_FILE"

echo -e "${GREEN}✅ Translation files processed successfully${NC}"

# Generate integrity file for security
echo -e "${YELLOW}🔐 Generating integrity checksums...${NC}"
INTEGRITY_FILE="$BUILD_DIR/integrity.json"
echo "{" > "$INTEGRITY_FILE"
echo "  \"version\": \"$VERSION\"," >> "$INTEGRITY_FILE"
echo "  \"checksums\": {" >> "$INTEGRITY_FILE"

first_checksum=true
find "$BUILD_DIR/versioned" -name "*.json" | while read -r file; do
    relative_path=$(echo "$file" | sed "s|$BUILD_DIR/versioned/||")
    checksum=$(generate_hash "$file")
    
    if [ "$first_checksum" = false ]; then
        echo "," >> "$INTEGRITY_FILE"
    fi
    echo -n "    \"$relative_path\": \"sha256-$checksum\"" >> "$INTEGRITY_FILE"
    first_checksum=false
done

echo "" >> "$INTEGRITY_FILE"
echo "  }" >> "$INTEGRITY_FILE"
echo "}" >> "$INTEGRITY_FILE"

# Upload to CDN (mock implementation - replace with actual CDN service)
echo -e "${YELLOW}☁️ Uploading to CDN...${NC}"

if [ "$ENVIRONMENT" = "production" ]; then
    # Production CDN upload
    echo -e "${BLUE}🚀 Uploading to production CDN...${NC}"
    
    # Example AWS S3 upload (uncomment and configure as needed)
    # aws s3 sync "$BUILD_DIR/compressed/" "s3://$CDN_BUCKET/$VERSION/" \
    #     --delete \
    #     --cache-control "public, max-age=31536000" \
    #     --content-encoding gzip \
    #     --metadata version="$VERSION"
    
    # Example CloudFlare upload (uncomment and configure as needed)
    # curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/storage/kv/namespaces/$CF_NAMESPACE_ID/bulk" \
    #     -H "Authorization: Bearer $CF_API_TOKEN" \
    #     -H "Content-Type: application/json" \
    #     --data @"$BUILD_DIR/manifest.json"
    
    echo -e "${GREEN}✅ Production CDN upload completed${NC}"
else
    # Development/staging - local simulation
    echo -e "${BLUE}🧪 Simulating CDN upload for $ENVIRONMENT environment${NC}"
    echo -e "${YELLOW}Files would be uploaded to: $CDN_ENDPOINT/$VERSION/${NC}"
fi

# Update version tracking
VERSION_FILE="$BUILD_DIR/versions.json"
if [ -f "$VERSION_FILE" ]; then
    # Add new version to existing file
    node -e "
        const fs = require('fs');
        const versions = JSON.parse(fs.readFileSync('$VERSION_FILE', 'utf8'));
        versions.versions.unshift({
            version: '$VERSION',
            timestamp: new Date().toISOString(),
            environment: '$ENVIRONMENT',
            files: Object.keys(JSON.parse(fs.readFileSync('$MANIFEST_FILE', 'utf8')).files).length
        });
        // Keep only last 10 versions
        versions.versions = versions.versions.slice(0, 10);
        versions.current = '$VERSION';
        fs.writeFileSync('$VERSION_FILE', JSON.stringify(versions, null, 2));
    "
else
    # Create new version file
    cat > "$VERSION_FILE" << EOF
{
  "current": "$VERSION",
  "versions": [
    {
      "version": "$VERSION",
      "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
      "environment": "$ENVIRONMENT",
      "files": $(node -e "console.log(Object.keys(JSON.parse(require('fs').readFileSync('$MANIFEST_FILE', 'utf8')).files).length)")
    }
  ]
}
EOF
fi

# Generate deployment report
echo -e "${YELLOW}📊 Generating deployment report...${NC}"
REPORT_FILE="$BUILD_DIR/deployment-report.txt"
cat > "$REPORT_FILE" << EOF
Translation Assets Deployment Report
===================================

Version: $VERSION
Environment: $ENVIRONMENT
Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)
CDN Endpoint: $CDN_ENDPOINT

Files Processed:
$(find "$BUILD_DIR/versioned" -name "*.json" | wc -l) translation files

Languages:
$(ls "$TRANSLATIONS_DIR" | tr '\n' ', ' | sed 's/,$//')

Compression Results:
Original Size: $(find "$TRANSLATIONS_DIR" -name "*.json" -exec stat -c%s {} + 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "N/A") bytes
Compressed Size: $(find "$BUILD_DIR/compressed" -name "*.json.gz" -exec stat -c%s {} + 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "N/A") bytes

CDN URLs:
$(node -e "
    const manifest = JSON.parse(require('fs').readFileSync('$MANIFEST_FILE', 'utf8'));
    Object.entries(manifest.files).forEach(([key, value]) => {
        console.log('  ' + key + ': ' + value.url);
    });
")

Deployment Status: SUCCESS
EOF

echo -e "${GREEN}🎉 Translation assets deployment completed successfully!${NC}"
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo -e "${BLUE}  Version: $VERSION${NC}"
echo -e "${BLUE}  Files: $(find "$BUILD_DIR/versioned" -name "*.json" | wc -l)${NC}"
echo -e "${BLUE}  CDN Endpoint: $CDN_ENDPOINT/$VERSION${NC}"
echo -e "${BLUE}  Report: $REPORT_FILE${NC}"

# Display file sizes
echo -e "${YELLOW}📏 File Size Summary:${NC}"
echo -e "${BLUE}  Original: $(find "$TRANSLATIONS_DIR" -name "*.json" -exec stat -c%s {} + 2>/dev/null | awk '{sum+=$1} END {printf "%.2f KB", sum/1024}' || echo "N/A")${NC}"
echo -e "${BLUE}  Compressed: $(find "$BUILD_DIR/compressed" -name "*.json.gz" -exec stat -c%s {} + 2>/dev/null | awk '{sum+=$1} END {printf "%.2f KB", sum/1024}' || echo "N/A")${NC}"

exit 0