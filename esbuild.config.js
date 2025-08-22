import { build } from 'esbuild';
import { glob } from 'glob';

console.log('🔧 Building production server with esbuild...');

// Get all TypeScript files we need to transpile for production
// Note: We exclude server/routes.ts and server/index.ts as they have Next.js dependencies
const serverFiles = [
  'server/express-routes.ts', 
  'server/storage.ts'
];

// Get all shared files
const sharedFiles = glob.sync('shared/**/*.ts');

// Get all lib files (but exclude any that might import Next.js)
const libFiles = glob.sync('lib/**/*.ts');

const allFiles = [...serverFiles, ...sharedFiles, ...libFiles];

console.log('📁 Files to transpile:', allFiles);

// Custom esbuild configuration that transpiles all needed files
await build({
  entryPoints: allFiles,
  bundle: false, // Don't bundle - just transpile each file
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  outExtension: { '.js': '.js' },
  target: 'node18',
  define: {
    'process.env.NODE_ENV': '"production"'
  }
}).catch((error) => {
  console.error('❌ esbuild failed:', error);
  process.exit(1);
});

console.log('✅ esbuild completed successfully!');