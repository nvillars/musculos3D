/**
 * Production deployment configuration
 * Optimized for performance, security, and scalability
 */

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 8080,
    host: process.env.HOST || '0.0.0.0',
    compression: true,
    staticMaxAge: '1y',
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://anatomical3d.com'],
      credentials: true
    }
  },

  // CDN configuration
  cdn: {
    enabled: true,
    baseUrl: process.env.CDN_BASE_URL || 'https://cdn.anatomical3d.com',
    assetsPath: '/assets',
    modelsPath: '/models',
    texturesPath: '/textures'
  },

  // Cache configuration
  cache: {
    redis: {
      enabled: process.env.REDIS_URL ? true : false,
      url: process.env.REDIS_URL,
      ttl: 3600 // 1 hour
    },
    memory: {
      maxSize: '500MB',
      ttl: 1800 // 30 minutes
    }
  },

  // Security configuration
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.anatomical3d.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000 // limit each IP to 1000 requests per windowMs
    }
  },

  // Monitoring configuration
  monitoring: {
    enabled: true,
    healthCheck: {
      path: '/health',
      interval: 30000 // 30 seconds
    },
    metrics: {
      enabled: true,
      path: '/metrics'
    },
    logging: {
      level: 'info',
      format: 'json',
      destination: process.env.LOG_DESTINATION || 'console'
    }
  },

  // Performance configuration
  performance: {
    compression: {
      enabled: true,
      level: 6,
      threshold: 1024,
      algorithms: ['gzip', 'br'] // Brotli compression for better performance
    },
    staticFiles: {
      maxAge: '1y',
      etag: true,
      lastModified: true,
      immutable: true // For hashed assets
    },
    api: {
      timeout: 30000,
      retries: 3,
      keepAlive: true,
      maxSockets: 50
    },
    bundleOptimization: {
      preload: ['core', 'threejs'], // Critical chunks to preload
      prefetch: ['lazy-components'], // Non-critical chunks to prefetch
      modulePreload: true,
      resourceHints: true
    }
  },

  // Asset optimization
  assets: {
    optimization: {
      images: {
        webp: true,
        avif: false, // Enable when browser support improves
        quality: 85,
        progressive: true
      },
      models: {
        compression: 'draco',
        textureCompression: 'ktx2',
        meshOptimization: true
      }
    },
    delivery: {
      http2Push: true,
      preconnect: ['https://fonts.googleapis.com', 'https://api.anatomical3d.com'],
      dns_prefetch: ['https://cdn.anatomical3d.com']
    }
  }
};

module.exports = config;