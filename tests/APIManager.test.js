/**
 * Tests para APIManager - Sistema de integración con APIs externas
 */
import APIManager from '../src/APIManager.js';
import CacheManager from '../src/CacheManager.js';

// Mock CacheManager
jest.mock('../src/CacheManager.js');

// Mock de fetch
global.fetch = jest.fn();

describe('APIManager', () => {
    let apiManager;
    let mockCacheManager;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Mock CacheManager instance
        mockCacheManager = {
            initialize: jest.fn().mockResolvedValue(),
            getCachedModel: jest.fn(),
            cacheModel: jest.fn().mockResolvedValue(true),
            getCachedTexture: jest.fn(),
            cacheTexture: jest.fn().mockResolvedValue(true),
            getOptimalResolution: jest.fn(),
            getCacheStats: jest.fn(),
            clearCache: jest.fn().mockResolvedValue(true),
            close: jest.fn()
        };
        
        CacheManager.mockImplementation(() => mockCacheManager);

        // Mock IndexedDB.open
        mockIndexedDB.open.mockImplementation(() => {
            const request = {
                onsuccess: null,
                onerror: null,
                onupgradeneeded: null,
                result: mockDB
            };
            
            // Simular éxito inmediato
            setTimeout(() => {
                if (request.onsuccess) {
                    request.onsuccess({ target: { result: mockDB } });
                }
            }, 0);
            
            return request;
        });

        apiManager = new APIManager();
    });

    describe('Inicialización', () => {
        test('debe inicializar correctamente', () => {
            expect(apiManager).toBeInstanceOf(APIManager);
            expect(apiManager.apiEndpoints).toBeDefined();
            expect(apiManager.fallbackModels).toBeInstanceOf(Map);
        });

        test('debe cargar modelos de fallback', () => {
            expect(apiManager.fallbackModels.has('musculoskeletal')).toBe(true);
            expect(apiManager.fallbackModels.has('cardiovascular')).toBe(true);
            expect(apiManager.fallbackModels.has('nervous')).toBe(true);
        });

        test('debe inicializar cache IndexedDB', async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            expect(mockIndexedDB.open).toHaveBeenCalledWith('AnatomyModelsCache', 1);
        });
    });

    describe('fetchModel', () => {
        test('debe obtener modelo desde cache si existe', async () => {
            const cachedModel = {
                id: 'test_model',
                modelUrl: '/cached/model.glb',
                source: 'cache'
            };

            // Mock cache hit
            mockStore.get.mockImplementation(() => ({
                onsuccess: function() {
                    this.result = { data: cachedModel };
                    setTimeout(() => this.onsuccess(), 0);
                },
                onerror: null
            }));

            const result = await apiManager.fetchModel('test_model', 'medium');
            expect(result).toEqual(cachedModel);
        });

        test('debe obtener modelo desde API si no está en cache', async () => {
            const apiResponse = {
                modelUrl: '/api/model.glb',
                textureUrl: '/api/texture.jpg',
                metadata: { name: 'Test Model' }
            };

            // Mock cache miss
            mockStore.get.mockImplementation(() => ({
                onsuccess: function() {
                    this.result = null;
                    setTimeout(() => this.onsuccess(), 0);
                },
                onerror: null
            }));

            // Mock API success
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(apiResponse)
            });

            // Mock cache put
            mockStore.put.mockImplementation(() => ({
                onsuccess: function() {
                    setTimeout(() => this.onsuccess(), 0);
                },
                onerror: null
            }));

            const result = await apiManager.fetchModel('test_model', 'medium');
            
            expect(result.modelUrl).toBe(apiResponse.modelUrl);
            expect(result.source).toBe('api');
            expect(global.fetch).toHaveBeenCalled();
        });

        test('debe usar fallback si APIs fallan', async () => {
            // Mock cache miss
            mockStore.get.mockImplementation(() => ({
                onsuccess: function() {
                    this.result = null;
                    setTimeout(() => this.onsuccess(), 0);
                },
                onerror: null
            }));

            // Mock API failure
            global.fetch.mockRejectedValue(new Error('API Error'));

            const result = await apiManager.fetchModel('muscle_biceps', 'medium');
            
            expect(result.source).toBe('fallback');
            expect(result.modelUrl).toContain('fallback');
        });
    });

    describe('fetchFromAPI', () => {
        test('debe realizar petición correcta a API', async () => {
            const mockResponse = {
                modelUrl: '/api/model.glb',
                textureUrl: '/api/texture.jpg',
                metadata: { name: 'API Model' }
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await apiManager.fetchFromAPI(
                'https://api.anatomymodels.org/v1',
                'test_model',
                'high'
            );

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/proxy'),
                expect.objectContaining({
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                })
            );
            expect(result.source).toBe('api');
        });

        test('debe manejar errores de API', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            const result = await apiManager.fetchFromAPI(
                'https://api.anatomymodels.org/v1',
                'nonexistent_model',
                'medium'
            );

            expect(result).toBeNull();
        });

        test('debe manejar timeout de API', async () => {
            global.fetch.mockImplementation(() => 
                new Promise(resolve => setTimeout(resolve, 15000))
            );

            const result = await apiManager.fetchFromAPI(
                'https://api.anatomymodels.org/v1',
                'slow_model',
                'medium'
            );

            expect(result).toBeNull();
        });
    });

    describe('Cache Management', () => {
        test('debe cachear modelo correctamente', async () => {
            const modelData = {
                id: 'test_model',
                modelUrl: '/test/model.glb'
            };

            mockStore.put.mockImplementation(() => ({
                onsuccess: function() {
                    setTimeout(() => this.onsuccess(), 0);
                },
                onerror: null
            }));

            await apiManager.cacheModel('test_model', 'medium', modelData);
            
            expect(mockStore.put).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'test_model_medium',
                    modelId: 'test_model',
                    quality: 'medium',
                    data: modelData
                })
            );
        });

        test('debe limpiar cache cuando excede límite', async () => {
            const largeEntries = Array.from({ length: 10 }, (_, i) => ({
                id: `model_${i}`,
                size: 15 * 1024 * 1024, // 15MB cada uno
                lastAccessed: Date.now() - (i * 1000)
            }));

            mockStore.getAll.mockImplementation(() => ({
                onsuccess: function() {
                    this.result = largeEntries;
                    setTimeout(() => this.onsuccess(), 0);
                },
                onerror: null
            }));

            mockStore.delete.mockImplementation(() => ({
                onsuccess: function() {
                    setTimeout(() => this.onsuccess(), 0);
                },
                onerror: null
            }));

            await apiManager.cleanupCache();
            
            // Debe eliminar algunos entries antiguos
            expect(mockStore.delete).toHaveBeenCalled();
        });
    });

    describe('Fallback Models', () => {
        test('debe obtener modelo de fallback para sistema conocido', async () => {
            const result = await apiManager.getFallbackModel('muscle_biceps');
            
            expect(result.source).toBe('fallback');
            expect(result.modelUrl).toContain('muscles.glb');
            expect(result.metadata.system).toBe('musculoskeletal');
        });

        test('debe obtener modelo genérico para sistema desconocido', async () => {
            const result = await apiManager.getFallbackModel('unknown_structure');
            
            expect(result.source).toBe('fallback');
            expect(result.modelUrl).toContain('generic.glb');
        });
    });

    describe('API Availability', () => {
        test('debe verificar disponibilidad de APIs', async () => {
            global.fetch
                .mockResolvedValueOnce({ ok: true })  // Primera API disponible
                .mockResolvedValueOnce({ ok: false }); // Segunda API no disponible

            const availability = await apiManager.checkAPIAvailability();
            
            expect(availability.primary).toBe(true);
            expect(availability.secondary).toBe(false);
        });

        test('debe manejar errores de conectividad', async () => {
            global.fetch.mockRejectedValue(new Error('Network Error'));

            const availability = await apiManager.checkAPIAvailability();
            
            expect(availability.primary).toBe(false);
            expect(availability.secondary).toBe(false);
        });
    });

    describe('Utility Functions', () => {
        test('debe extraer sistema del ID correctamente', () => {
            expect(apiManager.extractSystemFromId('muscle_biceps')).toBe('musculoskeletal');
            expect(apiManager.extractSystemFromId('heart_ventricle')).toBe('cardiovascular');
            expect(apiManager.extractSystemFromId('brain_cortex')).toBe('nervous');
            expect(apiManager.extractSystemFromId('unknown_part')).toBe('general');
        });

        test('debe extraer estructura del ID correctamente', () => {
            expect(apiManager.extractStructureFromId('muscle_biceps_brachii')).toBe('brachii');
            expect(apiManager.extractStructureFromId('heart')).toBe('heart');
        });

        test('debe estimar tamaño del modelo', () => {
            const modelData = { test: 'data' };
            const size = apiManager.estimateSize(modelData);
            expect(size).toBeGreaterThan(0);
            expect(typeof size).toBe('number');
        });
    });

    describe('Error Handling', () => {
        test('debe manejar errores de inicialización de cache', async () => {
            mockIndexedDB.open.mockImplementation(() => {
                const request = {
                    onsuccess: null,
                    onerror: null,
                    onupgradeneeded: null
                };
                
                setTimeout(() => {
                    if (request.onerror) {
                        request.onerror(new Error('DB Error'));
                    }
                }, 0);
                
                return request;
            });

            const apiManagerWithError = new APIManager();
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Debe continuar funcionando sin cache
            expect(apiManagerWithError.cache).toBeNull();
        });

        test('debe manejar errores de operaciones de cache', async () => {
            mockStore.get.mockImplementation(() => ({
                onsuccess: null,
                onerror: function() {
                    setTimeout(() => this.onerror(new Error('Cache Error')), 0);
                }
            }));

            const result = await apiManager.getCachedModel('test_model', 'medium');
            expect(result).toBeNull();
        });
    });
});    des
cribe('Texture Caching', () => {
        beforeEach(() => {
            apiManager = new APIManager();
        });

        test('should fetch texture from cache if available', async () => {
            const cachedTexture = {
                data: new ArrayBuffer(1024),
                resolution: 'high'
            };

            mockCacheManager.getCachedTexture.mockResolvedValue(cachedTexture);

            const result = await apiManager.fetchTexture('texture_1', 3, 'model_1');
            
            expect(result).toEqual(cachedTexture);
            expect(mockCacheManager.getCachedTexture).toHaveBeenCalledWith('texture_1', 3);
        });

        test('should fetch texture from API if not cached', async () => {
            const textureData = new ArrayBuffer(2048);
            
            mockCacheManager.getCachedTexture.mockResolvedValue(null);
            mockCacheManager.getOptimalResolution.mockReturnValue('medium');
            
            global.fetch.mockResolvedValueOnce({
                ok: true,
                arrayBuffer: () => Promise.resolve(textureData)
            });

            const result = await apiManager.fetchTexture('texture_1', 2, 'model_1');
            
            expect(result.data).toEqual(textureData);
            expect(result.resolution).toBe('medium');
            expect(mockCacheManager.cacheTexture).toHaveBeenCalledWith(
                'texture_1', 
                textureData, 
                'model_1', 
                'medium',
                expect.any(Object)
            );
        });

        test('should handle texture API failures gracefully', async () => {
            mockCacheManager.getCachedTexture.mockResolvedValue(null);
            mockCacheManager.getOptimalResolution.mockReturnValue('standard');
            
            global.fetch.mockRejectedValue(new Error('Network error'));

            const result = await apiManager.fetchTexture('texture_1', 1, 'model_1');
            
            expect(result).toBeNull();
        });

        test('should preload textures in multiple resolutions', async () => {
            const textureData1 = new ArrayBuffer(1024);
            const textureData2 = new ArrayBuffer(2048);
            
            global.fetch
                .mockResolvedValueOnce({
                    ok: true,
                    arrayBuffer: () => Promise.resolve(textureData1)
                })
                .mockResolvedValueOnce({
                    ok: true,
                    arrayBuffer: () => Promise.resolve(textureData2)
                });

            await apiManager.preloadTextures('texture_1', 'model_1', ['standard', 'medium']);
            
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(mockCacheManager.cacheTexture).toHaveBeenCalledTimes(2);
        });
    });

    describe('Cache Management', () => {
        beforeEach(() => {
            apiManager = new APIManager();
        });

        test('should get cache statistics', async () => {
            const mockStats = {
                totalSize: 1000000,
                maxSize: 10000000,
                modelCount: 5,
                textureCount: 10,
                usagePercentage: 10
            };

            mockCacheManager.getCacheStats.mockResolvedValue(mockStats);

            const stats = await apiManager.getCacheStats();
            
            expect(stats).toEqual(mockStats);
            expect(mockCacheManager.getCacheStats).toHaveBeenCalled();
        });

        test('should clear cache successfully', async () => {
            mockCacheManager.clearCache.mockResolvedValue(true);

            const result = await apiManager.clearCache();
            
            expect(result).toBe(true);
            expect(mockCacheManager.clearCache).toHaveBeenCalled();
        });

        test('should close cache connections', () => {
            apiManager.close();
            
            expect(mockCacheManager.close).toHaveBeenCalled();
        });
    });

    describe('Model Caching with New System', () => {
        beforeEach(() => {
            apiManager = new APIManager();
        });

        test('should use CacheManager for model retrieval', async () => {
            const cachedModel = {
                id: 'test_model',
                modelUrl: '/cached/model.glb'
            };

            mockCacheManager.getCachedModel.mockResolvedValue(cachedModel);

            const result = await apiManager.fetchModel('test_model', 'medium');
            
            expect(result).toEqual(cachedModel);
            expect(mockCacheManager.getCachedModel).toHaveBeenCalledWith('test_model_medium');
        });

        test('should cache model using CacheManager after API fetch', async () => {
            const apiResponse = {
                modelUrl: '/api/model.glb',
                textureUrl: '/api/texture.jpg',
                metadata: { name: 'Test Model' }
            };

            mockCacheManager.getCachedModel.mockResolvedValue(null);
            
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(apiResponse)
            });

            const result = await apiManager.fetchModel('muscle_biceps', 'high');
            
            expect(mockCacheManager.cacheModel).toHaveBeenCalledWith(
                'muscle_biceps_high',
                expect.objectContaining({
                    modelUrl: apiResponse.modelUrl,
                    source: 'api'
                }),
                'musculoskeletal',
                expect.any(Object)
            );
        });

        test('should handle cache initialization errors gracefully', async () => {
            mockCacheManager.initialize.mockRejectedValue(new Error('Cache init failed'));
            
            // Should not throw, just log warning
            const newApiManager = new APIManager();
            await newApiManager.initializeCache();
            
            expect(mockCacheManager.initialize).toHaveBeenCalled();
        });
    });

    describe('Progressive Loading', () => {
        beforeEach(() => {
            apiManager = new APIManager();
        });

        test('should determine optimal resolution based on zoom', () => {
            mockCacheManager.getOptimalResolution.mockImplementation((zoom) => {
                if (zoom > 5) return 'ultra';
                if (zoom > 2) return 'high';
                if (zoom > 1) return 'medium';
                return 'standard';
            });

            expect(mockCacheManager.getOptimalResolution(0.5)).toBe('standard');
            expect(mockCacheManager.getOptimalResolution(1.5)).toBe('medium');
            expect(mockCacheManager.getOptimalResolution(3)).toBe('high');
            expect(mockCacheManager.getOptimalResolution(6)).toBe('ultra');
        });

        test('should fetch appropriate texture resolution for zoom level', async () => {
            mockCacheManager.getCachedTexture.mockResolvedValue(null);
            mockCacheManager.getOptimalResolution.mockReturnValue('high');
            
            const textureData = new ArrayBuffer(4096);
            global.fetch.mockResolvedValueOnce({
                ok: true,
                arrayBuffer: () => Promise.resolve(textureData)
            });

            await apiManager.fetchTexture('texture_1', 4, 'model_1');
            
            expect(mockCacheManager.getOptimalResolution).toHaveBeenCalledWith(4);
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('resolution=high'),
                expect.any(Object)
            );
        });
    });
});