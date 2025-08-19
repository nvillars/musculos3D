/**
 * Complete Workflow Integration Tests
 * Tests the full user journey from initialization to model manipulation
 */

import { jest } from '@jest/globals';
import AnatomicalApp from '../../src/AnatomicalApp.js';
import { createMockCanvas, createMockWebGL, mockThreeJS } from '../utils/test-helpers.js';

// Mock Three.js
mockThreeJS();

// Mock DOM elements
const mockDOM = () => {
    const canvas = createMockCanvas();
    const loadingOverlay = document.createElement('div');
    const errorMessage = document.createElement('div');
    const loadingText = document.createElement('div');
    const loadingProgress = document.createElement('div');
    const errorText = document.createElement('div');
    
    loadingOverlay.id = 'loading-overlay';
    errorMessage.id = 'error-message';
    loadingText.id = 'loading-text';
    loadingProgress.id = 'loading-progress';
    errorText.id = 'error-text';
    canvas.id = 'anatomical-canvas';
    
    document.body.appendChild(canvas);
    document.body.appendChild(loadingOverlay);
    document.body.appendChild(errorMessage);
    document.body.appendChild(loadingText);
    document.body.appendChild(loadingProgress);
    document.body.appendChild(errorText);
    
    return { canvas, loadingOverlay, errorMessage, loadingText, loadingProgress, errorText };
};

describe('Complete Workflow Integration Tests', () => {
    let app;
    let mockElements;
    
    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '';
        mockElements = mockDOM();
        
        // Mock WebGL
        createMockWebGL();
        
        // Mock fetch for API calls
        global.fetch = jest.fn();
        
        // Mock IndexedDB
        global.indexedDB = {
            open: jest.fn().mockResolvedValue({
                result: {
                    createObjectStore: jest.fn(),
                    transaction: jest.fn().mockReturnValue({
                        objectStore: jest.fn().mockReturnValue({
                            add: jest.fn(),
                            get: jest.fn(),
                            delete: jest.fn(),
                            clear: jest.fn()
                        })
                    })
                }
            })
        };
        
        // Mock performance API
        global.performance = {
            now: jest.fn(() => Date.now()),
            memory: {
                usedJSHeapSize: 50 * 1024 * 1024,
                totalJSHeapSize: 100 * 1024 * 1024,
                jsHeapSizeLimit: 2 * 1024 * 1024 * 1024
            }
        };
    });
    
    afterEach(() => {
        if (app) {
            app.destroy();
        }
        jest.clearAllMocks();
    });

    describe('Application Initialization Workflow', () => {
        test('should initialize all components in correct order', async () => {
            // Mock successful API responses
            global.fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
            });
            
            app = new AnatomicalApp({
                enablePerformanceMonitoring: true,
                enableOfflineMode: true
            });
            
            // Wait for initialization
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            // Verify all components are initialized
            expect(app.errorHandler).toBeDefined();
            expect(app.cacheManager).toBeDefined();
            expect(app.apiManager).toBeDefined();
            expect(app.renderer).toBeDefined();
            expect(app.modelLoader).toBeDefined();
            expect(app.anatomyManager).toBeDefined();
            expect(app.interactionController).toBeDefined();
            expect(app.uiManager).toBeDefined();
            expect(app.performanceManager).toBeDefined();
            expect(app.zoomManager).toBeDefined();
            
            // Verify initialization status
            const status = app.getStatus();
            expect(status.initialized).toBe(true);
            expect(status.errorCount).toBe(0);
        });
        
        test('should handle initialization errors gracefully', async () => {
            // Mock WebGL failure
            const originalGetContext = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = jest.fn(() => null);
            
            app = new AnatomicalApp();
            
            // Wait for error handling
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Verify error handling
            expect(app.isInitialized).toBe(false);
            expect(mockElements.errorMessage.style.display).toBe('block');
            
            // Restore original method
            HTMLCanvasElement.prototype.getContext = originalGetContext;
        });
    });

    describe('System Loading Workflow', () => {
        beforeEach(async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
            });
            
            app = new AnatomicalApp();
            
            // Wait for initialization
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
        });
        
        test('should load musculoskeletal system successfully', async () => {
            const systemId = 'musculoskeletal';
            
            await app.loadAnatomicalSystem(systemId);
            
            // Verify system is loaded
            expect(app.currentSystem).toBe(systemId);
            expect(app.loadedModels.has(systemId)).toBe(true);
            
            // Verify anatomy manager is updated
            expect(app.anatomyManager.getActiveSystem()).toBe(systemId);
            
            // Verify performance metrics
            const status = app.getStatus();
            expect(status.performanceMetrics.loadTime).toBeGreaterThan(0);
        });
        
        test('should handle API failure with local fallback', async () => {
            // Mock API failure
            global.fetch
                .mockRejectedValueOnce(new Error('API Error'))
                .mockResolvedValueOnce({
                    ok: true,
                    arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
                });
            
            const systemId = 'cardiovascular';
            
            await app.loadAnatomicalSystem(systemId);
            
            // Verify system is still loaded via fallback
            expect(app.currentSystem).toBe(systemId);
            expect(app.loadedModels.has(systemId)).toBe(true);
        });
        
        test('should load multiple systems sequentially', async () => {
            const systems = ['musculoskeletal', 'cardiovascular', 'nervous'];
            
            for (const systemId of systems) {
                await app.loadAnatomicalSystem(systemId);
                expect(app.loadedModels.has(systemId)).toBe(true);
            }
            
            // Verify all systems are loaded
            const status = app.getStatus();
            expect(status.loadedModels).toEqual(systems);
        });
    });

    describe('Structure Interaction Workflow', () => {
        beforeEach(async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
            });
            
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            // Load a system for testing
            await app.loadAnatomicalSystem('musculoskeletal');
        });
        
        test('should handle structure selection', () => {
            const mockObject = {
                name: 'femur',
                userData: {
                    structureType: 'bone',
                    systemId: 'musculoskeletal'
                },
                material: {
                    emissive: { setHex: jest.fn() }
                }
            };
            
            const mockIntersection = {
                point: { x: 1, y: 2, z: 3 }
            };
            
            // Simulate structure selection
            app.handleStructureSelection(mockObject, mockIntersection);
            
            // Verify selection handling
            expect(app.selectedStructure).toBe(mockObject);
            expect(app.anatomyManager.highlightStructure).toHaveBeenCalledWith('femur', 0x44aa44);
        });
        
        test('should handle structure hover effects', () => {
            const mockObject = {
                name: 'humerus',
                userData: {
                    structureType: 'bone',
                    systemId: 'musculoskeletal'
                },
                material: {
                    emissive: { setHex: jest.fn() }
                }
            };
            
            // Simulate hover
            app.handleStructureHover(mockObject);
            
            // Verify hover effect
            expect(mockObject.material.emissive.setHex).toHaveBeenCalledWith(0x222222);
        });
        
        test('should handle structure manipulation commands', async () => {
            const structureName = 'radius';
            
            // Test isolation
            await app.anatomyManager.isolateStructure(structureName);
            expect(app.anatomyManager.isolateStructure).toHaveBeenCalledWith(structureName);
            
            // Test hiding
            await app.anatomyManager.hideStructure(structureName);
            expect(app.anatomyManager.hideStructure).toHaveBeenCalledWith(structureName);
            
            // Test showing
            await app.anatomyManager.showStructure(structureName);
            expect(app.anatomyManager.showStructure).toHaveBeenCalledWith(structureName);
        });
    });

    describe('Search Functionality Workflow', () => {
        beforeEach(async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
            });
            
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            await app.loadAnatomicalSystem('musculoskeletal');
        });
        
        test('should search for anatomical structures', async () => {
            const query = 'femur';
            const mockResults = [
                { name: 'femur', type: 'bone', system: 'musculoskeletal' },
                { name: 'femoral_artery', type: 'vessel', system: 'cardiovascular' }
            ];
            
            // Mock search results
            app.anatomyManager.searchStructures = jest.fn().mockResolvedValue(mockResults);
            
            await app.searchStructures(query);
            
            // Verify search was performed
            expect(app.anatomyManager.searchStructures).toHaveBeenCalledWith(query);
            expect(app.uiManager.updateSearchResults).toHaveBeenCalledWith(mockResults);
        });
        
        test('should handle empty search results', async () => {
            const query = 'nonexistent';
            
            app.anatomyManager.searchStructures = jest.fn().mockResolvedValue([]);
            
            await app.searchStructures(query);
            
            expect(app.uiManager.updateSearchResults).toHaveBeenCalledWith([]);
        });
        
        test('should handle search errors gracefully', async () => {
            const query = 'error';
            
            app.anatomyManager.searchStructures = jest.fn().mockRejectedValue(new Error('Search failed'));
            
            await app.searchStructures(query);
            
            expect(app.uiManager.updateSearchResults).toHaveBeenCalledWith([]);
        });
    });

    describe('Zoom and Navigation Workflow', () => {
        beforeEach(async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
            });
            
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            await app.loadAnatomicalSystem('musculoskeletal');
        });
        
        test('should handle zoom level changes', () => {
            const mockInfo = {
                distance: 5.0,
                target: { x: 0, y: 0, z: 0 }
            };
            
            // Simulate controls change
            app.handleControlsChange(mockInfo);
            
            // Verify zoom manager is updated
            expect(app.zoomManager.updateDistance).toHaveBeenCalledWith(5.0);
        });
        
        test('should load high-res textures on deep zoom', async () => {
            const systemId = 'musculoskeletal';
            const mockTextures = {
                'femur': { /* mock texture */ },
                'tibia': { /* mock texture */ }
            };
            
            // Mock API response for high-res textures
            app.apiManager.fetchTextures = jest.fn().mockResolvedValue(mockTextures);
            
            await app.loadHighResTextures(systemId);
            
            // Verify high-res textures were requested
            expect(app.apiManager.fetchTextures).toHaveBeenCalledWith(systemId, 'ultra');
        });
        
        test('should handle zoom limit reached', () => {
            const limit = 'maximum';
            
            // Simulate zoom limit callback
            app.zoomManager.onZoomLimitReached(limit);
            
            // Verify UI is updated
            expect(app.uiManager.showZoomLimitMessage).toHaveBeenCalledWith(limit);
        });
    });

    describe('Performance Monitoring Workflow', () => {
        beforeEach(async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
            });
            
            app = new AnatomicalApp({
                enablePerformanceMonitoring: true
            });
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
        });
        
        test('should monitor performance metrics', () => {
            const memoryInfo = {
                used: 100,
                total: 200,
                limit: 2048,
                percentage: 5
            };
            
            // Simulate low performance
            app.handleLowPerformance(25, memoryInfo);
            
            // Verify performance handling
            expect(app.renderer.setQualityLevel).toHaveBeenCalledWith('medium');
            expect(app.uiManager.showPerformanceWarning).toHaveBeenCalledWith(25, memoryInfo);
        });
        
        test('should get memory information', () => {
            const memoryInfo = app.getMemoryInfo();
            
            expect(memoryInfo).toHaveProperty('used');
            expect(memoryInfo).toHaveProperty('total');
            expect(memoryInfo).toHaveProperty('limit');
            expect(memoryInfo).toHaveProperty('percentage');
            expect(memoryInfo.used).toBeGreaterThan(0);
        });
        
        test('should export performance metrics', () => {
            const metrics = app.getPerformanceMetrics();
            
            expect(metrics).toHaveProperty('lazyLoading');
            expect(metrics).toHaveProperty('memory');
            expect(metrics).toHaveProperty('timing');
            expect(metrics).toHaveProperty('renderer');
        });
    });

    describe('Error Handling Workflow', () => {
        beforeEach(async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
            });
            
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
        });
        
        test('should handle and log errors', () => {
            const error = new Error('Test error');
            const context = { type: 'test_error', component: 'TestComponent' };
            
            app.errorHandler.logError(error, context);
            
            // Verify error is logged
            const errorLog = app.getErrorLog(1);
            expect(errorLog).toHaveLength(1);
            expect(errorLog[0]).toMatchObject({
                message: 'Test error',
                context: context
            });
        });
        
        test('should export error log for debugging', () => {
            const error = new Error('Debug test error');
            app.errorHandler.logError(error, { type: 'debug_test' });
            
            const debugData = app.exportDebugData();
            
            expect(debugData).toHaveProperty('status');
            expect(debugData).toHaveProperty('errorLog');
            expect(debugData).toHaveProperty('performanceLog');
            expect(debugData.errorLog.length).toBeGreaterThan(0);
        });
        
        test('should clear error log', () => {
            // Add some errors
            app.errorHandler.logError(new Error('Error 1'), { type: 'test' });
            app.errorHandler.logError(new Error('Error 2'), { type: 'test' });
            
            // Clear log
            app.clearErrorLog();
            
            // Verify log is cleared
            const errorLog = app.getErrorLog();
            expect(errorLog).toHaveLength(0);
        });
    });

    describe('Cache Management Workflow', () => {
        beforeEach(async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
            });
            
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
        });
        
        test('should cache loaded models', async () => {
            const systemId = 'musculoskeletal';
            
            await app.loadAnatomicalSystem(systemId);
            
            // Verify model is cached
            expect(app.cacheManager.cacheModel).toHaveBeenCalledWith(
                systemId, 
                expect.any(ArrayBuffer)
            );
        });
        
        test('should retrieve cached models', async () => {
            const systemId = 'cardiovascular';
            const cachedData = new ArrayBuffer(1024);
            
            // Mock cached data
            app.cacheManager.getModel = jest.fn().mockResolvedValue(cachedData);
            
            await app.loadAnatomicalSystem(systemId);
            
            // Verify cache was checked
            expect(app.cacheManager.getModel).toHaveBeenCalledWith(systemId);
        });
        
        test('should get cache statistics', async () => {
            const mockStats = {
                totalSize: 1024 * 1024,
                itemCount: 5,
                hitRate: 0.85
            };
            
            app.cacheManager.getStats = jest.fn().mockResolvedValue(mockStats);
            
            const stats = await app.getCacheStats();
            
            expect(stats).toEqual(mockStats);
        });
        
        test('should clear cache when requested', async () => {
            app.cacheManager.clearCache = jest.fn().mockResolvedValue(true);
            
            const result = await app.clearCache();
            
            expect(result).toBe(true);
            expect(app.cacheManager.clearCache).toHaveBeenCalled();
        });
    });

    describe('Complete User Journey', () => {
        test('should complete full user workflow', async () => {
            // Mock all API responses
            global.fetch.mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
            });
            
            // 1. Initialize application
            app = new AnatomicalApp({
                enablePerformanceMonitoring: true,
                enableOfflineMode: true
            });
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            expect(app.isInitialized).toBe(true);
            
            // 2. Load anatomical system
            await app.loadAnatomicalSystem('musculoskeletal');
            expect(app.currentSystem).toBe('musculoskeletal');
            
            // 3. Search for structure
            app.anatomyManager.searchStructures = jest.fn().mockResolvedValue([
                { name: 'femur', type: 'bone', system: 'musculoskeletal' }
            ]);
            
            await app.searchStructures('femur');
            expect(app.anatomyManager.searchStructures).toHaveBeenCalledWith('femur');
            
            // 4. Select structure
            const mockObject = {
                name: 'femur',
                userData: { structureType: 'bone', systemId: 'musculoskeletal' },
                material: { emissive: { setHex: jest.fn() } }
            };
            
            app.handleStructureSelection(mockObject, { point: { x: 0, y: 0, z: 0 } });
            expect(app.selectedStructure).toBe(mockObject);
            
            // 5. Manipulate structure
            await app.anatomyManager.isolateStructure('femur');
            expect(app.anatomyManager.isolateStructure).toHaveBeenCalledWith('femur');
            
            // 6. Change zoom level
            app.handleControlsChange({ distance: 2.0 });
            expect(app.zoomManager.updateDistance).toHaveBeenCalledWith(2.0);
            
            // 7. Load another system
            await app.loadAnatomicalSystem('cardiovascular');
            expect(app.currentSystem).toBe('cardiovascular');
            expect(app.loadedModels.size).toBe(2);
            
            // 8. Check final status
            const finalStatus = app.getStatus();
            expect(finalStatus.initialized).toBe(true);
            expect(finalStatus.loadedModels).toContain('musculoskeletal');
            expect(finalStatus.loadedModels).toContain('cardiovascular');
            expect(finalStatus.errorCount).toBe(0);
            
            console.log('✅ Complete user workflow test passed');
        });
    });
});