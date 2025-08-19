/**
 * CDN Configuration for static assets
 * Provides fallback mechanisms and optimized asset delivery
 */

// CDN endpoints (can be configured for different environments)
const CDN_ENDPOINTS = {
  production: {
    primary: 'https://cdn.anatomical3d.com',
    fallback: 'https://backup-cdn.anatomical3d.com',
    assets: 'https://assets.anatomical3d.com'
  },
  staging: {
    primary: 'https://staging-cdn.anatomical3d.com',
    fallback: 'https://staging-backup.anatomical3d.com',
    assets: 'https://staging-assets.anatomical3d.com'
  },
  development: {
    primary: '/assets',
    fallback: '/assets',
    assets: '/assets'
  }
};

// Asset types and their CDN configurations
const ASSET_TYPES = {
  models: {
    path: '/models',
    extensions: ['.glb', '.gltf', '.obj'],
    compression: true,
    cache: '1y'
  },
  textures: {
    path: '/textures',
    extensions: ['.jpg', '.png', '.webp', '.ktx2'],
    compression: true,
    cache: '1y'
  },
  fonts: {
    path: '/fonts',
    extensions: ['.woff2', '.woff', '.ttf'],
    compression: false,
    cache: '1y'
  },
  images: {
    path: '/images',
    extensions: ['.jpg', '.png', '.webp', '.svg'],
    compression: true,
    cache: '6m'
  },
  scripts: {
    path: '/js',
    extensions: ['.js'],
    compression: true,
    cache: '1y'
  },
  styles: {
    path: '/css',
    extensions: ['.css'],
    compression: true,
    cache: '1y'
  }
};

class CDNManager {
  constructor(environment = 'development') {
    this.environment = environment;
    this.endpoints = CDN_ENDPOINTS[environment] || CDN_ENDPOINTS.development;
    this.failedEndpoints = new Set();
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  /**
   * Get the appropriate CDN URL for an asset
   * @param {string} assetPath - Path to the asset
   * @param {string} assetType - Type of asset (models, textures, etc.)
   * @param {Object} options - Additional options
   * @returns {string} Complete CDN URL
   */
  getAssetURL(assetPath, assetType = 'models', options = {}) {
    const config = ASSET_TYPES[assetType];
    if (!config) {
      console.warn(`Unknown asset type: ${assetType}`);
      return assetPath;
    }

    // Use local assets in development
    if (this.environment === 'development') {
      return `${this.endpoints.primary}${config.path}${assetPath}`;
    }

    // Build CDN URL
    const baseURL = this.failedEndpoints.has('primary') 
      ? this.endpoints.fallback 
      : this.endpoints.primary;

    let url = `${baseURL}${config.path}${assetPath}`;

    // Add query parameters for optimization
    const params = new URLSearchParams();
    
    if (options.quality && assetType === 'textures') {
      params.append('q', options.quality);
    }
    
    if (options.format && ['textures', 'images'].includes(assetType)) {
      params.append('f', options.format);
    }
    
    if (options.width || options.height) {
      if (options.width) params.append('w', options.width);
      if (options.height) params.append('h', options.height);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return url;
  }

  /**
   * Load asset with fallback mechanism
   * @param {string} assetPath - Path to the asset
   * @param {string} assetType - Type of asset
   * @param {Object} options - Loading options
   * @returns {Promise<Response>} Asset response
   */
  async loadAsset(assetPath, assetType = 'models', options = {}) {
    const urls = [
      this.getAssetURL(assetPath, assetType, options),
      this.getAssetURL(assetPath, assetType, { ...options, fallback: true })
    ];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      
      try {
        const response = await this.fetchWithRetry(url);
        if (response.ok) {
          return response;
        }
      } catch (error) {
        console.warn(`Failed to load from ${url}:`, error);
        
        if (i === 0) {
          this.failedEndpoints.add('primary');
        }
      }
    }

    throw new Error(`Failed to load asset: ${assetPath}`);
  }

  /**
   * Fetch with retry mechanism
   * @param {string} url - URL to fetch
   * @param {number} attempts - Number of retry attempts
   * @returns {Promise<Response>} Fetch response
   */
  async fetchWithRetry(url, attempts = this.retryAttempts) {
    for (let i = 0; i < attempts; i++) {
      try {
        const response = await fetch(url, {
          cache: 'default',
          mode: 'cors'
        });
        
        if (response.ok) {
          return response;
        }
        
        if (response.status >= 400 && response.status < 500) {
          // Client error, don't retry
          throw new Error(`Client error: ${response.status}`);
        }
        
      } catch (error) {
        if (i === attempts - 1) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)));
      }
    }
  }

  /**
   * Preload critical assets
   * @param {Array} assets - Array of asset configurations
   * @returns {Promise<Array>} Array of preload results
   */
  async preloadAssets(assets) {
    const preloadPromises = assets.map(async (asset) => {
      try {
        const response = await this.loadAsset(asset.path, asset.type, asset.options);
        return { asset, success: true, response };
      } catch (error) {
        console.warn(`Failed to preload ${asset.path}:`, error);
        return { asset, success: false, error };
      }
    });

    return Promise.allSettled(preloadPromises);
  }

  /**
   * Get optimized texture URL based on device capabilities
   * @param {string} texturePath - Path to texture
   * @param {Object} deviceInfo - Device capability information
   * @returns {string} Optimized texture URL
   */
  getOptimizedTextureURL(texturePath, deviceInfo = {}) {
    const options = {};

    // Adjust quality based on device performance
    if (deviceInfo.performanceLevel) {
      switch (deviceInfo.performanceLevel) {
        case 'high':
          options.quality = 95;
          options.format = 'webp';
          break;
        case 'medium':
          options.quality = 80;
          options.format = 'webp';
          break;
        case 'low':
          options.quality = 60;
          options.format = 'jpg';
          break;
      }
    }

    // Adjust size based on screen resolution
    if (deviceInfo.screenWidth && deviceInfo.screenHeight) {
      const maxDimension = Math.max(deviceInfo.screenWidth, deviceInfo.screenHeight);
      
      if (maxDimension <= 768) {
        options.width = 1024;
        options.height = 1024;
      } else if (maxDimension <= 1920) {
        options.width = 2048;
        options.height = 2048;
      }
      // For higher resolutions, use original size
    }

    return this.getAssetURL(texturePath, 'textures', options);
  }

  /**
   * Get model URL with appropriate compression
   * @param {string} modelPath - Path to model
   * @param {Object} options - Model loading options
   * @returns {string} Model URL
   */
  getModelURL(modelPath, options = {}) {
    // Prefer compressed formats for production
    if (this.environment === 'production' && !options.uncompressed) {
      // Try to get Draco compressed version first
      const dracoPath = modelPath.replace(/\.(glb|gltf)$/, '.draco.$1');
      return this.getAssetURL(dracoPath, 'models', options);
    }

    return this.getAssetURL(modelPath, 'models', options);
  }

  /**
   * Check CDN health
   * @returns {Promise<Object>} Health status of CDN endpoints
   */
  async checkCDNHealth() {
    const healthChecks = Object.entries(this.endpoints).map(async ([name, url]) => {
      try {
        const response = await fetch(`${url}/health`, { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        return { name, url, healthy: response.ok, status: response.status };
      } catch (error) {
        return { name, url, healthy: false, error: error.message };
      }
    });

    const results = await Promise.allSettled(healthChecks);
    return results.reduce((acc, result, index) => {
      const endpointName = Object.keys(this.endpoints)[index];
      acc[endpointName] = result.status === 'fulfilled' ? result.value : { healthy: false };
      return acc;
    }, {});
  }

  /**
   * Reset failed endpoints (for retry logic)
   */
  resetFailedEndpoints() {
    this.failedEndpoints.clear();
  }

  /**
   * Get cache headers for asset type
   * @param {string} assetType - Type of asset
   * @returns {Object} Cache headers
   */
  getCacheHeaders(assetType) {
    const config = ASSET_TYPES[assetType];
    if (!config) return {};

    return {
      'Cache-Control': `public, max-age=${this.parseCacheDuration(config.cache)}`,
      'Expires': new Date(Date.now() + this.parseCacheDuration(config.cache) * 1000).toUTCString()
    };
  }

  /**
   * Parse cache duration string to seconds
   * @param {string} duration - Duration string (e.g., '1y', '6m', '1d')
   * @returns {number} Duration in seconds
   */
  parseCacheDuration(duration) {
    const units = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400,
      'w': 604800,
      'M': 2592000, // 30 days
      'y': 31536000 // 365 days
    };

    const match = duration.match(/^(\d+)([smhdwMy])$/);
    if (!match) return 3600; // Default 1 hour

    const [, value, unit] = match;
    return parseInt(value) * (units[unit] || 3600);
  }
}

// Export singleton instance
const cdnManager = new CDNManager(process.env.NODE_ENV || 'development');

export default cdnManager;
export { CDNManager, ASSET_TYPES, CDN_ENDPOINTS };