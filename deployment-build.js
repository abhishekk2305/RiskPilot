#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { dirname } from 'path';

try {
  console.log('🏗️  Building for deployment...');

  // Step 1: Build frontend with Vite
  console.log('📦 Building frontend...');
  execSync('vite build', { stdio: 'inherit' });

  // Step 2: Build production server using esbuild with express-routes (no Next.js dependencies)
  console.log('🔧 Building production server...');
  execSync('node esbuild.config.js', { stdio: 'inherit' });

  // Step 2.5: Fix import paths to include .js extensions for ES modules
  console.log('🔧 Fixing import paths...');
  execSync(`find dist -name "*.js" -exec sed -i 's|from "\\.\\.\\(/[^"]*\\)"|from "..\\1.js"|g' {} +`, { stdio: 'inherit' });
  execSync(`find dist -name "*.js" -exec sed -i 's|from "\\./\\([^"]*\\)"|from "./\\1.js"|g' {} +`, { stdio: 'inherit' });

  // Step 3: Create the main deployment server entry point
  console.log('🔧 Creating deployment server entry point...');
  
  const deploymentServer = `import express from "express";
import { createServer } from "http";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

// Import the production server with Express routes (no Next.js dependencies)
import { registerExpressRoutes } from "./server/express-routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(\`\${req.method} \${req.path} \${res.statusCode} in \${duration}ms\`);
  });
  next();
});

async function startServer() {
  try {
    // Register all Express routes (includes /api/score, /api/health, etc.)
    const server = await registerExpressRoutes(app);

    // Error handling middleware
    app.use((err, req, res, next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error('Server error:', err);
    });

    // Serve static files from the built frontend
    const publicDir = join(__dirname, 'public');
    if (existsSync(publicDir)) {
      app.use(express.static(publicDir));
    }

    // Catch-all handler for SPA (React Router)
    app.get('*', (req, res) => {
      const indexPath = join(publicDir, 'index.html');
      if (existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).json({ message: 'Frontend not found' });
      }
    });

    const port = parseInt(process.env.PORT || '5000', 10);

    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      console.log(\`🚀 Production server running on port \${port}\`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();`;

  // Write the deployment server
  writeFileSync('dist/index.js', deploymentServer);

  // Step 4: Create a start script for production
  const startScript = `{
  "type": "module",
  "scripts": {
    "start": "node index.js"
  }
}`;

  writeFileSync('dist/package.json', startScript);

  console.log('✅ Deployment build completed!');
  console.log('📝 Deployment files created:');
  console.log('   - dist/index.js (production server entry point)');
  console.log('   - dist/server/ (transpiled server code)');
  console.log('   - dist/shared/ (transpiled shared code)');
  console.log('   - dist/lib/ (transpiled library code)');
  console.log('   - dist/package.json (production package.json)');
  console.log('   - dist/public/ (static frontend assets)');
  console.log('');
  console.log('🚀 To run in production:');
  console.log('   cd dist && npm start');

} catch (error) {
  console.error('❌ Deployment build failed:', error.message);
  process.exit(1);
}