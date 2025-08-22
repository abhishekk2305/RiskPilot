#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

try {
  console.log('🏗️  Building for deployment...');

  // Step 1: Build frontend with Vite
  console.log('📦 Building frontend...');
  execSync('vite build', { stdio: 'inherit' });

  // Step 2: Create deployment server that avoids Next.js dependencies
  console.log('🔧 Creating deployment server...');
  
  const deploymentServer = `import express from "express";
import { createServer } from "http";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync } from "fs";

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Simple API endpoints that work without Next.js
app.post('/api/score', (req, res) => {
  // Basic response for now - you can implement the actual logic here
  res.json({
    id: 'demo-' + Date.now(),
    score: 5,
    level: 'Medium',
    reasons: ['Demo response - API is working']
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Serve static files
const publicDir = join(__dirname, 'public');
if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Catch-all handler for SPA
app.get('*', (req, res) => {
  const indexPath = join(publicDir, 'index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ message: 'Not found' });
  }
});

const server = createServer(app);
const port = parseInt(process.env.PORT || '5000', 10);

server.listen({
  port,
  host: "0.0.0.0",
  reusePort: true,
}, () => {
  console.log(\`Server running on port \${port}\`);
});`;

  // Write the deployment server
  writeFileSync('dist/server.js', deploymentServer);

  // Step 3: Create a start script for production
  const startScript = `{
  "type": "module",
  "scripts": {
    "start": "node server.js"
  }
}`;

  writeFileSync('dist/package.json', startScript);

  console.log('✅ Deployment build completed!');
  console.log('📝 Deployment files created:');
  console.log('   - dist/server.js (production server)');
  console.log('   - dist/package.json (production package.json)');
  console.log('   - dist/public/ (static assets)');
  console.log('');
  console.log('🚀 To run in production:');
  console.log('   cd dist && npm start');

} catch (error) {
  console.error('❌ Deployment build failed:', error.message);
  process.exit(1);
}