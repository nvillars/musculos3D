import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

/**
 * ModelLoader - Handles loading of 3D anatomical models
 * Supports glTF 2.0 format with Draco compression, progress tracking, and error handling
 */
class ModelLoader {
    constructor(options = {}) {
        this.options = {
            // Asset paths configuration
            basePath: options.basePath || '/assets/models/',
            dracoPath: options.dracoPath || '/assets/draco/',
            
            // Loading configuration
            enableDraco: options.enableDraco !== false,
            enableCache: options.enableCache !== false,
            maxCacheSize: options.maxCacheSize || 100 * 1024 * 1024, // 100MB
            
            // Progress and error handling
            showProgress: options.showProgress !== false,
            retryAttempts: options.retryAttempts || 3,
            retryDelay: options.retryDelay || 1000,
            
            ...options
        };
        
        // Initialize loaders
        this.gltfLoader = null;
        this.dracoLoader = null;
        this.textureLoader = null;
        
        // Loading state
        this.loadingModels = new Map(); // Track ongoing loads
        this.modelCache = new Map(); // Cache loaded models
        this.cacheSize = 0; // Track cache size in bytes
        
        // Progress tracking
        this.progressCallbacks = new Map();
        this.errorCallbacks = new Map();
        
        this.initialize();
    }
    
    /**
     * Initialize the loaders
     */
    initialize() {
        try {
            // Initialize GLTF loader
            this.gltfLoader = new GLTFLoader();
            
            // Initialize Draco loader if enabled
            if (this.options.enableDraco) {
                this.dracoLoader = new DRACOLoader();
                this.dracoLoader.setDecoderPath(this.options.dracoPath);
                this.gltfLoader.setDRACOLoader(this.dracoLoader);
            }
            
            // Initialize texture loader
            this.textureLoader = new THREE.TextureLoader();
            
            console.log('ModelLoader initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ModelLoader:', error);
            throw error;
        }
    }
    
    /**
     * Load a 3D model from URL or asset path
     * @param {string} modelPath - Path to the model file
     * @param {Object} options - Loading options
     * @returns {Promise<THREE.Group>} Promise that resolves to the loaded model
     */
    async loadModel(modelPath, options = {}) {
        const fullPath = this.resolveAssetPath(modelPath);
        const cacheKey = this.getCacheKey(fullPath, options);
        
        // Check if model is already cached
        if (this.options.enableCache && this.modelCache.has(cacheKey)) {
            console.log(`Loading model from cache: ${modelPath}`);
            return this.cloneModel(this.modelCache.get(cacheKey));
        }
        
        // Check if model is currently being loaded
        if (this.loadingModels.has(cacheKey)) {
            console.log(`Model already loading, waiting: ${modelPath}`);
            return this.loadingModels.get(cacheKey);
        }
        
        // Start loading the model
        const loadPromise = this.loadModelInternal(fullPath, options, cacheKey);
        this.loadingModels.set(cacheKey, loadPromise);
        
        try {
            const model = await loadPromise;
            
            // Cache the model if caching is enabled
            if (this.options.enableCache) {
                this.cacheModel(cacheKey, model);
            }
            
            return model;
        } finally {
            // Remove from loading map
            this.loadingModels.delete(cacheKey);
        }
    }
    
    /**
     * Internal method to load a model with retry logic
     * @param {string} fullPath - Full path to the model
     * @param {Object} options - Loading options
     * @param {string} cacheKey - Cache key for the model
     * @returns {Promise<THREE.Group>} Promise that resolves to the loaded model
     */
    async loadModelInternal(fullPath, options, cacheKey) {
        let lastError = null;
        
        for (let attempt = 0; attempt < this.options.retryAttempts; attempt++) {
            try {
                if (attempt > 0) {
                    console.log(`Retry attempt ${attempt} for model: ${fullPath}`);
                    await this.delay(this.options.retryDelay * attempt);
                }
                
                return await this.loadModelOnce(fullPath, options, cacheKey);
            } catch (error) {
                lastError = error;
                console.warn(`Failed to load model (attempt ${attempt + 1}):`, error.message);
                
                // Don't retry for certain types of errors
                if (this.isNonRetryableError(error)) {
                    break;
                }
            }
        }
        
        // All attempts failed
        const finalError = new Error(`Failed to load model after ${this.options.retryAttempts} attempts: ${lastError.message}`);
        finalError.originalError = lastError;
        finalError.modelPath = fullPath;
        
        this.notifyError(cacheKey, finalError);
        throw finalError;
    }
    
    /**
     * Load a model once (single attempt)
     * @param {string} fullPath - Full path to the model
     * @param {Object} options - Loading options
     * @param {string} cacheKey - Cache key for the model
     * @returns {Promise<THREE.Group>} Promise that resolves to the loaded model
     */
    loadModelOnce(fullPath, options, cacheKey) {
        return new Promise((resolve, reject) => {
            const onProgress = (progressEvent) => {
                if (progressEvent.lengthComputable) {
                    const progress = (progressEvent.loaded / progressEvent.total) * 100;
                    this.notifyProgress(cacheKey, progress, progressEvent);
                }
            };
            
            const onLoad = (gltf) => {
                try {
                    const model = this.processLoadedModel(gltf, options);
                    this.notifyProgress(cacheKey, 100, { loaded: 1, total: 1 });
                    resolve(model);
                } catch (error) {
                    reject(new Error(`Failed to process loaded model: ${error.message}`));
                }
            };
            
            const onError = (error) => {
                const loadError = new Error(`Failed to load model from ${fullPath}: ${error.message || 'Unknown error'}`);
                loadError.originalError = error;
                reject(loadError);
            };
            
            // Start loading
            this.gltfLoader.load(fullPath, onLoad, onProgress, onError);
        });
    }
    
    /**
     * Process the loaded GLTF model
     * @param {Object} gltf - Loaded GLTF object
     * @param {Object} options - Processing options
     * @returns {THREE.Group} Processed model
     */
    processLoadedModel(gltf, options = {}) {
        const model = gltf.scene;
        
        // Apply transformations if specified
        if (options.scale) {
            if (typeof options.scale === 'number') {
                model.scale.setScalar(options.scale);
            } else {
                model.scale.set(options.scale.x || 1, options.scale.y || 1, options.scale.z || 1);
            }
        }
        
        if (options.position) {
            model.position.set(options.position.x || 0, options.position.y || 0, options.position.z || 0);
        }
        
        if (options.rotation) {
            model.rotation.set(options.rotation.x || 0, options.rotation.y || 0, options.rotation.z || 0);
        }
        
        // Enable shadows if requested
        if (options.castShadow || options.receiveShadow) {
            model.traverse((child) => {
                if (child.isMesh) {
                    if (options.castShadow) child.castShadow = true;
                    if (options.receiveShadow) child.receiveShadow = true;
                }
            });
        }
        
        // Apply material modifications
        if (options.materialOverrides) {
            this.applyMaterialOverrides(model, options.materialOverrides);
        }
        
        // Store metadata
        model.userData.originalGltf = gltf;
        model.userData.loadOptions = options;
        model.userData.loadTime = Date.now();
        
        return model;
    }
    
    /**
     * Apply material overrides to the model
     * @param {THREE.Group} model - The model to modify
     * @param {Object} overrides - Material override options
     */
    applyMaterialOverrides(model, overrides) {
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                const material = child.material;
                
                // Apply overrides
                Object.keys(overrides).forEach(key => {
                    if (material.hasOwnProperty(key)) {
                        material[key] = overrides[key];
                    }
                });
                
                // Update material
                material.needsUpdate = true;
            }
        });
    }
    
    /**
     * Clone a cached model for reuse
     * @param {THREE.Group} originalModel - Original model to clone
     * @returns {THREE.Group} Cloned model
     */
    cloneModel(originalModel) {
        const clonedModel = originalModel.clone();
        
        // Clone materials to avoid shared state
        clonedModel.traverse((child) => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material = child.material.map(mat => mat.clone());
                } else {
                    child.material = child.material.clone();
                }
            }
        });
        
        return clonedModel;
    }
    
    /**
     * Cache a loaded model
     * @param {string} cacheKey - Cache key
     * @param {THREE.Group} model - Model to cache
     */
    cacheModel(cacheKey, model) {
        // Estimate model size (rough approximation)
        const modelSize = this.estimateModelSize(model);
        
        // Check if we need to free up cache space
        while (this.cacheSize + modelSize > this.options.maxCacheSize && this.modelCache.size > 0) {
            this.evictOldestCacheEntry();
        }
        
        // Cache the model
        this.modelCache.set(cacheKey, model);
        this.cacheSize += modelSize;
        
        console.log(`Model cached: ${cacheKey} (${Math.round(modelSize / 1024)}KB, total cache: ${Math.round(this.cacheSize / 1024)}KB)`);
    }
    
    /**
     * Estimate the memory size of a model
     * @param {THREE.Group} model - Model to estimate
     * @returns {number} Estimated size in bytes
     */
    estimateModelSize(model) {
        let size = 0;
        
        model.traverse((child) => {
            if (child.isMesh) {
                // Estimate geometry size
                if (child.geometry) {
                    const geometry = child.geometry;
                    const attributes = geometry.attributes;
                    
                    Object.keys(attributes).forEach(key => {
                        const attribute = attributes[key];
                        size += attribute.array.byteLength;
                    });
                    
                    if (geometry.index) {
                        size += geometry.index.array.byteLength;
                    }
                }
                
                // Estimate material/texture size (rough approximation)
                if (child.material) {
                    size += 1024; // Base material size
                    
                    const material = child.material;
                    ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap'].forEach(prop => {
                        if (material[prop] && material[prop].image) {
                            const img = material[prop].image;
                            size += (img.width || 512) * (img.height || 512) * 4; // RGBA
                        }
                    });
                }
            }
        });
        
        return size;
    }
    
    /**
     * Evict the oldest cache entry
     */
    evictOldestCacheEntry() {
        let oldestKey = null;
        let oldestTime = Infinity;
        
        for (const [key, model] of this.modelCache) {
            const loadTime = model.userData.loadTime || 0;
            if (loadTime < oldestTime) {
                oldestTime = loadTime;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            const model = this.modelCache.get(oldestKey);
            const modelSize = this.estimateModelSize(model);
            
            this.modelCache.delete(oldestKey);
            this.cacheSize -= modelSize;
            
            console.log(`Evicted cached model: ${oldestKey}`);
        }
    }
    
    /**
     * Resolve asset path to full URL
     * @param {string} assetPath - Relative asset path
     * @returns {string} Full asset URL
     */
    resolveAssetPath(assetPath) {
        if (assetPath.startsWith('http://') || assetPath.startsWith('https://') || assetPath.startsWith('/')) {
            return assetPath;
        }
        
        return this.options.basePath + assetPath;
    }
    
    /**
     * Generate cache key for a model
     * @param {string} path - Model path
     * @param {Object} options - Loading options
     * @returns {string} Cache key
     */
    getCacheKey(path, options) {
        const optionsHash = JSON.stringify(options);
        return `${path}:${optionsHash}`;
    }
    
    /**
     * Check if an error should not be retried
     * @param {Error} error - The error to check
     * @returns {boolean} True if error should not be retried
     */
    isNonRetryableError(error) {
        const message = error.message.toLowerCase();
        return message.includes('404') || 
               message.includes('not found') || 
               message.includes('forbidden') ||
               message.includes('unauthorized') ||
               message.includes('invalid format');
    }
    
    /**
     * Add progress callback for a model load
     * @param {string} modelPath - Model path
     * @param {Function} callback - Progress callback
     */
    onProgress(modelPath, callback) {
        const fullPath = this.resolveAssetPath(modelPath);
        const cacheKey = this.getCacheKey(fullPath, {});
        
        if (!this.progressCallbacks.has(cacheKey)) {
            this.progressCallbacks.set(cacheKey, []);
        }
        this.progressCallbacks.get(cacheKey).push(callback);
    }
    
    /**
     * Add error callback for a model load
     * @param {string} modelPath - Model path
     * @param {Function} callback - Error callback
     */
    onError(modelPath, callback) {
        const fullPath = this.resolveAssetPath(modelPath);
        const cacheKey = this.getCacheKey(fullPath, {});
        
        if (!this.errorCallbacks.has(cacheKey)) {
            this.errorCallbacks.set(cacheKey, []);
        }
        this.errorCallbacks.get(cacheKey).push(callback);
    }
    
    /**
     * Notify progress callbacks
     * @param {string} cacheKey - Cache key
     * @param {number} progress - Progress percentage
     * @param {Object} event - Progress event
     */
    notifyProgress(cacheKey, progress, event) {
        const callbacks = this.progressCallbacks.get(cacheKey);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(progress, event);
                } catch (error) {
                    console.warn('Progress callback error:', error);
                }
            });
        }
    }
    
    /**
     * Notify error callbacks
     * @param {string} cacheKey - Cache key
     * @param {Error} error - The error
     */
    notifyError(cacheKey, error) {
        const callbacks = this.errorCallbacks.get(cacheKey);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(error);
                } catch (callbackError) {
                    console.warn('Error callback error:', callbackError);
                }
            });
        }
    }
    
    /**
     * Clear all cached models
     */
    clearCache() {
        this.modelCache.clear();
        this.cacheSize = 0;
        console.log('Model cache cleared');
    }
    
    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            cachedModels: this.modelCache.size,
            cacheSize: this.cacheSize,
            maxCacheSize: this.options.maxCacheSize,
            cacheUsage: (this.cacheSize / this.options.maxCacheSize) * 100
        };
    }
    
    /**
     * Utility method to create a delay
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Dispose of the loader and free resources
     */
    dispose() {
        // Clear caches
        this.clearCache();
        this.loadingModels.clear();
        this.progressCallbacks.clear();
        this.errorCallbacks.clear();
        
        // Dispose loaders
        if (this.dracoLoader) {
            this.dracoLoader.dispose();
            this.dracoLoader = null;
        }
        
        this.gltfLoader = null;
        this.textureLoader = null;
        
        console.log('ModelLoader disposed');
    }
}

export default ModelLoader;