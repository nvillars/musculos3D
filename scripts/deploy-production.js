#!/usr/bin/env node

/**
 * Production deployment script
 * Handles build optimization, asset compression, and deployment preparation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, '../dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');

console.log('🚀 Starting production deployment...');

// Step 1: Clean and build
console.log('📦 Building production bundle...');
try {
    execSync('npm run clean', { stdio: 'inherit' });
    execSync('npm run build:production', { stdio: 'inherit' });
    console.log('✅ Build completed successfully');
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

// Step 2: Generate bundle analysis
console.log('📊 Generating bundle analysis...');
try {
    execSync('npm run build:stats', { stdio: 'inherit' });
    console.log('✅ Bundle stats generated');
} catch (error) {
    console.warn('⚠️ Bundle stats generation failed:', error.message);
}

// Step 3: Check bundle sizes
console.log('📏 Checking bundle sizes...');
try {
    execSync('npm run size-check', { stdio: 'inherit' });
    console.log('✅ Bundle sizes are within limits');
} catch (error) {
    console.warn('⚠️ Bundle size check failed:', error.message);
    console.warn('Consider optimizing bundle sizes before deployment');
}

// Step 4: Optimize assets
console.log('🎨 Optimizing assets...');
optimizeAssets();

// Step 5: Generate deployment manifest
console.log('📋 Generating deployment manifest...');
generateDeploymentManifest();

// Step 6: Create deployment package
console.log('📦 Creating deployment package...');
createDeploymentPackage();

console.log('🎉 Production deployment preparation completed!');
console.log('📁 Deployment files are ready in:', DIST_DIR);

/**
 * Optimize assets for production
 */
function optimizeAssets() {
    if (!fs.existsSync(ASSETS_DIR)) {
        console.log('No assets directory found, skipping optimization');
        return;
    }

    // Get all files in assets directory
    const files = getAllFiles(ASSETS_DIR);
    
    files.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        const stats = fs.statSync(file);
        
        // Log large files that might need optimization
        if (stats.size > 5 * 1024 * 1024) { // 5MB
            console.warn(`⚠️ Large asset detected: ${path.relative(DIST_DIR, file)} (${formatBytes(stats.size)})`);
        }
        
        // Check for uncompressed models
        if (['.glb', '.gltf'].includes(ext) && stats.size > 1024 * 1024) { // 1MB
            console.log(`📦 Consider compressing model: ${path.relative(DIST_DIR, file)}`);
        }
        
        // Check for unoptimized images
        if (['.png', '.jpg', '.jpeg'].includes(ext) && stats.size > 500 * 1024) { // 500KB
            console.log(`🖼️ Consider optimizing image: ${path.relative(DIST_DIR, file)}`);
        }
    });
}

/**
 * Generate deployment manifest with file hashes and metadata
 */
function generateDeploymentManifest() {
    const crypto = require('crypto');
    const manifest = {
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: 'production',
        files: {},
        bundles: {},
        assets: {}
    };

    // Get all files in dist directory
    const files = getAllFiles(DIST_DIR);
    
    files.forEach(file => {
        const relativePath = path.relative(DIST_DIR, file);
        const stats = fs.statSync(file);
        const content = fs.readFileSync(file);
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        
        manifest.files[relativePath] = {
            size: stats.size,
            hash: hash.substring(0, 16), // Short hash
            mtime: stats.mtime.toISOString()
        };
        
        // Categorize files
        const ext = path.extname(file).toLowerCase();
        if (['.js'].includes(ext)) {
            manifest.bundles[relativePath] = manifest.files[relativePath];
        } else if (['.glb', '.gltf', '.jpg', '.png', '.webp'].includes(ext)) {
            manifest.assets[relativePath] = manifest.files[relativePath];
        }
    });
    
    // Calculate total sizes
    manifest.totalSize = Object.values(manifest.files).reduce((sum, file) => sum + file.size, 0);
    manifest.bundleSize = Object.values(manifest.bundles).reduce((sum, file) => sum + file.size, 0);
    manifest.assetSize = Object.values(manifest.assets).reduce((sum, file) => sum + file.size, 0);
    
    // Write manifest
    fs.writeFileSync(
        path.join(DIST_DIR, 'deployment-manifest.json'),
        JSON.stringify(manifest, null, 2)
    );
    
    console.log(`✅ Deployment manifest generated`);
    console.log(`   Total files: ${Object.keys(manifest.files).length}`);
    console.log(`   Total size: ${formatBytes(manifest.totalSize)}`);
    console.log(`   Bundle size: ${formatBytes(manifest.bundleSize)}`);
    console.log(`   Asset size: ${formatBytes(manifest.assetSize)}`);
}

/**
 * Create deployment package with optimized structure
 */
function createDeploymentPackage() {
    const packageInfo = {
        name: 'anatomical-3d-viewer',
        version: process.env.npm_package_version || '1.0.0',
        buildTime: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
    };
    
    // Create package info file
    fs.writeFileSync(
        path.join(DIST_DIR, 'package-info.json'),
        JSON.stringify(packageInfo, null, 2)
    );
    
    // Create deployment instructions
    const instructions = `
# Deployment Instructions

## Files Overview
- \`index.html\` - Main application entry point
- \`*.js\` - JavaScript bundles (with content hashing)
- \`*.css\` - Stylesheets (with content hashing)
- \`assets/\` - Static assets (models, textures, images)
- \`sw.js\` - Service worker for offline functionality
- \`manifest.json\` - Web app manifest
- \`deployment-manifest.json\` - Deployment metadata

## Server Requirements
- Node.js ${process.version} or higher
- Support for gzip/brotli compression
- HTTPS recommended for service worker functionality

## Deployment Steps
1. Upload all files to your web server
2. Configure server to serve static files with appropriate cache headers
3. Set up HTTPS (required for service worker)
4. Configure CDN if using external assets
5. Test the application in production environment

## Cache Headers Recommendations
- HTML files: \`Cache-Control: public, max-age=3600\` (1 hour)
- JS/CSS with hash: \`Cache-Control: public, max-age=31536000, immutable\` (1 year)
- Assets: \`Cache-Control: public, max-age=2592000\` (30 days)
- Service worker: \`Cache-Control: no-cache\`

## Health Check
- Endpoint: \`/health\`
- Expected response: JSON with status information

## Monitoring
- Metrics endpoint: \`/metrics\`
- Bundle analysis: \`/bundle-stats\` (development only)

Built on: ${new Date().toISOString()}
Version: ${packageInfo.version}
`;
    
    fs.writeFileSync(path.join(DIST_DIR, 'DEPLOYMENT.md'), instructions.trim());
    
    console.log('✅ Deployment package created');
}

/**
 * Get all files recursively from a directory
 * @param {string} dir - Directory path
 * @returns {string[]} Array of file paths
 */
function getAllFiles(dir) {
    const files = [];
    
    function traverse(currentDir) {
        const items = fs.readdirSync(currentDir);
        
        items.forEach(item => {
            const fullPath = path.join(currentDir, item);
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
                traverse(fullPath);
            } else {
                files.push(fullPath);
            }
        });
    }
    
    traverse(dir);
    return files;
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}