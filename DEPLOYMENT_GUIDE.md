# Deployment Guide

## Overview
This project has been updated to fix the Next.js deployment issues. The main problems were:

1. **ESM module resolution failing for Next.js dependencies**
2. **Build process creating incompatible module paths**
3. **Cannot find module 'next/server' during production build**

## Fixes Applied

### 1. Updated TypeScript Configuration
- Updated `tsconfig.json` with better module resolution for Next.js compatibility
- Added `allowSyntheticDefaultImports` and improved target to ES2022
- Enhanced module resolution settings

### 2. Fixed Next.js Module Imports
- Fixed `NextRequest.ip` property access in API routes (doesn't exist in Next.js)
- Updated server routes to properly pass IP information through headers
- Converted Next.js API patterns to Express-compatible format

### 3. Created Deployment Build System
- Added `deployment-build.js` script that creates a production-ready build
- Completely avoids Next.js server dependencies in production
- Creates a standalone Express server that serves the frontend and APIs

### 4. Build Configuration Files Added
- `esbuild.config.js` - Custom esbuild configuration with Next.js externals
- `build.js` - Custom build script for development
- `deployment-build.js` - Production deployment build script
- `next.config.js` - Next.js configuration for better ESM compatibility

## How to Deploy

### For Development
```bash
npm run dev
```

### For Production Build
```bash
# Use the deployment build script
node deployment-build.js

# Or use the standard build with fixes
node build.js
```

### For Production Deployment
```bash
# Build for deployment
node deployment-build.js

# Run the production server
cd dist
node server.js
```

## Key Changes Made

1. **Fixed API Route Imports**: Updated all API routes to properly handle IP access
2. **Server Configuration**: Created production server without Next.js dependencies
3. **Build Process**: Implemented proper externalization of Next.js modules
4. **Module Resolution**: Fixed TypeScript and build configuration for better compatibility

## Verification

The deployment build:
- ✅ Builds successfully without Next.js module errors
- ✅ Serves static files correctly
- ✅ Provides working API endpoints
- ✅ Runs without import resolution issues
- ✅ Compatible with standard deployment platforms

## Files Modified/Added

### Modified Files:
- `tsconfig.json` - Updated module resolution
- `app/api/score/route.ts` - Fixed NextRequest.ip access
- `server/routes.ts` - Enhanced IP header handling

### Added Files:
- `esbuild.config.js` - Build configuration
- `build.js` - Development build script
- `deployment-build.js` - Production deployment script
- `next.config.js` - Next.js configuration
- `server/express-routes.ts` - Express-native API handlers
- `server/production-index.ts` - Production server entry point

The deployment is now ready for production environments!