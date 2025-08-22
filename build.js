#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';

try {
  console.log('🏗️  Building frontend with Vite...');
  execSync('vite build', { stdio: 'inherit', cwd: process.cwd() });

  console.log('🏗️  Building server with esbuild...');
  if (existsSync('./esbuild.config.js')) {
    execSync('node esbuild.config.js', { stdio: 'inherit', cwd: process.cwd() });
  } else {
    // Fallback to simple transpilation without bundling
    execSync('esbuild server/production-index.ts --platform=node --format=esm --outdir=dist --target=node18', { stdio: 'inherit', cwd: process.cwd() });
  }

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}