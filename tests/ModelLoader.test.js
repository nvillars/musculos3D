import ModelLoader from '../src/ModelLoader.js';
import * as THREE from 'three';

// Mock Three.js GLTFLoader and DRACOLoader
jest.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
    GLTFLoader: jest.fn(() => ({
        load: jest.fn(),
        setDRACOLoader: jest.fn()
    }))
}));

jest.mock('three/examples/jsm/loaders/DRACOLoader.js', () => ({
    DRACOLoader: jest.fn(() => ({
        setDecoderPath: jest.fn(),
        dispose: jest.fn()
    }))
}));

// Mock Three.js TextureLoader
jest.mock('three', () => ({
    ...jest.requireActual('three'),
    TextureLoader: jest.fn(() => ({})),
    Group: jest.fn(() => ({
        clone: jest.fn(() => ({
            traverse: jest.fn()
        })),
        traverse: jest.fn(),
        scale: {
            setScalar: jest.fn(),
            set: jest.fn()
        },
        position: {
            set: jest.fn()
        },
        rotation: {
            set: jest.fn()
        },
        userData: {}
    }))
}));

describe('ModelLoader', () => {
    let modelLoader;
    let mockGLTFLoader;
    let mockDRACOLoader;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        
        // Setup mock loaders
        const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader.js');
        const { DRACOLoader } = require('three/examples/jsm/loaders/DRACOLoader.js');
        
        mockGLTFLoader = {
            load: jest.fn(),
            setDRACOLoader: jest.fn()
        };
        
        mockDRACOLoader = {
            setDecoderPath: jest.fn(),
            dispose: jest.fn()
        };
        
        GLTFLoader.mockImplementation(() => mockGLTFLoader);
        DRACOLoader.mockImplementation(() => mockDRACOLoader);
    });

    afterEach(() => {
        if (modelLoader) {
            modelLoader.dispose();
            modelLoader = null;
        }
    });

    describe('Constructor and Initialization', () => {
        test('should initialize with default options', () => {
            modelLoader = new ModelLoader();

            expect(modelLoader.options.basePath).toBe('/assets/models/');
            expect(modelLoader.options.dracoPath).toBe('/assets/draco/');
            expect(modelLoader.options.enableDraco).toBe(true);
            expect(modelLoader.options.enableCache).toBe(true);
            expect(modelLoader.options.maxCacheSize).toBe(100 * 1024 * 1024);
            expect(modelLoader.options.retryAttempts).toBe(3);
        });

        test('should initialize with custom options', () => {
            const customOptions = {
                basePath: '/custom/models/',
                enableDraco: false,
                enableCache: false,
                retryAttempts: 5
            };

            modelLoader = new ModelLoader(customOptions);

            expect(modelLoader.options.basePath).toBe('/custom/models/');
            expect(modelLoader.options.enableDraco).toBe(false);
            expect(modelLoader.options.enableCache).toBe(false);
            expect(modelLoader.options.retryAttempts).toBe(5);
        });

        test('should initialize loaders correctly', () => {
            modelLoader = new ModelLoader();

            expect(modelLoader.gltfLoader).toBeDefined();
            expect(modelLoader.dracoLoader).toBeDefined();
            expect(modelLoader.textureLoader).toBeDefined();
            expect(mockDRACOLoader.setDecoderPath).toHaveBeenCalledWith('/assets/draco/');
            expect(mockGLTFLoader.setDRACOLoader).toHaveBeenCalledWith(mockDRACOLoader);
        });

        test('should not initialize DRACO loader when disabled', () => {
            modelLoader = new ModelLoader({ enableDraco: false });

            expect(modelLoader.dracoLoader).toBeNull();
            expect(mockGLTFLoader.setDRACOLoader).not.toHaveBeenCalled();
        });

        test('should throw error if initialization fails', () => {
            const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader.js');
            GLTFLoader.mockImplementationOnce(() => {
                throw new Error('Failed to initialize GLTFLoader');
            });

            expect(() => {
                new ModelLoader();
            }).toThrow('Failed to initialize GLTFLoader');
        });
    });

    describe('Asset Path Resolution', () => {
        beforeEach(() => {
            modelLoader = new ModelLoader();
        });

        test('should resolve relative paths correctly', () => {
            const result = modelLoader.resolveAssetPath('heart.glb');
            expect(result).toBe('/assets/models/heart.glb');
        });

        test('should not modify absolute URLs', () => {
            const httpUrl = 'http://example.com/model.glb';
            const httpsUrl = 'https://example.com/model.glb';
            const absolutePath = '/absolute/path/model.glb';

            expect(modelLoader.resolveAssetPath(httpUrl)).toBe(httpUrl);
            expect(modelLoader.resolveAssetPath(httpsUrl)).toBe(httpsUrl);
            expect(modelLoader.resolveAssetPath(absolutePath)).toBe(absolutePath);
        });

        test('should use custom base path', () => {
            modelLoader = new ModelLoader({ basePath: '/custom/assets/' });
            const result = modelLoader.resolveAssetPath('model.glb');
            expect(result).toBe('/custom/assets/model.glb');
        });
    });

    describe('Cache Key Generation', () => {
        beforeEach(() => {
            modelLoader = new ModelLoader();
        });

        test('should generate consistent cache keys', () => {
            const path = '/assets/models/heart.glb';
            const options = { scale: 1.5 };

            const key1 = modelLoader.getCacheKey(path, options);
            const key2 = modelLoader.getCacheKey(path, options);

            expect(key1).toBe(key2);
            expect(key1).toContain(path);
        });

        test('should generate different keys for different options', () => {
            const path = '/assets/models/heart.glb';
            const options1 = { scale: 1.0 };
            const options2 = { scale: 2.0 };

            const key1 = modelLoader.getCacheKey(path, options1);
            const key2 = modelLoader.getCacheKey(path, options2);

            expect(key1).not.toBe(key2);
        });
    });

    describe('Model Loading', () => {
        beforeEach(() => {
            modelLoader = new ModelLoader();
        });

        test('should load model successfully', async () => {
            const mockModel = new THREE.Group();
            const mockGltf = { scene: mockModel };

            mockGLTFLoader.load.mockImplementation((path, onLoad) => {
                setTimeout(() => onLoad(mockGltf), 10);
            });

            const result = await modelLoader.loadModel('heart.glb');

            expect(result).toBe(mockModel);
            expect(mockGLTFLoader.load).toHaveBeenCalledWith(
                '/assets/models/heart.glb',
                expect.any(Function),
                expect.any(Function),
                expect.any(Function)
            );
        });

        test('should handle loading errors', async () => {
            const error = new Error('Failed to load model');
            mockGLTFLoader.load.mockImplementation((path, onLoad, onProgress, onError) => {
                setTimeout(() => onError(error), 10);
            });

            await expect(modelLoader.loadModel('invalid.glb')).rejects.toThrow();
        });

        test('should retry failed loads', async () => {
            let attemptCount = 0;
            mockGLTFLoader.load.mockImplementation((path, onLoad, onProgress, onError) => {
                attemptCount++;
                if (attemptCount < 3) {
                    setTimeout(() => onError(new Error('Network error')), 10);
                } else {
                    const mockModel = new THREE.Group();
                    const mockGltf = { scene: mockModel };
                    setTimeout(() => onLoad(mockGltf), 10);
                }
            });

            const result = await modelLoader.loadModel('flaky.glb');
            expect(result).toBeInstanceOf(THREE.Group);
            expect(attemptCount).toBe(3);
        });

        test('should not retry non-retryable errors', async () => {
            let attemptCount = 0;
            mockGLTFLoader.load.mockImplementation((path, onLoad, onProgress, onError) => {
                attemptCount++;
                setTimeout(() => onError(new Error('404 Not Found')), 10);
            });

            await expect(modelLoader.loadModel('notfound.glb')).rejects.toThrow();
            expect(attemptCount).toBe(1); // Should not retry 404 errors
        });

        test('should track progress during loading', async () => {
            const progressCallback = jest.fn();
            const mockModel = new THREE.Group();
            const mockGltf = { scene: mockModel };

            mockGLTFLoader.load.mockImplementation((path, onLoad, onProgress) => {
                // Simulate progress events
                setTimeout(() => onProgress({ loaded: 50, total: 100, lengthComputable: true }), 5);
                setTimeout(() => onProgress({ loaded: 100, total: 100, lengthComputable: true }), 10);
                setTimeout(() => onLoad(mockGltf), 15);
            });

            modelLoader.onProgress('heart.glb', progressCallback);
            await modelLoader.loadModel('heart.glb');

            expect(progressCallback).toHaveBeenCalledWith(50, expect.any(Object));
            expect(progressCallback).toHaveBeenCalledWith(100, expect.any(Object));
        });
    });

    describe('Model Caching', () => {
        beforeEach(() => {
            modelLoader = new ModelLoader({ enableCache: true });
        });

        test('should cache loaded models', async () => {
            const mockModel = new THREE.Group();
            const mockGltf = { scene: mockModel };

            mockGLTFLoader.load.mockImplementation((path, onLoad) => {
                setTimeout(() => onLoad(mockGltf), 10);
            });

            // Load model twice
            const result1 = await modelLoader.loadModel('heart.glb');
            const result2 = await modelLoader.loadModel('heart.glb');

            // Should only call loader once
            expect(mockGLTFLoader.load).toHaveBeenCalledTimes(1);
            expect(result1).not.toBe(result2); // Should be cloned
        });

        test('should not cache when caching is disabled', async () => {
            modelLoader = new ModelLoader({ enableCache: false });
            const mockModel = new THREE.Group();
            const mockGltf = { scene: mockModel };

            mockGLTFLoader.load.mockImplementation((path, onLoad) => {
                setTimeout(() => onLoad(mockGltf), 10);
            });

            // Load model twice
            await modelLoader.loadModel('heart.glb');
            await modelLoader.loadModel('heart.glb');

            // Should call loader twice
            expect(mockGLTFLoader.load).toHaveBeenCalledTimes(2);
        });

        test('should evict old cache entries when cache is full', async () => {
            modelLoader = new ModelLoader({ 
                enableCache: true, 
                maxCacheSize: 1000 // Very small cache
            });

            const mockModel = new THREE.Group();
            mockModel.traverse = jest.fn((callback) => {
                // Simulate a mesh with geometry
                const mockMesh = {
                    isMesh: true,
                    geometry: {
                        attributes: {
                            position: { array: new Float32Array(3000) }, // 12KB
                            normal: { array: new Float32Array(3000) }     // 12KB
                        }
                    },
                    material: {}
                };
                callback(mockMesh);
            });

            const mockGltf = { scene: mockModel };

            mockGLTFLoader.load.mockImplementation((path, onLoad) => {
                setTimeout(() => onLoad(mockGltf), 10);
            });

            // Load multiple models to exceed cache size
            await modelLoader.loadModel('model1.glb');
            await modelLoader.loadModel('model2.glb');
            await modelLoader.loadModel('model3.glb');

            const stats = modelLoader.getCacheStats();
            expect(stats.cachedModels).toBeLessThan(3); // Some should be evicted
        });

        test('should provide cache statistics', () => {
            const stats = modelLoader.getCacheStats();

            expect(stats).toHaveProperty('cachedModels');
            expect(stats).toHaveProperty('cacheSize');
            expect(stats).toHaveProperty('maxCacheSize');
            expect(stats).toHaveProperty('cacheUsage');
            expect(typeof stats.cacheUsage).toBe('number');
        });

        test('should clear cache', async () => {
            const mockModel = new THREE.Group();
            const mockGltf = { scene: mockModel };

            mockGLTFLoader.load.mockImplementation((path, onLoad) => {
                setTimeout(() => onLoad(mockGltf), 10);
            });

            await modelLoader.loadModel('heart.glb');
            expect(modelLoader.getCacheStats().cachedModels).toBe(1);

            modelLoader.clearCache();
            expect(modelLoader.getCacheStats().cachedModels).toBe(0);
        });
    });

    describe('Model Processing', () => {
        beforeEach(() => {
            modelLoader = new ModelLoader();
        });

        test('should apply scale transformations', () => {
            const mockModel = new THREE.Group();
            const mockGltf = { scene: mockModel };

            const options = { scale: 2.0 };
            const result = modelLoader.processLoadedModel(mockGltf, options);

            expect(result.scale.setScalar).toHaveBeenCalledWith(2.0);
        });

        test('should apply position transformations', () => {
            const mockModel = new THREE.Group();
            const mockGltf = { scene: mockModel };

            const options = { position: { x: 1, y: 2, z: 3 } };
            const result = modelLoader.processLoadedModel(mockGltf, options);

            expect(result.position.set).toHaveBeenCalledWith(1, 2, 3);
        });

        test('should apply rotation transformations', () => {
            const mockModel = new THREE.Group();
            const mockGltf = { scene: mockModel };

            const options = { rotation: { x: 0.5, y: 1.0, z: 1.5 } };
            const result = modelLoader.processLoadedModel(mockGltf, options);

            expect(result.rotation.set).toHaveBeenCalledWith(0.5, 1.0, 1.5);
        });

        test('should enable shadows when requested', () => {
            const mockMesh = {
                isMesh: true,
                castShadow: false,
                receiveShadow: false
            };

            const mockModel = new THREE.Group();
            mockModel.traverse = jest.fn((callback) => callback(mockMesh));
            const mockGltf = { scene: mockModel };

            const options = { castShadow: true, receiveShadow: true };
            modelLoader.processLoadedModel(mockGltf, options);

            expect(mockMesh.castShadow).toBe(true);
            expect(mockMesh.receiveShadow).toBe(true);
        });

        test('should store metadata in userData', () => {
            const mockModel = new THREE.Group();
            const mockGltf = { scene: mockModel };

            const options = { scale: 1.5 };
            const result = modelLoader.processLoadedModel(mockGltf, options);

            expect(result.userData.originalGltf).toBe(mockGltf);
            expect(result.userData.loadOptions).toBe(options);
            expect(result.userData.loadTime).toBeGreaterThan(0);
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            modelLoader = new ModelLoader();
        });

        test('should identify non-retryable errors', () => {
            expect(modelLoader.isNonRetryableError(new Error('404 Not Found'))).toBe(true);
            expect(modelLoader.isNonRetryableError(new Error('File not found'))).toBe(true);
            expect(modelLoader.isNonRetryableError(new Error('Forbidden'))).toBe(true);
            expect(modelLoader.isNonRetryableError(new Error('Unauthorized'))).toBe(true);
            expect(modelLoader.isNonRetryableError(new Error('Invalid format'))).toBe(true);
            expect(modelLoader.isNonRetryableError(new Error('Network timeout'))).toBe(false);
        });

        test('should call error callbacks', async () => {
            const errorCallback = jest.fn();
            const error = new Error('Load failed');

            mockGLTFLoader.load.mockImplementation((path, onLoad, onProgress, onError) => {
                setTimeout(() => onError(error), 10);
            });

            modelLoader.onError('heart.glb', errorCallback);

            try {
                await modelLoader.loadModel('heart.glb');
            } catch (e) {
                // Expected to throw
            }

            expect(errorCallback).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('Concurrent Loading', () => {
        beforeEach(() => {
            modelLoader = new ModelLoader();
        });

        test('should handle concurrent loads of same model', async () => {
            const mockModel = new THREE.Group();
            const mockGltf = { scene: mockModel };

            mockGLTFLoader.load.mockImplementation((path, onLoad) => {
                setTimeout(() => onLoad(mockGltf), 50);
            });

            // Start multiple concurrent loads
            const promises = [
                modelLoader.loadModel('heart.glb'),
                modelLoader.loadModel('heart.glb'),
                modelLoader.loadModel('heart.glb')
            ];

            const results = await Promise.all(promises);

            // Should only call loader once
            expect(mockGLTFLoader.load).toHaveBeenCalledTimes(1);
            
            // All results should be valid but different instances
            results.forEach(result => {
                expect(result).toBeInstanceOf(THREE.Group);
            });
        });
    });

    describe('Disposal', () => {
        beforeEach(() => {
            modelLoader = new ModelLoader();
        });

        test('should dispose all resources', () => {
            modelLoader.dispose();

            expect(modelLoader.modelCache.size).toBe(0);
            expect(modelLoader.loadingModels.size).toBe(0);
            expect(modelLoader.progressCallbacks.size).toBe(0);
            expect(modelLoader.errorCallbacks.size).toBe(0);
            expect(mockDRACOLoader.dispose).toHaveBeenCalled();
            expect(modelLoader.gltfLoader).toBeNull();
            expect(modelLoader.dracoLoader).toBeNull();
            expect(modelLoader.textureLoader).toBeNull();
        });
    });
});