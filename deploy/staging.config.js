/**
 * Staging deployment configuration
 */

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || '0.0.0.0',
    compression: true,
    staticMaxAge: '1h',
    cors: {
      origin: ['https://staging.anatomical3d.com', 'http://localhost:3000'],
      credentials: true
    }
  },

  // CDN configuration
  cdn: {
    enabled: false, // Use local assets in staging
    baseUrl: process.env.CDN_BASE_URL || '/assets',
    assetsPath: '/assets',
    modelsPath: '/models',
    texturesPath: '/textures'
  },

  // Cache configuration
  cache: {
    redis: {
      enabled: false,
      url: process.env.REDIS_URL,
      ttl: 1800 // 30 minutes
    },
    memory: {
      maxSize: '200MB',
      ttl: 900 // 15 minutes
    }
  },

  // Security configuration (relaxed for staging)
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:", "http:"],
          connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
          fontSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      }
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5000 // Higher limit for testing
    }
  },

  // Monitoring configuration
  monitoring: {
    enabled: true,
    healthCheck: {
      path: '/health',
      interval: 60000 // 1 minute
    },
    metrics: {
      enabled: true,
      path: '/metrics'
    },
    logging: {
      level: 'debug',
      format: 'pretty',
      destination: 'console'
    }
  },

  // Performance configuration
  performance: {
    compression: {
      enabled: true,
      level: 4,
      threshold: 512
    },
    staticFiles: {
      maxAge: '1h',
      etag: true,
      lastModified: true
    },
    api: {
      timeout: 60000, // Longer timeout for debugging
      retries: 1
    }
  }
};

module.exports = config;