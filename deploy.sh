#!/bin/bash

echo "🚀 Deployment Script for Compliance Risk Tool"
echo "This script builds the application without Next.js dependencies"
echo ""

# Run the deployment build process
echo "Building application for deployment..."
node deployment-build.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build completed successfully!"
    echo ""
    echo "📦 Deployment files created in dist/ directory:"
    echo "   - dist/index.js (production server entry point)"
    echo "   - dist/package.json (production dependencies)"
    echo "   - dist/public/ (static frontend assets)"
    echo "   - dist/server/ (transpiled server code)"
    echo "   - dist/shared/ (transpiled shared code)"
    echo "   - dist/lib/ (transpiled library code)"
    echo ""
    echo "🚀 To test locally:"
    echo "   cd dist && npm start"
    echo ""
    echo "📋 For Replit deployment:"
    echo "   1. Use 'node deployment-build.js' as your build command"
    echo "   2. Use 'cd dist && npm start' as your run command"
    echo "   3. The server will run on the PORT environment variable (default: 5000)"
    echo ""
    echo "✨ Your app is ready for deployment!"
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi