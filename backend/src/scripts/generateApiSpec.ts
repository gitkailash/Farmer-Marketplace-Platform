import fs from 'fs';
import path from 'path';
import { swaggerSpec } from '../config/swagger';

// Generate OpenAPI specification file
const generateApiSpec = () => {
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '../../docs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write OpenAPI spec to JSON file
    const specPath = path.join(outputDir, 'api-spec.json');
    fs.writeFileSync(specPath, JSON.stringify(swaggerSpec, null, 2));
    
    console.log(`✅ OpenAPI specification generated at: ${specPath}`);
    
    // Also write to frontend public directory for easy access
    const frontendPublicDir = path.join(__dirname, '../../../frontend/public');
    if (fs.existsSync(frontendPublicDir)) {
      const frontendSpecPath = path.join(frontendPublicDir, 'api-spec.json');
      fs.writeFileSync(frontendSpecPath, JSON.stringify(swaggerSpec, null, 2));
      console.log(`✅ OpenAPI specification copied to frontend: ${frontendSpecPath}`);
    }
    
    // Generate a simple HTML page for API documentation
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Farmer Marketplace API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui.css" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin:0;
            background: #fafafa;
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: './api-spec.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
            });
        };
    </script>
</body>
</html>`;
    
    const htmlPath = path.join(outputDir, 'index.html');
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`✅ API documentation HTML generated at: ${htmlPath}`);
    
  } catch (error) {
    console.error('❌ Error generating API specification:', error);
    process.exit(1);
  }
};

// Run the script
generateApiSpec();