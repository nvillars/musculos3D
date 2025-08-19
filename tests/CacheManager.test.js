import CacheManager from '../src/CacheManager.js';

// Mock IndexedDB
const mockIndexedDB = {
    databases: new Map(),
    open: jest.fn(),
    deleteDatabase: jest.fn()
};

const mockIDBRequest = {
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: null,
    error: null
};

const mockIDBTransaction = {
    objectStore: jest.fn(),
    oncomplete: null,
    onerror: null,
    onabort: null
};

const mockIDBObjectStore = {
    put: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    count: jest.fn(),
    openCursor: jest.fn(),
    createIndex: jest.fn(),
    index: jest.fn()
};

const mockIDBDatabase = {
    transaction: jest.fn(() => mockIDBTransaction),
    createObjectStore: jest.fn(() => mockIDBObjectStore),
    objectStoreNames: {
        contains: jest.fn(() => false)
    },
    close: jest.fn()
};

// Setup global mocks
global.indexedDB = mockIndexedDB;
global.IDBRequest = jest.fn();
global.IDBTransaction = jest.fn();
global.IDBObjectStore = jest.fn();
global.IDBDatabase = jest.fn();

describe('CacheManager', () => {
    let cacheManager;
    let mockDB;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup mock database
        mockDB = { ...mockIDBDatabase };
        mockIDBTransaction.objectStore.mockReturnValue(mockIDBObjectStore);
        mockDB.transaction.mockReturnValue(mockIDBTransaction);
        
        cacheManager = new CacheManager({
            maxStorageSize: 10 * 1024 * 1024, // 10MB for testing
            maxTextureSize: 1 * 1024 * 1024   // 1MB for testing
        });
    });

    afterEach(() => {
        if (cacheManager) {
            cacheManager.close();
        }
    });

    describe('Initialization', () => {
        test('should initialize with default options', () => {
            const defaultCache = new CacheManager();
            expect(defaultCache.maxStorageSize).toBe(500 * 1024 * 1024);
            expect(defaultCache.maxTextureSize).toBe(50 * 1024 * 1024);
            expect(defaultCache.dbName).toBe('AnatomicalViewerCache');
        });

        test('should initialize with custom options', () => {
            const customCache = new CacheManager({
                dbName: 'TestCache',
                maxStorageSize: 100 * 1024 * 1024
            });
            expect(customCache.dbName).toBe('TestCache');
            expect(customCache.maxStorageSize).toBe(100 * 1024 * 1024);
        });

        test('should initialize IndexedDB successfully', async () => {
            mockIndexedDB.open.mockImplementation((name, version) => {
                const request = { ...mockIDBRequest };
                setTimeout(() => {
                    request.result = mockDB;
                    if (request.onsuccess) request.onsuccess();
                }, 0);
                return request;
            });

            await cacheManager.initialize();
            expect(cacheManager.isInitialized).toBe(true);
            expect(mockIndexedDB.open).toHaveBeenCalledWith('AnatomicalViewerCache', 1);
        });

        test('should handle IndexedDB initialization errors', async () => {
            mockIndexedDB.open.mockImplementation(() => {
                const request = { ...mockIDBRequest };
                setTimeout(() => {
                    request.error = new Error('DB Error');
                    if (request.onerror) request.onerror();
                }, 0);
                return request;
            });

            await expect(cacheManager.initialize()).rejects.toThrow('Error opening IndexedDB');
        });
    });

    describe('Model Caching', () => {
        beforeEach(async () => {
            // Mock successful initialization
            mockIndexedDB.open.mockImplementation(() => {
                const request = { ...mockIDBRequest };
                setTimeout(() => {
                    request.result = mockDB;
                    if (request.onsuccess) request.onsuccess();
                }, 0);
                return request;
            });
            
            await cacheManager.initialize();
        });

        test('should cache model successfully', async () => {
            const modelData = { vertices: [1, 2, 3], faces: [0, 1, 2] };
            const modelId = 'test_model_1';
            const systemType = 'musculoskeletal';

            mockIDBObjectStore.put.mockImplementation(() => {
                const request = { ...mockIDBRequest };
                setTimeout(() => {
                    if (request.onsuccess) request.onsuccess();
                }, 0);
                return request;
            });

            const result = await cacheManager.cacheModel(modelId, modelData, systemType);
            expect(result).toBe(true);
            expect(mockIDBObjectStore.put).toHaveBeenCalled();
        });

        test('should retrieve cached model', async () => {
            const modelId = 'test_model_1';
            const expectedData = { vertices: [1, 2, 3], faces: [0, 1, 2] };

            mockIDBObjectStore.get.mockImplementation(() => {
                const request = { ...mockIDBRequest };
                setTimeout(() => {
                    request.result = { id: modelId, data: expectedData };
                    if (request.onsuccess) request.onsuccess();
                }, 0);
                return request;
            });

            const result = await cacheManager.getCachedModel(modelId);
            expect(result).toEqual(expectedData);
            expect(mockIDBObjectStore.get).toHaveBeenCalledWith(modelId);
        });

        test('should return null for non-existent model', async () => {
            mockIDBObjectStore.get.mockImplementation(() => {
                const request = { ...mockIDBRequest };
                setTimeout(() => {
                    request.result = undefined;
                    if (request.onsuccess) request.onsuccess();
                }, 0);
                return request;
            });

            const result = await cacheManager.getCachedModel('non_existent');
            expect(result).toBeNull();
        });
    });

    describe('Texture Caching', () => {
        beforeEach(async () => {
            mockIndexedDB.open.mockImplementation(() => {
                const request = { ...mockIDBRequest };
                setTimeout(() => {
                    request.result = mockDB;
                    if (request.onsuccess) request.onsuccess();
                }, 0);
                return request;
            });
            
            await cacheManager.initialize();
        });

        test('should cache texture successfully', async () => {
            const textureData = new ArrayBuffer(1024);
            const textureId = 'texture_1';
            const modelId = 'model_1';
            const resolution = 'high';

            mockIDBObjectStore.put.mockImplementation(() => {
                const request = { ...mockIDBRequest };
                setTimeout(() => {
                    if (request.onsuccess) request.onsuccess();
                }, 0);
                return request;
            });

            const result = await cacheManager.cacheTexture(textureId, textureData, modelId, resolution);
            expect(result).toBe(true);
        });

        test('should reject texture exceeding size limit', async () => {
            const largeTextureData = new ArrayBuffer(2 * 1024 * 1024); // 2MB, exceeds 1MB limit
            const textureId = 'large_texture';
            const modelId = 'model_1';

            await expect(
                cacheManager.cacheTexture(textureId, largeTextureData, modelId)
            ).rejects.toThrow('Texture size');
        });

        test('should retrieve texture with optimal resolution', async () => {
            const textureId = 'texture_1';
            const zoomLevel = 3;
            const expectedData = new ArrayBuffer(1024);

            mockIDBObjectStore.get.mockImplementation((id) => {
                const request = { ...mockIDBRequest };
                setTimeout(() => {
                    if (id === 'texture_1_high') {
                        request.result = {
                            id: id,
                            data: expectedData,
                            resolution: 'high',
                            size: 1024
                        };
                    } else {
                        request.result = undefined;
                    }
                    if (request.onsuccess) request.onsuccess();
                }, 0);
                return request;
            });

            const result = await cacheManager.getCachedTexture(textureId, zoomLevel);
            expect(result.data).toEqual(expectedData);
            expect(result.resolution).toBe('high');
        });

        test('should determine optimal resolution based on zoom level', () => {
            expect(cacheManager.getOptimalResolution(0.5)).toBe('standard');
            expect(cacheManager.getOptimalResolution(1.5)).toBe('medium');
            expect(cacheManager.getOptimalResolution(3)).toBe('high');
            expect(cacheManager.getOptimalResolution(6)).toBe('ultra');
        });
    });

    describe('LRU Cache Management', () => {
        beforeEach(async () => {
            mockIndexedDB.open.mockImplementation(() => {
                const request = { ...mockIDBRequest };
                setTimeout(() => {
                    request.result = mockDB;
                    if (request.onsuccess) request.onsuccess();
                }, 0);
                return request;
            });
            
            await cacheManager.initialize();
        });

        test('should update usage tracking', async () => {
            const itemId = 'test_item';
            const type = 'model';

            mockIDBObjectStore.get.mockImplementation(() => {
                const request = { ...mockIDBRequest };
                setTimeout(() => {
                    request.result = null; // No existing record
                    if (request.onsuccess) request.onsuccess();
                }, 0);
                return request;
            });

            mockIDBObjectStore.put.mockImplementation(() => {
                const request = { ...mockIDBRequest };
                setTimeout(() => {
                    if (request.onsuccess) request.onsuccess();
                }, 0);
                return request;
            });

            await cacheManager.updateUsageTracking(itemId, type);
            expect(mockIDBObjectStore.put).toHaveBeenCalled();
        });

        test('should calculate data size correctly', () => {
            const arrayBuffer = new ArrayBuffer(1024);
            expect(cacheManager.calculateDataSize(arrayBuffer)).toBe(1024);

            const string = 'test string';
            expect(cacheManager.calculateDataSize(string)).toBeGreaterThan(0);

            const blob = new Blob(['test']);
            expect(cacheManager.calculateDataSize(blob)).toBe(4);
        });

        test('should get current storage size', async () => {
            const mockModels = [
                { size: 1000 },
                { size: 2000 }
            ];
            const mockTextures = [
                { size: 500 },
                { size: 1500 }
            ];

            let modelIndex = 0;
            let textureIndex = 0;

            mockIDBObjectStore.openCursor.mockImplementation(() => {
                const request = { ...mockIDBRequest };
                setTimeout(() => {
                    const storeName = mockIDBTransaction.objectStore.mock.calls[
                        mockIDBTransaction.objectStore.mock.calls.length - 1
                    ][0];
                    
                    let cursor = null;
                    if (storeName === 'models' && modelIndex < mockModels.length) {
                        cursor = {
                            value: mockModels[modelIndex++],
                            continue: jest.fn()
                        };
                    } else if (storeName === 'textures' && textureIndex < mockTextures.length) {
                        cursor = {
                            value: mockTextures[textureIndex++],
                            continue: jest.fn()
                        };
                    }
                    
                    request.result = cursor;
                    if (request.onsuccess) request.onsuccess();
                }, 0);
                return request;
            });

            const totalSize = await cacheManager.getCurrentStorageSize();
            expect(totalSize).toBe(5000); // 1000 + 2000 + 500 + 1500
        });
    });

    describe('Cache Statistics', () => {
        beforeEach(async () => {
            mockIndexedDB.open.mockImplementation(() => {
                const request = { ...mockIDBRequest };
                setTimeout(() => {
                    request.result = mockDB;
                    if (request.onsuccess) request.onsuccess();
                }, 0);
                return request;
            });
            
            await cacheManager.initialize();
        });

        test('should get cache statistics', async () => {
            mockIDBObjectStore.count.mockImplementation(() => {
                const request = { ...mockIDBRequest };
                setTimeout(() => {
                    request.result = 5; // Mock count
                    if (request.onsuccess) request.onsuccess();
                }, 0);
                return request;
            });

            // Mock getCurrentStorageSize
            jest.spyOn(cacheManager, 'getCurrentStorageSize').mockResolvedValue(1000000);

            const stats = await cacheManager.getCacheStats();
            expect(stats).toHaveProperty('totalSize');
            expect(stats).toHaveProperty('maxSize');
            expect(stats).toHaveProperty('modelCount');
            expect(stats).toHaveProperty('textureCount');
            expect(stats).toHaveProperty('usagePercentage');
            expect(stats.usagePercentage).toBe(10); // 1MB / 10MB * 100
        });
    });

    describe('Cache Cleanup', () => {
        beforeEach(async () => {
            mockIndexedDB.open.mockImplementation(() => {
                const request = { ...mockIDBRequest };
                setTimeout(() => {
                    request.result = mockDB;
                    if (request.onsuccess) request.onsuccess();
                }, 0);
                return request;
            });
            
            await cacheManager.initialize();
        });

        test('should clear entire cache', async () => {
            mockIDBObjectStore.clear.mockImplementation(() => {
                const request = { ...mockIDBRequest };
                setTimeout(() => {
                    if (request.onsuccess) request.onsuccess();
                }, 0);
                return request;
            });

            const result = await cacheManager.clearCache();
            expect(result).toBe(true);
            expect(mockIDBObjectStore.clear).toHaveBeenCalledTimes(4); // 4 stores
        });

        test('should remove specific item from cache', async () => {
            const itemId = 'test_item';
            const type = 'model';

            mockIDBObjectStore.delete.mockImplementation(() => {
                const request = { ...mockIDBRequest };
                setTimeout(() => {
                    if (request.onsuccess) request.onsuccess();
                }, 0);
                return request;
            });

            const result = await cacheManager.removeFromCache(itemId, type);
            expect(result).toBe(true);
            expect(mockIDBObjectStore.delete).toHaveBeenCalledWith(itemId);
        });
    });

    describe('Error Handling', () => {
        test('should handle database errors gracefully', async () => {
            mockIndexedDB.open.mockImplementation(() => {
                const request = { ...mockIDBRequest };
                setTimeout(() => {
                    request.error = new Error('Database error');
                    if (request.onerror) request.onerror();
                }, 0);
                return request;
            });

            await expect(cacheManager.initialize()).rejects.toThrow();
        });

        test('should handle transaction errors in caching', async () => {
            await cacheManager.initialize();
            
            mockIDBObjectStore.put.mockImplementation(() => {
                const request = { ...mockIDBRequest };
                setTimeout(() => {
                    request.error = new Error('Transaction error');
                    if (request.onerror) request.onerror();
                }, 0);
                return request;
            });

            await expect(
                cacheManager.cacheModel('test', {}, 'system')
            ).rejects.toThrow('Error caching model');
        });
    });
});