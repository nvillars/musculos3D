/**
 * Production server for Anatomical 3D Viewer
 * Optimized for performance, security, and scalability
 */

const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');

// Load configuration based on environment
const environment = process.env.NODE_ENV || 'production';
const config = require(`../deploy/${environment}.config.js`);

const app = express();

// Trust proxy for accurate client IPs
app.set('trust proxy', 1);

// Security middleware
app.use(helmet(config.security.helmet));

// CORS configuration
app.use(cors(config.server.cors));

// Compression middleware
if (config.performance.compression.enabled) {
  app.use(compression({
    level: config.performance.compression.level,
    threshold: config.performance.compression.threshold,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));
}

// Rate limiting
const limiter = rateLimit(config.security.rateLimit);
app.use(limiter);

// Logging
if (config.monitoring.logging.destination === 'console') {
  app.use(morgan(config.monitoring.logging.format === 'json' ? 'combined' : 'dev'));
}

// Health check endpoint
app.get(config.monitoring.healthCheck.path, (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: environment,
    version: process.env.npm_package_version || '1.0.0',
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };

  try {
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.message = error.message;
    res.status(503).json(healthCheck);
  }
});

// Metrics endpoint (basic implementation)
if (config.monitoring.metrics.enabled) {
  app.get(config.monitoring.metrics.path, (req, res) => {
    const metrics = {
      timestamp: Date.now(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      environment: environment
    };
    
    res.status(200).json(metrics);
  });
}

// Static file serving with optimized headers
const staticOptions = {
  maxAge: config.performance.staticFiles.maxAge,
  etag: config.performance.staticFiles.etag,
  lastModified: config.performance.staticFiles.lastModified,
  setHeaders: (res, filePath) => {
    // Set appropriate cache headers based on file type
    const ext = path.extname(filePath).toLowerCase();
    
    if (['.js', '.css'].includes(ext)) {
      // Long cache for versioned assets
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (['.glb', '.gltf', '.jpg', '.png', '.webp'].includes(ext)) {
      // Long cache for models and textures
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    } else if (['.html'].includes(ext)) {
      // Short cache for HTML files
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    
    // Security headers for specific file types
    if (ext === '.js') {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
  }
};

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, '../dist'), staticOptions));

// Serve assets with CDN fallback
app.use('/assets', express.static(path.join(__dirname, '../assets'), staticOptions));

// API proxy endpoints (if needed)
app.use('/api', require('./proxy-server.js'));

// Service Worker
app.get('/sw.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../dist/sw.js'));
});

// Manifest
app.get('/manifest.json', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(__dirname, '../public/manifest.json'));
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
  res.setHeader('Content-Type', 'text/plain');
  
  const robotsTxt = environment === 'production' 
    ? `User-agent: *\nAllow: /\nSitemap: https://anatomical3d.com/sitemap.xml`
    : `User-agent: *\nDisallow: /`;
    
  res.send(robotsTxt);
});

// Sitemap (basic implementation)
app.get('/sitemap.xml', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
  res.setHeader('Content-Type', 'application/xml');
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://anatomical3d.com/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
  
  res.send(sitemap);
});

// Handle client-side routing (SPA)
app.get('*', (req, res) => {
  // Don't serve index.html for API routes or assets
  if (req.path.startsWith('/api/') || req.path.startsWith('/assets/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  const errorResponse = {
    message: environment === 'production' ? 'Internal server error' : err.message,
    timestamp: Date.now(),
    path: req.path
  };
  
  if (environment !== 'production') {
    errorResponse.stack = err.stack;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Not found',
    path: req.path,
    timestamp: Date.now()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Start server
const server = app.listen(config.server.port, config.server.host, () => {
  console.log(`🚀 Production server running on ${config.server.host}:${config.server.port}`);
  console.log(`📊 Environment: ${environment}`);
  console.log(`🔧 Health check: http://${config.server.host}:${config.server.port}${config.monitoring.healthCheck.path}`);
  
  if (config.monitoring.metrics.enabled) {
    console.log(`📈 Metrics: http://${config.server.host}:${config.server.port}${config.monitoring.metrics.path}`);
  }
});

// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof config.server.port === 'string'
    ? 'Pipe ' + config.server.port
    : 'Port ' + config.server.port;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});

module.exports = app;