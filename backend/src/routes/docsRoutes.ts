import { Router, Request, Response } from 'express';
import { swaggerSpec } from '../config/swagger';
import path from 'path';
import fs from 'fs';

const router = Router();

/**
 * @route   GET /api/docs
 * @desc    Get API documentation in JSON format
 * @access  Public
 */
router.get('/', (req: Request, res: Response) => {
  res.json(swaggerSpec);
});

/**
 * @route   GET /api/docs/ui
 * @desc    Get API documentation UI
 * @access  Public
 */
router.get('/ui', (req: Request, res: Response) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Farmer Marketplace API Documentation</title>
    <link rel="stylesheet" type="text/css" href="/api/docs/swagger-ui.css" />
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
            margin: 0; 
            background: #fafafa; 
        }
        .swagger-ui .topbar { 
            display: none; 
        }
        .swagger-ui .info .title { 
            color: #2563eb; 
        }
        .swagger-ui .info { 
            margin: 50px 0; 
        }
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: Arial, sans-serif;
            font-size: 18px;
            color: #666;
        }
        .fallback-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            font-family: Arial, sans-serif;
        }
        .endpoint {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin: 10px 0;
            padding: 15px;
        }
        .method {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            margin-right: 10px;
        }
        .method.get { background: #61affe; }
        .method.post { background: #49cc90; }
        .method.put { background: #fca130; }
        .method.delete { background: #f93e3e; }
    </style>
</head>
<body>
    <div id="swagger-ui">
        <div class="loading">Loading API Documentation...</div>
    </div>
    
    <!-- Fallback content if Swagger UI fails to load -->
    <div id="fallback-content" style="display: none;">
        <div class="fallback-container">
            <h1>🚀 Farmer Marketplace API Documentation</h1>
            <p><strong>API Base URL:</strong> <code>http://localhost:3000/api</code></p>
            <p><strong>JSON Specification:</strong> <a href="/api/docs" target="_blank">View JSON Spec</a></p>
            
            <h2>🔐 Authentication</h2>
            <p>Use JWT Bearer tokens in the Authorization header:</p>
            <code>Authorization: Bearer &lt;your-jwt-token&gt;</code>
            
            <h2>📚 Available Endpoints</h2>
            <div id="endpoints-list"></div>
            
            <h2>💡 Alternative Documentation</h2>
            <p>If the interactive UI doesn't load, you can:</p>
            <ul>
                <li>Import the <a href="/api/docs" target="_blank">JSON specification</a> into Postman</li>
                <li>Use curl commands with the endpoints listed above</li>
                <li>Check the <code>backend/API_DOCUMENTATION.md</code> file for detailed examples</li>
            </ul>
        </div>
    </div>

    <script src="/api/docs/swagger-ui-bundle.js"></script>
    <script src="/api/docs/swagger-ui-standalone-preset.js"></script>
    <script>
        // Fallback function to show basic documentation
        function showFallback() {
            document.getElementById('swagger-ui').style.display = 'none';
            document.getElementById('fallback-content').style.display = 'block';
            
            // Load and display endpoints from the JSON spec
            fetch('/api/docs')
                .then(response => response.json())
                .then(spec => {
                    const endpointsList = document.getElementById('endpoints-list');
                    const paths = spec.paths || {};
                    
                    Object.entries(paths).forEach(([path, methods]) => {
                        Object.entries(methods).forEach(([method, details]) => {
                            if (method !== 'parameters' && details.summary) {
                                const endpointDiv = document.createElement('div');
                                endpointDiv.className = 'endpoint';
                                endpointDiv.innerHTML = \`
                                    <span class="method \${method.toLowerCase()}">\${method.toUpperCase()}</span>
                                    <strong>\${path}</strong>
                                    <p>\${details.summary}</p>
                                \`;
                                endpointsList.appendChild(endpointDiv);
                            }
                        });
                    });
                })
                .catch(() => {
                    document.getElementById('endpoints-list').innerHTML = 
                        '<p>Unable to load endpoint information. Please check the server connection.</p>';
                });
        }

        // Try to initialize Swagger UI
        window.onload = function() {
            try {
                if (typeof SwaggerUIBundle !== 'undefined') {
                    const ui = SwaggerUIBundle({
                        url: '/api/docs',
                        dom_id: '#swagger-ui',
                        deepLinking: true,
                        presets: [
                            SwaggerUIBundle.presets.apis,
                            SwaggerUIStandalonePreset
                        ],
                        plugins: [
                            SwaggerUIBundle.plugins.DownloadUrl
                        ],
                        layout: "StandaloneLayout",
                        docExpansion: "none",
                        filter: true,
                        showExtensions: true,
                        showCommonExtensions: true,
                        persistAuthorization: true,
                        displayRequestDuration: true,
                        tryItOutEnabled: true,
                        requestInterceptor: function(request) {
                            return request;
                        },
                        onComplete: function() {
                            console.log('Swagger UI loaded successfully');
                        },
                        onFailure: function(error) {
                            console.error('Swagger UI failed to load:', error);
                            showFallback();
                        }
                    });
                } else {
                    throw new Error('SwaggerUIBundle not available');
                }
            } catch (error) {
                console.error('Error initializing Swagger UI:', error);
                showFallback();
            }
        };

        // Fallback timeout
        setTimeout(() => {
            const swaggerContainer = document.getElementById('swagger-ui');
            if (swaggerContainer && swaggerContainer.innerHTML.includes('Loading API Documentation')) {
                console.log('Swagger UI loading timeout, showing fallback');
                showFallback();
            }
        }, 5000);
    </script>
</body>
</html>`;
  
  res.send(html);
});

/**
 * @route   GET /api/docs/swagger-ui.css
 * @desc    Serve Swagger UI CSS
 * @access  Public
 */
router.get('/swagger-ui.css', (req: Request, res: Response) => {
  try {
    const cssPath = path.join(__dirname, '../../node_modules/swagger-ui-dist/swagger-ui.css');
    if (fs.existsSync(cssPath)) {
      res.setHeader('Content-Type', 'text/css');
      res.sendFile(cssPath);
    } else {
      // Fallback to CDN
      res.redirect('https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui.css');
    }
  } catch (error) {
    res.status(404).send('CSS file not found');
  }
});

/**
 * @route   GET /api/docs/swagger-ui-bundle.js
 * @desc    Serve Swagger UI Bundle JS
 * @access  Public
 */
router.get('/swagger-ui-bundle.js', (req: Request, res: Response) => {
  try {
    const jsPath = path.join(__dirname, '../../node_modules/swagger-ui-dist/swagger-ui-bundle.js');
    if (fs.existsSync(jsPath)) {
      res.setHeader('Content-Type', 'application/javascript');
      res.sendFile(jsPath);
    } else {
      // Fallback to CDN
      res.redirect('https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui-bundle.js');
    }
  } catch (error) {
    res.status(404).send('JS file not found');
  }
});

/**
 * @route   GET /api/docs/swagger-ui-standalone-preset.js
 * @desc    Serve Swagger UI Standalone Preset JS
 * @access  Public
 */
router.get('/swagger-ui-standalone-preset.js', (req: Request, res: Response) => {
  try {
    const jsPath = path.join(__dirname, '../../node_modules/swagger-ui-dist/swagger-ui-standalone-preset.js');
    if (fs.existsSync(jsPath)) {
      res.setHeader('Content-Type', 'application/javascript');
      res.sendFile(jsPath);
    } else {
      // Fallback to CDN
      res.redirect('https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui-standalone-preset.js');
    }
  } catch (error) {
    res.status(404).send('JS file not found');
  }
});

export default router;