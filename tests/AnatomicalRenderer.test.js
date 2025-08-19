import AnatomicalRenderer from '../src/AnatomicalRenderer.js';
import ModelLoader from '../src/ModelLoader.js';
import * as THREE from 'three';

// Mock ModelLoader
jest.mock('../src/ModelLoader.js', () => {
    return jest.fn().mockImplementation(() => ({
        loadModel: jest.fn(),
        onProgress: jest.fn(),
        onError: jest.fn(),
        getCacheStats: jest.fn(() => ({
            cachedModels: 0,
            cacheSize: 0,
            maxCacheSize: 100 * 1024 * 1024,
            cacheUsage: 0
        })),
        clearCache: jest.fn(),
        dispose: jest.fn()
    }));
});

// Mock InteractionController
jest.mock('../src/InteractionController.js', () => {
    return jest.fn().mockImplementation(() => ({
        update: jest.fn(),
        addSelectableObjects: jest.fn(),
        removeSelectableObjects: jest.fn(),
        setZoomLimits: jest.fn(),
        setControlMode: jest.fn(),
        setAutoRotate: jest.fn(),
        onObjectSelect: jest.fn(),
        onObjectHover: jest.fn(),
        onObjectUnhover: jest.fn(),
        onControlsChange: jest.fn(),
        getSelectedObject: jest.fn(() => null),
        getHoveredObject: jest.fn(() => null),
        getControlInfo: jest.fn(() => ({
            isTouch: false,
            hasOrbitControls: true,
            hasRaycaster: true,
            selectableObjectsCount: 0,
            selectedObject: false,
            hoveredObject: false,
            cameraDistance: 5,
            zoomLimits: { min: 1, max: 50 }
        })),
        dispose: jest.fn()
    }));
});

// Mock Three.js components for testing
jest.mock('three', () => ({
    Scene: jest.fn(() => ({
        background: null,
        fog: null,
        add: jest.fn(),
        clear: jest.fn()
    })),
    PerspectiveCamera: jest.fn(() => ({
        aspect: 1,
        position: { set: jest.fn() },
        lookAt: jest.fn(),
        updateProjectionMatrix: jest.fn()
    })),
    WebGLRenderer: jest.fn(() => ({
        setSize: jest.fn(),
        setPixelRatio: jest.fn(),
        shadowMap: { enabled: false, type: null },
        outputColorSpace: null,
        toneMapping: null,
        toneMappingExposure: 1,
        render: jest.fn(),
        dispose: jest.fn(),
        info: {
            memory: { geometries: 0, textures: 0 },
            render: { calls: 0, triangles: 0, points: 0, lines: 0 }
        }
    })),
    AmbientLight: jest.fn(() => ({ position: { set: jest.fn() } })),
    DirectionalLight: jest.fn(() => ({
        position: { set: jest.fn() },
        castShadow: false,
        shadow: {
            mapSize: { width: 0, height: 0 },
            camera: { near: 0, far: 0, left: 0, right: 0, top: 0, bottom: 0 }
        }
    })),
    MeshStandardMaterial: jest.fn(() => ({})),
    Color: jest.fn(),
    Fog: jest.fn(),
    PCFSoftShadowMap: 'PCFSoftShadowMap',
    SRGBColorSpace: 'SRGBColorSpace',
    ACESFilmicToneMapping: 'ACESFilmicToneMapping',
    DoubleSide: 'DoubleSide',
    FrontSide: 'FrontSide'
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
    observe: jest.fn(),
    disconnect: jest.fn()
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock performance.now
global.performance = {
    now: jest.fn(() => Date.now())
};

describe('AnatomicalRenderer', () => {
    let mockCanvas;
    let renderer;

    beforeEach(() => {
        // Create mock canvas
        mockCanvas = {
            clientWidth: 800,
            clientHeight: 600,
            getContext: jest.fn(() => ({}))
        };

        // Clear all mocks
        jest.clearAllMocks();
    });

    afterEach(() => {
        if (renderer) {
            renderer.dispose();
            renderer = null;
        }
    });

    describe('Constructor and Initialization', () => {
        test('should initialize with default options', () => {
            renderer = new AnatomicalRenderer(mockCanvas);

            expect(renderer.canvas).toBe(mockCanvas);
            expect(renderer.options.antialias).toBe(true);
            expect(renderer.options.alpha).toBe(false);
            expect(renderer.options.powerPreference).toBe('high-performance');
            expect(renderer.isInitialized).toBe(true);
        });

        test('should initialize with custom options', () => {
            const customOptions = {
                antialias: false,
                alpha: true,
                powerPreference: 'low-power'
            };

            renderer = new AnatomicalRenderer(mockCanvas, customOptions);

            expect(renderer.options.antialias).toBe(false);
            expect(renderer.options.alpha).toBe(true);
            expect(renderer.options.powerPreference).toBe('low-power');
        });

        test('should throw error if initialization fails', () => {
            // Mock Three.js to throw an error
            THREE.Scene.mockImplementationOnce(() => {
                throw new Error('WebGL not supported');
            });

            expect(() => {
                new AnatomicalRenderer(mockCanvas);
            }).toThrow('WebGL not supported');
        });
    });

    describe('Scene Creation', () => {
        beforeEach(() => {
            renderer = new AnatomicalRenderer(mockCanvas);
        });

        test('should create scene with correct configuration', () => {
            expect(THREE.Scene).toHaveBeenCalled();
            expect(renderer.scene).toBeDefined();
            expect(THREE.Color).toHaveBeenCalledWith(0x1a1a2e);
            expect(THREE.Fog).toHaveBeenCalledWith(0x1a1a2e, 10, 100);
        });
    });

    describe('Camera Creation', () => {
        beforeEach(() => {
            renderer = new AnatomicalRenderer(mockCanvas);
        });

        test('should create camera with correct parameters', () => {
            const expectedAspect = mockCanvas.clientWidth / mockCanvas.clientHeight;
            
            expect(THREE.PerspectiveCamera).toHaveBeenCalledWith(75, expectedAspect, 0.1, 1000);
            expect(renderer.camera).toBeDefined();
            expect(renderer.camera.position.set).toHaveBeenCalledWith(0, 0, 5);
            expect(renderer.camera.lookAt).toHaveBeenCalledWith(0, 0, 0);
        });
    });

    describe('Renderer Creation', () => {
        beforeEach(() => {
            renderer = new AnatomicalRenderer(mockCanvas);
        });

        test('should create WebGL renderer with correct configuration', () => {
            expect(THREE.WebGLRenderer).toHaveBeenCalledWith({
                canvas: mockCanvas,
                antialias: true,
                alpha: false,
                powerPreference: 'high-performance'
            });

            expect(renderer.renderer.setSize).toHaveBeenCalledWith(800, 600);
            expect(renderer.renderer.setPixelRatio).toHaveBeenCalled();
        });
    });

    describe('Lighting Setup', () => {
        beforeEach(() => {
            renderer = new AnatomicalRenderer(mockCanvas);
        });

        test('should create ambient light', () => {
            expect(THREE.AmbientLight).toHaveBeenCalledWith(0x404040, 0.3);
            expect(renderer.lights).toHaveLength(4); // ambient + 3 directional lights
        });

        test('should create directional lights', () => {
            expect(THREE.DirectionalLight).toHaveBeenCalledTimes(3);
            expect(THREE.DirectionalLight).toHaveBeenCalledWith(0xffffff, 1.0);
            expect(THREE.DirectionalLight).toHaveBeenCalledWith(0x87ceeb, 0.4);
            expect(THREE.DirectionalLight).toHaveBeenCalledWith(0xffffff, 0.6);
        });
    });

    describe('Resize Handling', () => {
        beforeEach(() => {
            renderer = new AnatomicalRenderer(mockCanvas);
        });

        test('should setup ResizeObserver when available', () => {
            expect(global.ResizeObserver).toHaveBeenCalled();
            expect(renderer.resizeObserver.observe).toHaveBeenCalledWith(mockCanvas);
        });

        test('should handle resize correctly', () => {
            mockCanvas.clientWidth = 1024;
            mockCanvas.clientHeight = 768;

            renderer.handleResize();

            expect(renderer.camera.aspect).toBe(1024 / 768);
            expect(renderer.camera.updateProjectionMatrix).toHaveBeenCalled();
            expect(renderer.renderer.setSize).toHaveBeenCalledWith(1024, 768);
        });

        test('should handle resize when camera or renderer not available', () => {
            renderer.camera = null;
            renderer.renderer = null;

            expect(() => renderer.handleResize()).not.toThrow();
        });
    });

    describe('Render Loop', () => {
        beforeEach(() => {
            renderer = new AnatomicalRenderer(mockCanvas);
        });

        test('should start render loop', () => {
            expect(global.requestAnimationFrame).toHaveBeenCalled();
            expect(renderer.animationId).toBeDefined();
        });

        test('should render scene', () => {
            renderer.render();
            expect(renderer.renderer.render).toHaveBeenCalledWith(renderer.scene, renderer.camera);
        });

        test('should handle render when components not available', () => {
            renderer.renderer = null;
            expect(() => renderer.render()).not.toThrow();
        });
    });

    describe('PBR Material Creation', () => {
        beforeEach(() => {
            renderer = new AnatomicalRenderer(mockCanvas);
        });

        test('should create material with default options', () => {
            const material = renderer.createPBRMaterial();

            expect(THREE.MeshStandardMaterial).toHaveBeenCalledWith(
                expect.objectContaining({
                    color: 0xffffff,
                    metalness: 0.1,
                    roughness: 0.8,
                    transparent: false,
                    opacity: 1.0,
                    side: 'FrontSide'
                })
            );
        });

        test('should create material with custom options', () => {
            const options = {
                color: 0xff0000,
                metalness: 0.5,
                roughness: 0.3,
                transparent: true,
                opacity: 0.8,
                doubleSided: true
            };

            const material = renderer.createPBRMaterial(options);

            expect(THREE.MeshStandardMaterial).toHaveBeenCalledWith(
                expect.objectContaining({
                    color: 0xff0000,
                    metalness: 0.5,
                    roughness: 0.3,
                    transparent: true,
                    opacity: 0.8,
                    side: 'DoubleSide'
                })
            );
        });
    });

    describe('Performance Monitoring', () => {
        beforeEach(() => {
            renderer = new AnatomicalRenderer(mockCanvas);
        });

        test('should track FPS', () => {
            expect(renderer.getFPS()).toBe(60); // Initial FPS
        });

        test('should provide renderer info', () => {
            const info = renderer.getRendererInfo();

            expect(info).toEqual({
                geometries: 0,
                textures: 0,
                calls: 0,
                triangles: 0,
                points: 0,
                lines: 0
            });
        });

        test('should return null when renderer not available', () => {
            renderer.renderer = null;
            expect(renderer.getRendererInfo()).toBeNull();
        });
    });

    describe('Disposal', () => {
        beforeEach(() => {
            renderer = new AnatomicalRenderer(mockCanvas);
        });

        test('should dispose all resources correctly', () => {
            const animationId = renderer.animationId;
            
            renderer.dispose();

            expect(global.cancelAnimationFrame).toHaveBeenCalledWith(animationId);
            expect(renderer.resizeObserver.disconnect).toHaveBeenCalled();
            expect(renderer.renderer.dispose).toHaveBeenCalled();
            expect(renderer.scene.clear).toHaveBeenCalled();
            
            expect(renderer.animationId).toBeNull();
            expect(renderer.resizeObserver).toBeNull();
            expect(renderer.renderer).toBeNull();
            expect(renderer.scene).toBeNull();
            expect(renderer.camera).toBeNull();
            expect(renderer.lights).toEqual([]);
            expect(renderer.isInitialized).toBe(false);
        });

        test('should handle disposal when components already null', () => {
            renderer.animationId = null;
            renderer.resizeObserver = null;
            renderer.renderer = null;
            renderer.scene = null;

            expect(() => renderer.dispose()).not.toThrow();
        });
    });

    describe('Model Loader Setup', () => {
        beforeEach(() => {
            renderer = new AnatomicalRenderer(mockCanvas);
        });

        test('should initialize ModelLoader', () => {
            expect(ModelLoader).toHaveBeenCalledWith({
                basePath: '/assets/models/',
                dracoPath: '/assets/draco/',
                enableDraco: true,
                enableCache: true,
                maxCacheSize: 100 * 1024 * 1024,
                showProgress: true,
                retryAttempts: 3,
                retryDelay: 1000
            });
            expect(renderer.modelLoader).toBeDefined();
        });
    });

    describe('Model Loading', () => {
        let mockModel;

        beforeEach(() => {
            renderer = new AnatomicalRenderer(mockCanvas);
            mockModel = {
                userData: {},
                clone: jest.fn()
            };
            renderer.modelLoader.loadModel.mockResolvedValue(mockModel);
        });

        test('should load model successfully', async () => {
            const result = await renderer.loadModel('heart.glb', 'heart-model');

            expect(renderer.modelLoader.loadModel).toHaveBeenCalledWith('heart.glb', {});
            expect(renderer.scene.add).toHaveBeenCalledWith(mockModel);
            expect(renderer.loadedModels.get('heart-model')).toBe(mockModel);
            expect(result).toBe(mockModel);
        });

        test('should load model with options', async () => {
            const options = { scale: 2.0, position: { x: 1, y: 0, z: 0 } };
            
            await renderer.loadModel('heart.glb', 'heart-model', options);

            expect(renderer.modelLoader.loadModel).toHaveBeenCalledWith('heart.glb', options);
        });

        test('should handle loading errors', async () => {
            const error = new Error('Failed to load model');
            renderer.modelLoader.loadModel.mockRejectedValue(error);

            await expect(renderer.loadModel('invalid.glb', 'invalid-model')).rejects.toThrow('Failed to load model');
            expect(renderer.loadedModels.has('invalid-model')).toBe(false);
        });

        test('should throw error when ModelLoader not initialized', async () => {
            renderer.modelLoader = null;

            await expect(renderer.loadModel('heart.glb', 'heart-model')).rejects.toThrow('ModelLoader not initialized');
        });
    });

    describe('Model Management', () => {
        let mockModel;

        beforeEach(() => {
            renderer = new AnatomicalRenderer(mockCanvas);
            mockModel = {
                userData: {},
                clone: jest.fn()
            };
            renderer.loadedModels.set('test-model', mockModel);
        });

        test('should remove model from scene', () => {
            renderer.removeModel('test-model');

            expect(renderer.scene.remove).toHaveBeenCalledWith(mockModel);
            expect(renderer.loadedModels.has('test-model')).toBe(false);
        });

        test('should handle removing non-existent model', () => {
            expect(() => renderer.removeModel('non-existent')).not.toThrow();
            expect(renderer.scene.remove).not.toHaveBeenCalled();
        });

        test('should get model by ID', () => {
            const result = renderer.getModel('test-model');
            expect(result).toBe(mockModel);
        });

        test('should return null for non-existent model', () => {
            const result = renderer.getModel('non-existent');
            expect(result).toBeNull();
        });

        test('should get all loaded model IDs', () => {
            renderer.loadedModels.set('model1', mockModel);
            renderer.loadedModels.set('model2', mockModel);

            const ids = renderer.getLoadedModelIds();
            expect(ids).toContain('test-model');
            expect(ids).toContain('model1');
            expect(ids).toContain('model2');
            expect(ids).toHaveLength(3);
        });
    });

    describe('Model Loading Callbacks', () => {
        beforeEach(() => {
            renderer = new AnatomicalRenderer(mockCanvas);
        });

        test('should add progress callback', () => {
            const callback = jest.fn();
            renderer.onModelLoadProgress('heart.glb', callback);

            expect(renderer.modelLoader.onProgress).toHaveBeenCalledWith('heart.glb', callback);
        });

        test('should add error callback', () => {
            const callback = jest.fn();
            renderer.onModelLoadError('heart.glb', callback);

            expect(renderer.modelLoader.onError).toHaveBeenCalledWith('heart.glb', callback);
        });

        test('should handle callbacks when ModelLoader not available', () => {
            renderer.modelLoader = null;

            expect(() => renderer.onModelLoadProgress('heart.glb', jest.fn())).not.toThrow();
            expect(() => renderer.onModelLoadError('heart.glb', jest.fn())).not.toThrow();
        });
    });

    describe('Model Cache Management', () => {
        beforeEach(() => {
            renderer = new AnatomicalRenderer(mockCanvas);
        });

        test('should get cache statistics', () => {
            const stats = renderer.getModelCacheStats();

            expect(renderer.modelLoader.getCacheStats).toHaveBeenCalled();
            expect(stats).toEqual({
                cachedModels: 0,
                cacheSize: 0,
                maxCacheSize: 100 * 1024 * 1024,
                cacheUsage: 0
            });
        });

        test('should return null when ModelLoader not available', () => {
            renderer.modelLoader = null;
            const stats = renderer.getModelCacheStats();
            expect(stats).toBeNull();
        });

        test('should clear model cache', () => {
            renderer.clearModelCache();
            expect(renderer.modelLoader.clearCache).toHaveBeenCalled();
        });

        test('should handle cache clear when ModelLoader not available', () => {
            renderer.modelLoader = null;
            expect(() => renderer.clearModelCache()).not.toThrow();
        });
    });

    describe('Enhanced Disposal', () => {
        beforeEach(() => {
            renderer = new AnatomicalRenderer(mockCanvas);
        });

        test('should dispose ModelLoader and clear loaded models', () => {
            const mockModel = { userData: {} };
            renderer.loadedModels.set('test-model', mockModel);
            
            renderer.dispose();

            expect(renderer.modelLoader.dispose).toHaveBeenCalled();
            expect(renderer.modelLoader).toBeNull();
            expect(renderer.loadedModels.size).toBe(0);
        });

        test('should handle disposal when ModelLoader already null', () => {
            renderer.modelLoader = null;
            expect(() => renderer.dispose()).not.toThrow();
        });
    });

    describe('InteractionController Integration', () => {
        beforeEach(() => {
            renderer = new AnatomicalRenderer(mockCanvas);
        });

        test('should initialize InteractionController with correct options', () => {
            expect(renderer.interactionController).toBeDefined();
        });

        test('should disable InteractionController when enableInteractions is false', () => {
            renderer.dispose();
            renderer = new AnatomicalRenderer(mockCanvas, { enableInteractions: false });
            
            expect(renderer.interactionController).toBeNull();
        });

        test('should delegate selectable objects management', () => {
            const mockObject = { userData: {} };
            
            renderer.addSelectableObjects(mockObject);
            expect(renderer.interactionController.addSelectableObjects).toHaveBeenCalledWith(mockObject);
            
            renderer.removeSelectableObjects(mockObject);
            expect(renderer.interactionController.removeSelectableObjects).toHaveBeenCalledWith(mockObject);
        });

        test('should delegate zoom limits configuration', () => {
            renderer.setZoomLimits(2, 30);
            expect(renderer.interactionController.setZoomLimits).toHaveBeenCalledWith(2, 30);
        });

        test('should delegate control mode setting', () => {
            renderer.setControlMode('mobile');
            expect(renderer.interactionController.setControlMode).toHaveBeenCalledWith('mobile');
        });

        test('should delegate auto rotation setting', () => {
            renderer.setAutoRotate(true, 3.0);
            expect(renderer.interactionController.setAutoRotate).toHaveBeenCalledWith(true, 3.0);
        });

        test('should delegate event callbacks', () => {
            const selectCallback = jest.fn();
            const hoverCallback = jest.fn();
            const unhoverCallback = jest.fn();
            const changeCallback = jest.fn();
            
            renderer.onObjectSelect(selectCallback);
            renderer.onObjectHover(hoverCallback);
            renderer.onObjectUnhover(unhoverCallback);
            renderer.onControlsChange(changeCallback);
            
            expect(renderer.interactionController.onObjectSelect).toHaveBeenCalledWith(selectCallback);
            expect(renderer.interactionController.onObjectHover).toHaveBeenCalledWith(hoverCallback);
            expect(renderer.interactionController.onObjectUnhover).toHaveBeenCalledWith(unhoverCallback);
            expect(renderer.interactionController.onControlsChange).toHaveBeenCalledWith(changeCallback);
        });

        test('should get selected and hovered objects', () => {
            expect(renderer.getSelectedObject()).toBeNull();
            expect(renderer.getHoveredObject()).toBeNull();
            
            expect(renderer.interactionController.getSelectedObject).toHaveBeenCalled();
            expect(renderer.interactionController.getHoveredObject).toHaveBeenCalled();
        });

        test('should get control information', () => {
            const controlInfo = renderer.getControlInfo();
            
            expect(controlInfo).toEqual({
                isTouch: false,
                hasOrbitControls: true,
                hasRaycaster: true,
                selectableObjectsCount: 0,
                selectedObject: false,
                hoveredObject: false,
                cameraDistance: 5,
                zoomLimits: { min: 1, max: 50 }
            });
            expect(renderer.interactionController.getControlInfo).toHaveBeenCalled();
        });

        test('should update interaction controller in render loop', () => {
            renderer.render();
            expect(renderer.interactionController.update).toHaveBeenCalled();
        });

        test('should handle methods when InteractionController not available', () => {
            renderer.interactionController = null;
            
            expect(() => renderer.addSelectableObjects({})).not.toThrow();
            expect(() => renderer.removeSelectableObjects({})).not.toThrow();
            expect(() => renderer.setZoomLimits(1, 10)).not.toThrow();
            expect(() => renderer.setControlMode('desktop')).not.toThrow();
            expect(() => renderer.setAutoRotate(true)).not.toThrow();
            expect(() => renderer.onObjectSelect(jest.fn())).not.toThrow();
            expect(() => renderer.onObjectHover(jest.fn())).not.toThrow();
            expect(() => renderer.onObjectUnhover(jest.fn())).not.toThrow();
            expect(() => renderer.onControlsChange(jest.fn())).not.toThrow();
            
            expect(renderer.getSelectedObject()).toBeNull();
            expect(renderer.getHoveredObject()).toBeNull();
            expect(renderer.getControlInfo()).toBeNull();
        });

        test('should dispose InteractionController on cleanup', () => {
            renderer.dispose();
            expect(renderer.interactionController.dispose).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        test('should handle initialization errors gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            THREE.Scene.mockImplementationOnce(() => {
                throw new Error('Initialization failed');
            });

            expect(() => {
                new AnatomicalRenderer(mockCanvas);
            }).toThrow('Initialization failed');

            expect(consoleSpy).toHaveBeenCalledWith(
                'Failed to initialize AnatomicalRenderer:',
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Structure Manipulation', () => {
        let mockModel, mockStructure, mockChildStructure;

        beforeEach(() => {
            renderer = new AnatomicalRenderer(mockCanvas);
            
            // Create mock structures
            mockChildStructure = {
                uuid: 'child-uuid',
                name: 'child-structure',
                isMesh: true,
                visible: true,
                material: { clone: jest.fn(() => ({ type: 'MeshStandardMaterial' })) },
                userData: {},
                traverse: jest.fn(callback => callback(mockChildStructure))
            };

            mockStructure = {
                uuid: 'structure-uuid',
                name: 'test-structure',
                isMesh: true,
                visible: true,
                material: { clone: jest.fn(() => ({ type: 'MeshStandardMaterial' })) },
                userData: {},
                traverse: jest.fn(callback => {
                    callback(mockStructure);
                    callback(mockChildStructure);
                }),
                isAncestorOf: jest.fn(() => false)
            };

            mockModel = {
                uuid: 'model-uuid',
                getObjectByName: jest.fn(name => name === 'test-structure' ? mockStructure : null),
                traverse: jest.fn(callback => {
                    callback(mockModel);
                    callback(mockStructure);
                    callback(mockChildStructure);
                })
            };

            renderer.loadedModels.set('test-model', mockModel);
        });

        describe('findStructure', () => {
            test('should find structure by ID', () => {
                const result = renderer.findStructure('test-structure');
                expect(result).toBe(mockStructure);
                expect(mockModel.getObjectByName).toHaveBeenCalledWith('test-structure');
            });

            test('should return null for non-existent structure', () => {
                const result = renderer.findStructure('non-existent');
                expect(result).toBeNull();
            });

            test('should search across multiple models', () => {
                const mockModel2 = {
                    getObjectByName: jest.fn(name => name === 'other-structure' ? mockStructure : null)
                };
                renderer.loadedModels.set('test-model-2', mockModel2);

                const result = renderer.findStructure('other-structure');
                expect(result).toBe(mockStructure);
                expect(mockModel2.getObjectByName).toHaveBeenCalledWith('other-structure');
            });
        });

        describe('storeOriginalMaterial', () => {
            test('should store original material for structure', () => {
                renderer.storeOriginalMaterial(mockStructure);

                expect(mockStructure.material.clone).toHaveBeenCalled();
                expect(renderer.originalMaterials.has(mockStructure.uuid)).toBe(true);
            });

            test('should store materials for children', () => {
                renderer.storeOriginalMaterial(mockStructure);

                expect(mockChildStructure.material.clone).toHaveBeenCalled();
                expect(renderer.originalMaterials.has(mockChildStructure.uuid)).toBe(true);
            });

            test('should not overwrite existing stored materials', () => {
                const existingMaterial = { type: 'ExistingMaterial' };
                renderer.originalMaterials.set(mockStructure.uuid, existingMaterial);

                renderer.storeOriginalMaterial(mockStructure);

                expect(renderer.originalMaterials.get(mockStructure.uuid)).toBe(existingMaterial);
            });
        });

        describe('restoreOriginalMaterial', () => {
            test('should restore original material', () => {
                const originalMaterial = { type: 'OriginalMaterial' };
                renderer.originalMaterials.set(mockStructure.uuid, originalMaterial);

                renderer.restoreOriginalMaterial(mockStructure);

                expect(mockStructure.material).toBe(originalMaterial);
            });

            test('should restore materials for children', () => {
                const originalChildMaterial = { type: 'OriginalChildMaterial' };
                renderer.originalMaterials.set(mockChildStructure.uuid, originalChildMaterial);

                renderer.restoreOriginalMaterial(mockStructure);

                expect(mockChildStructure.material).toBe(originalChildMaterial);
            });
        });

        describe('isolateStructure', () => {
            test('should isolate structure successfully', () => {
                const result = renderer.isolateStructure('test-structure');

                expect(result).toBe(true);
                expect(renderer.isolatedStructures.has('test-structure')).toBe(true);
                expect(mockStructure.visible).toBe(true);
            });

            test('should hide other structures when isolating', () => {
                const otherStructure = {
                    isMesh: true,
                    visible: true,
                    userData: {}
                };
                mockModel.traverse.mockImplementation(callback => {
                    callback(mockModel);
                    callback(mockStructure);
                    callback(otherStructure);
                });

                renderer.isolateStructure('test-structure');

                expect(otherStructure.visible).toBe(false);
                expect(otherStructure.userData.originalVisible).toBe(true);
            });

            test('should return false for non-existent structure', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
                
                const result = renderer.isolateStructure('non-existent');

                expect(result).toBe(false);
                expect(consoleSpy).toHaveBeenCalledWith("Structure with ID 'non-existent' not found");
                
                consoleSpy.mockRestore();
            });

            test('should clear previous isolation before new isolation', () => {
                renderer.isolatedStructures.add('previous-structure');
                
                const result = renderer.isolateStructure('test-structure');

                expect(result).toBe(true);
                expect(renderer.isolatedStructures.has('previous-structure')).toBe(false);
                expect(renderer.isolatedStructures.has('test-structure')).toBe(true);
            });
        });

        describe('clearIsolation', () => {
            test('should restore visibility of all structures', () => {
                const otherStructure = {
                    isMesh: true,
                    visible: false,
                    userData: { originalVisible: true }
                };
                mockModel.traverse.mockImplementation(callback => {
                    callback(mockModel);
                    callback(mockStructure);
                    callback(otherStructure);
                });

                renderer.isolatedStructures.add('test-structure');
                renderer.clearIsolation();

                expect(otherStructure.visible).toBe(true);
                expect(otherStructure.userData.originalVisible).toBeUndefined();
                expect(renderer.isolatedStructures.size).toBe(0);
            });

            test('should do nothing if no structures are isolated', () => {
                expect(() => renderer.clearIsolation()).not.toThrow();
                expect(renderer.isolatedStructures.size).toBe(0);
            });
        });

        describe('highlightStructure', () => {
            beforeEach(() => {
                // Mock THREE.Color
                THREE.Color.mockImplementation((color) => ({
                    clone: jest.fn(() => ({
                        multiplyScalar: jest.fn(() => ({ r: 1, g: 0, b: 0 }))
                    })),
                    r: 1, g: 0, b: 0
                }));
            });

            test('should highlight structure successfully', () => {
                const result = renderer.highlightStructure('test-structure', 0xff0000, 0.8);

                expect(result).toBe(true);
                expect(renderer.highlightedStructures.has('test-structure')).toBe(true);
                expect(renderer.highlightedStructures.get('test-structure')).toEqual({
                    color: 0xff0000,
                    intensity: 0.8
                });
            });

            test('should use default color and intensity', () => {
                const result = renderer.highlightStructure('test-structure');

                expect(result).toBe(true);
                expect(renderer.highlightedStructures.get('test-structure')).toEqual({
                    color: 0xff6b6b,
                    intensity: 0.8
                });
            });

            test('should store original materials before highlighting', () => {
                renderer.highlightStructure('test-structure');

                expect(renderer.originalMaterials.has(mockStructure.uuid)).toBe(true);
                expect(renderer.originalMaterials.has(mockChildStructure.uuid)).toBe(true);
            });

            test('should return false for non-existent structure', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
                
                const result = renderer.highlightStructure('non-existent');

                expect(result).toBe(false);
                expect(consoleSpy).toHaveBeenCalledWith("Structure with ID 'non-existent' not found");
                
                consoleSpy.mockRestore();
            });
        });

        describe('unhighlightStructure', () => {
            test('should remove highlight successfully', () => {
                renderer.highlightedStructures.set('test-structure', { color: 0xff0000, intensity: 0.8 });
                
                const result = renderer.unhighlightStructure('test-structure');

                expect(result).toBe(true);
                expect(renderer.highlightedStructures.has('test-structure')).toBe(false);
            });

            test('should return false for non-existent structure', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
                
                const result = renderer.unhighlightStructure('non-existent');

                expect(result).toBe(false);
                expect(consoleSpy).toHaveBeenCalledWith("Structure with ID 'non-existent' not found");
                
                consoleSpy.mockRestore();
            });
        });

        describe('clearAllHighlights', () => {
            test('should clear all highlights', () => {
                renderer.highlightedStructures.set('structure1', { color: 0xff0000, intensity: 0.8 });
                renderer.highlightedStructures.set('structure2', { color: 0x00ff00, intensity: 0.6 });

                // Mock findStructure to return structures for clearing
                jest.spyOn(renderer, 'findStructure').mockImplementation(id => {
                    if (id === 'structure1' || id === 'structure2') {
                        return mockStructure;
                    }
                    return null;
                });

                renderer.clearAllHighlights();

                expect(renderer.highlightedStructures.size).toBe(0);
            });
        });

        describe('hideStructure', () => {
            test('should hide structure successfully', () => {
                const result = renderer.hideStructure('test-structure');

                expect(result).toBe(true);
                expect(mockStructure.visible).toBe(false);
                expect(mockStructure.userData.originalVisible).toBe(true);
                expect(renderer.hiddenStructures.has('test-structure')).toBe(true);
            });

            test('should return false for non-existent structure', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
                
                const result = renderer.hideStructure('non-existent');

                expect(result).toBe(false);
                expect(consoleSpy).toHaveBeenCalledWith("Structure with ID 'non-existent' not found");
                
                consoleSpy.mockRestore();
            });
        });

        describe('showStructure', () => {
            test('should show hidden structure successfully', () => {
                mockStructure.visible = false;
                mockStructure.userData.originalVisible = true;
                renderer.hiddenStructures.add('test-structure');

                const result = renderer.showStructure('test-structure');

                expect(result).toBe(true);
                expect(mockStructure.visible).toBe(true);
                expect(mockStructure.userData.originalVisible).toBeUndefined();
                expect(renderer.hiddenStructures.has('test-structure')).toBe(false);
            });

            test('should default to visible when no original state stored', () => {
                mockStructure.visible = false;
                
                const result = renderer.showStructure('test-structure');

                expect(result).toBe(true);
                expect(mockStructure.visible).toBe(true);
            });

            test('should return false for non-existent structure', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
                
                const result = renderer.showStructure('non-existent');

                expect(result).toBe(false);
                expect(consoleSpy).toHaveBeenCalledWith("Structure with ID 'non-existent' not found");
                
                consoleSpy.mockRestore();
            });
        });

        describe('toggleStructureVisibility', () => {
            test('should hide visible structure', () => {
                const result = renderer.toggleStructureVisibility('test-structure');

                expect(result).toBe(true);
                expect(mockStructure.visible).toBe(false);
                expect(renderer.hiddenStructures.has('test-structure')).toBe(true);
            });

            test('should show hidden structure', () => {
                renderer.hiddenStructures.add('test-structure');
                mockStructure.visible = false;
                mockStructure.userData.originalVisible = true;

                const result = renderer.toggleStructureVisibility('test-structure');

                expect(result).toBe(true);
                expect(mockStructure.visible).toBe(true);
                expect(renderer.hiddenStructures.has('test-structure')).toBe(false);
            });
        });

        describe('setLayerVisibility', () => {
            test('should set layer visibility by layer name', () => {
                mockStructure.userData.layer = 'muscles';
                mockChildStructure.userData.layer = 'muscles';

                renderer.setLayerVisibility('muscles', false);

                expect(mockStructure.visible).toBe(false);
                expect(mockChildStructure.visible).toBe(false);
                expect(renderer.layerVisibility.get('muscles')).toEqual({ visible: false, depth: null });
            });

            test('should set layer visibility by system name', () => {
                mockStructure.userData.system = 'cardiovascular';

                renderer.setLayerVisibility('cardiovascular', true);

                expect(mockStructure.visible).toBe(true);
                expect(renderer.layerVisibility.get('cardiovascular')).toEqual({ visible: true, depth: null });
            });

            test('should set layer visibility by depth', () => {
                mockStructure.userData.depth = 2;

                renderer.setLayerVisibility('deep-layer', false, 2);

                expect(mockStructure.visible).toBe(false);
                expect(renderer.layerVisibility.get('deep-layer')).toEqual({ visible: false, depth: 2 });
            });

            test('should match layer by name in object name', () => {
                mockStructure.name = 'heart_muscle_tissue';

                renderer.setLayerVisibility('muscle', true);

                expect(mockStructure.visible).toBe(true);
            });
        });

        describe('getLayerVisibility', () => {
            test('should return layer visibility state', () => {
                renderer.layerVisibility.set('muscles', { visible: false, depth: 1 });

                const result = renderer.getLayerVisibility('muscles');

                expect(result).toEqual({ visible: false, depth: 1 });
            });

            test('should return null for non-existent layer', () => {
                const result = renderer.getLayerVisibility('non-existent');

                expect(result).toBeNull();
            });
        });

        describe('setDissectionDepth', () => {
            test('should set dissection depth with structure arrays', () => {
                const layers = [
                    { structures: ['skin'] },
                    { structures: ['muscle'] },
                    { structures: ['bone'] }
                ];

                jest.spyOn(renderer, 'showStructure').mockReturnValue(true);
                jest.spyOn(renderer, 'hideStructure').mockReturnValue(true);

                renderer.setDissectionDepth(layers, 1);

                expect(renderer.showStructure).toHaveBeenCalledWith('skin');
                expect(renderer.showStructure).toHaveBeenCalledWith('muscle');
                expect(renderer.hideStructure).toHaveBeenCalledWith('bone');
            });

            test('should set dissection depth with layer names', () => {
                const layers = [
                    { name: 'skin', depth: 0 },
                    { name: 'muscles', depth: 1 },
                    { name: 'skeleton', depth: 2 }
                ];

                jest.spyOn(renderer, 'setLayerVisibility').mockImplementation();

                renderer.setDissectionDepth(layers, 1);

                expect(renderer.setLayerVisibility).toHaveBeenCalledWith('skin', true, 0);
                expect(renderer.setLayerVisibility).toHaveBeenCalledWith('muscles', true, 1);
                expect(renderer.setLayerVisibility).toHaveBeenCalledWith('skeleton', false, 2);
            });

            test('should handle invalid layers parameter', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

                renderer.setDissectionDepth('invalid', 1);

                expect(consoleSpy).toHaveBeenCalledWith('Layers must be an array');
                consoleSpy.mockRestore();
            });
        });

        describe('createStructureGroup', () => {
            test('should create structure group successfully', () => {
                renderer.createStructureGroup('heart-group', ['test-structure', 'non-existent']);

                expect(renderer.structureGroups.get('heart-group')).toEqual(['test-structure']);
            });

            test('should handle invalid structure IDs parameter', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

                renderer.createStructureGroup('invalid-group', 'invalid');

                expect(consoleSpy).toHaveBeenCalledWith('Structure IDs must be an array');
                consoleSpy.mockRestore();
            });
        });

        describe('applyToGroup', () => {
            beforeEach(() => {
                renderer.structureGroups.set('test-group', ['test-structure']);
                jest.spyOn(renderer, 'hideStructure').mockReturnValue(true);
                jest.spyOn(renderer, 'showStructure').mockReturnValue(true);
                jest.spyOn(renderer, 'highlightStructure').mockReturnValue(true);
                jest.spyOn(renderer, 'isolateStructure').mockReturnValue(true);
                jest.spyOn(renderer, 'unhighlightStructure').mockReturnValue(true);
            });

            test('should apply hide operation to group', () => {
                renderer.applyToGroup('test-group', 'hide');

                expect(renderer.hideStructure).toHaveBeenCalledWith('test-structure');
            });

            test('should apply show operation to group', () => {
                renderer.applyToGroup('test-group', 'show');

                expect(renderer.showStructure).toHaveBeenCalledWith('test-structure');
            });

            test('should apply highlight operation to group with parameters', () => {
                renderer.applyToGroup('test-group', 'highlight', 0xff0000, 0.9);

                expect(renderer.highlightStructure).toHaveBeenCalledWith('test-structure', 0xff0000, 0.9);
            });

            test('should apply isolate operation to group', () => {
                renderer.applyToGroup('test-group', 'isolate');

                expect(renderer.isolateStructure).toHaveBeenCalledWith('test-structure');
            });

            test('should apply unhighlight operation to group', () => {
                renderer.applyToGroup('test-group', 'unhighlight');

                expect(renderer.unhighlightStructure).toHaveBeenCalledWith('test-structure');
            });

            test('should handle unknown operation', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

                renderer.applyToGroup('test-group', 'unknown');

                expect(consoleSpy).toHaveBeenCalledWith('Unknown operation: unknown');
                consoleSpy.mockRestore();
            });

            test('should handle non-existent group', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

                renderer.applyToGroup('non-existent', 'hide');

                expect(consoleSpy).toHaveBeenCalledWith("Structure group 'non-existent' not found");
                consoleSpy.mockRestore();
            });
        });

        describe('getManipulationState', () => {
            test('should return current manipulation state', () => {
                renderer.hiddenStructures.add('hidden1');
                renderer.highlightedStructures.set('highlighted1', { color: 0xff0000, intensity: 0.8 });
                renderer.isolatedStructures.add('isolated1');
                renderer.layerVisibility.set('layer1', { visible: false, depth: 1 });
                renderer.structureGroups.set('group1', ['structure1']);
                renderer.originalMaterials.set('uuid1', {});

                const state = renderer.getManipulationState();

                expect(state).toEqual({
                    hiddenStructures: ['hidden1'],
                    highlightedStructures: { highlighted1: { color: 0xff0000, intensity: 0.8 } },
                    isolatedStructures: ['isolated1'],
                    layerVisibility: { layer1: { visible: false, depth: 1 } },
                    structureGroups: { group1: ['structure1'] },
                    originalMaterialsCount: 1
                });
            });
        });

        describe('resetAllManipulations', () => {
            test('should reset all manipulations', () => {
                // Setup some manipulations
                renderer.hiddenStructures.add('hidden1');
                renderer.highlightedStructures.set('highlighted1', { color: 0xff0000, intensity: 0.8 });
                renderer.isolatedStructures.add('isolated1');
                renderer.layerVisibility.set('layer1', { visible: false, depth: 1 });
                renderer.structureGroups.set('group1', ['structure1']);
                renderer.originalMaterials.set('uuid1', {});

                // Mock the methods that will be called
                jest.spyOn(renderer, 'clearIsolation').mockImplementation();
                jest.spyOn(renderer, 'clearAllHighlights').mockImplementation();
                jest.spyOn(renderer, 'showStructure').mockReturnValue(true);
                jest.spyOn(renderer, 'setLayerVisibility').mockImplementation();

                renderer.resetAllManipulations();

                expect(renderer.clearIsolation).toHaveBeenCalled();
                expect(renderer.clearAllHighlights).toHaveBeenCalled();
                expect(renderer.showStructure).toHaveBeenCalledWith('hidden1');
                expect(renderer.setLayerVisibility).toHaveBeenCalledWith('layer1', true);
                
                expect(renderer.hiddenStructures.size).toBe(0);
                expect(renderer.layerVisibility.size).toBe(0);
                expect(renderer.structureGroups.size).toBe(0);
                expect(renderer.originalMaterials.size).toBe(0);
            });
        });
    });
});