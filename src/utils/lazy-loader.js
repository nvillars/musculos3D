/**
 * Production-ready lazy loading utility for non-critical components
 */
class LazyLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
    this.preloadQueue = new Set();
    this.loadingStats = {
      totalLoads: 0,
      successfulLoads: 0,
      failedLoads: 0,
      averageLoadTime: 0
    };
    this.intersectionObserver = null;
    this.idleCallback = null;
    
    // Initialize performance monitoring
    this.initializePerformanceMonitoring();
  }

  /**
   * Initialize performance monitoring for lazy loading
   */
  initializePerformanceMonitoring() {
    // Use Intersection Observer for viewport-based loading
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        this.handleIntersection.bind(this),
        { rootMargin: '50px' }
      );
    }

    // Use requestIdleCallback for background preloading
    if ('requestIdleCallback' in window) {
      this.scheduleIdlePreloading();
    }
  }

  /**
   * Lazy load a module with caching and performance monitoring
   * @param {string} moduleName - Name of the module to load
   * @param {Function} importFunction - Dynamic import function
   * @param {Object} options - Loading options
   * @returns {Promise} Promise that resolves to the loaded module
   */
  async loadModule(moduleName, importFunction, options = {}) {
    const startTime = performance.now();
    this.loadingStats.totalLoads++;

    // Return cached module if already loaded
    if (this.loadedModules.has(moduleName)) {
      return this.loadedModules.get(moduleName);
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName);
    }

    // Start loading the module
    const loadingPromise = this.loadModuleWithRetry(moduleName, importFunction, options)
      .then(module => {
        const loadTime = performance.now() - startTime;
        this.updateLoadingStats(loadTime, true);
        
        this.loadedModules.set(moduleName, module);
        this.loadingPromises.delete(moduleName);
        this.preloadQueue.delete(moduleName);
        
        // Emit custom event for monitoring
        this.emitLoadEvent(moduleName, 'loaded', { loadTime });
        
        return module;
      })
      .catch(error => {
        const loadTime = performance.now() - startTime;
        this.updateLoadingStats(loadTime, false);
        
        this.loadingPromises.delete(moduleName);
        this.preloadQueue.delete(moduleName);
        
        // Emit error event
        this.emitLoadEvent(moduleName, 'error', { error, loadTime });
        
        console.error(`Failed to load module ${moduleName}:`, error);
        throw error;
      });

    this.loadingPromises.set(moduleName, loadingPromise);
    return loadingPromise;
  }

  /**
   * Load module with retry mechanism
   * @param {string} moduleName - Name of the module
   * @param {Function} importFunction - Import function
   * @param {Object} options - Loading options
   * @returns {Promise} Module loading promise
   */
  async loadModuleWithRetry(moduleName, importFunction, options = {}) {
    const maxRetries = options.retries || 3;
    const retryDelay = options.retryDelay || 1000;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await importFunction();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, retryDelay * Math.pow(2, attempt))
        );
      }
    }
  }

  /**
   * Preload modules that might be needed soon
   * @param {Array} moduleConfigs - Array of {name, importFunction, priority} objects
   */
  async preloadModules(moduleConfigs) {
    // Sort by priority (higher priority first)
    const sortedConfigs = moduleConfigs.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    const preloadPromises = sortedConfigs.map(config => {
      this.preloadQueue.add(config.name);
      return this.loadModule(config.name, config.importFunction, config.options)
        .catch(error => {
          console.warn(`Preload failed for ${config.name}:`, error);
          return null;
        });
    });

    return Promise.allSettled(preloadPromises);
  }

  /**
   * Preload modules during idle time
   * @param {Array} moduleConfigs - Modules to preload
   */
  preloadDuringIdle(moduleConfigs) {
    if (!('requestIdleCallback' in window)) {
      // Fallback to setTimeout
      setTimeout(() => this.preloadModules(moduleConfigs), 100);
      return;
    }

    requestIdleCallback((deadline) => {
      const startTime = performance.now();
      
      for (const config of moduleConfigs) {
        // Stop if we're running out of idle time
        if (deadline.timeRemaining() < 10 || (performance.now() - startTime) > 50) {
          break;
        }
        
        if (!this.isLoaded(config.name) && !this.preloadQueue.has(config.name)) {
          this.preloadQueue.add(config.name);
          this.loadModule(config.name, config.importFunction, config.options)
            .catch(error => console.warn(`Idle preload failed for ${config.name}:`, error));
        }
      }
    }, { timeout: 2000 });
  }

  /**
   * Handle intersection observer events for viewport-based loading
   * @param {Array} entries - Intersection observer entries
   */
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const moduleName = entry.target.dataset.lazyModule;
        const importFunction = entry.target.dataset.lazyImport;
        
        if (moduleName && importFunction && !this.isLoaded(moduleName)) {
          // Trigger loading when element comes into view
          this.loadModule(moduleName, () => import(importFunction))
            .catch(error => console.warn(`Viewport-triggered load failed for ${moduleName}:`, error));
        }
      }
    });
  }

  /**
   * Schedule idle preloading
   */
  scheduleIdlePreloading() {
    // Preload non-critical modules during idle time
    const idleModules = [
      { name: 'PerformanceManager', importFunction: LazyComponents.PerformanceManager, priority: 1 },
      { name: 'ErrorHandler', importFunction: LazyComponents.ErrorHandler, priority: 3 },
      { name: 'CacheManager', importFunction: LazyComponents.CacheManager, priority: 2 }
    ];

    this.preloadDuringIdle(idleModules);
  }

  /**
   * Update loading statistics
   * @param {number} loadTime - Time taken to load
   * @param {boolean} success - Whether load was successful
   */
  updateLoadingStats(loadTime, success) {
    if (success) {
      this.loadingStats.successfulLoads++;
      
      // Update average load time
      const totalSuccessful = this.loadingStats.successfulLoads;
      this.loadingStats.averageLoadTime = 
        (this.loadingStats.averageLoadTime * (totalSuccessful - 1) + loadTime) / totalSuccessful;
    } else {
      this.loadingStats.failedLoads++;
    }
  }

  /**
   * Emit custom events for monitoring
   * @param {string} moduleName - Module name
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   */
  emitLoadEvent(moduleName, eventType, data = {}) {
    const event = new CustomEvent(`lazyload:${eventType}`, {
      detail: { moduleName, ...data }
    });
    window.dispatchEvent(event);
  }

  /**
   * Check if a module is already loaded
   * @param {string} moduleName - Name of the module
   * @returns {boolean} True if module is loaded
   */
  isLoaded(moduleName) {
    return this.loadedModules.has(moduleName);
  }

  /**
   * Check if a module is currently loading
   * @param {string} moduleName - Name of the module
   * @returns {boolean} True if module is loading
   */
  isLoading(moduleName) {
    return this.loadingPromises.has(moduleName);
  }

  /**
   * Get loading statistics
   * @returns {Object} Loading statistics
   */
  getStats() {
    return {
      ...this.loadingStats,
      loadedModules: Array.from(this.loadedModules.keys()),
      currentlyLoading: Array.from(this.loadingPromises.keys()),
      preloadQueue: Array.from(this.preloadQueue),
      successRate: this.loadingStats.totalLoads > 0 
        ? (this.loadingStats.successfulLoads / this.loadingStats.totalLoads) * 100 
        : 0
    };
  }

  /**
   * Clear cache for a specific module
   * @param {string} moduleName - Name of the module to clear
   */
  clearModule(moduleName) {
    this.loadedModules.delete(moduleName);
    this.loadingPromises.delete(moduleName);
    this.preloadQueue.delete(moduleName);
  }

  /**
   * Clear all cached modules
   */
  clearAll() {
    this.loadedModules.clear();
    this.loadingPromises.clear();
    this.preloadQueue.clear();
    
    // Reset stats
    this.loadingStats = {
      totalLoads: 0,
      successfulLoads: 0,
      failedLoads: 0,
      averageLoadTime: 0
    };
  }

  /**
   * Register element for viewport-based loading
   * @param {HTMLElement} element - Element to observe
   * @param {string} moduleName - Module to load when element is visible
   * @param {string} importPath - Path to import
   */
  observeElement(element, moduleName, importPath) {
    if (this.intersectionObserver) {
      element.dataset.lazyModule = moduleName;
      element.dataset.lazyImport = importPath;
      this.intersectionObserver.observe(element);
    }
  }

  /**
   * Unregister element from observation
   * @param {HTMLElement} element - Element to stop observing
   */
  unobserveElement(element) {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element);
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    if (this.idleCallback) {
      cancelIdleCallback(this.idleCallback);
    }
    
    this.clearAll();
  }
}

// Singleton instance
const lazyLoader = new LazyLoader();

// Lazy loading configurations for different components
export const LazyComponents = {
  // Performance monitoring (non-critical, low priority)
  PerformanceManager: () => import(
    /* webpackChunkName: "performance-manager" */
    /* webpackPreload: true */
    '../PerformanceManager.js'
  ),
  
  // Error handling (critical but can be loaded after initial render)
  ErrorHandler: () => import(
    /* webpackChunkName: "error-handler" */
    /* webpackPrefetch: true */
    '../ErrorHandler.js'
  ),
  
  // Cache management (can be loaded when needed)
  CacheManager: () => import(
    /* webpackChunkName: "cache-manager" */
    /* webpackPrefetch: true */
    '../CacheManager.js'
  ),
  
  // API management (loaded when first API call is needed)
  APIManager: () => import(
    /* webpackChunkName: "api-manager" */
    /* webpackPrefetch: true */
    '../APIManager.js'
  ),
  
  // Advanced zoom features (loaded when zoom is first used)
  ZoomManager: () => import(
    /* webpackChunkName: "zoom-manager" */
    /* webpackPreload: true */
    '../ZoomManager.js'
  ),
  
  // Progress indicators (loaded when first progress is shown)
  ProgressIndicator: () => import(
    /* webpackChunkName: "progress-indicator" */
    /* webpackPreload: true */
    '../ProgressIndicator.js'
  )
};

// Component loading priorities and configurations
export const ComponentConfigs = {
  PerformanceManager: { priority: 1, retries: 2, retryDelay: 500 },
  ErrorHandler: { priority: 5, retries: 3, retryDelay: 1000 },
  CacheManager: { priority: 3, retries: 2, retryDelay: 500 },
  APIManager: { priority: 4, retries: 3, retryDelay: 1000 },
  ZoomManager: { priority: 2, retries: 2, retryDelay: 500 },
  ProgressIndicator: { priority: 2, retries: 2, retryDelay: 500 }
};

export default lazyLoader;