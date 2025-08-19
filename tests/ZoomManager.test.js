import { jest } from '@jest/globals';
import * as THREE from 'three';
import ZoomManager from '../src/ZoomManager.js';

// Mock Three.js components
jest.mock('three', () => ({
    ...jest.requireActual('three'),
    TextureLoader: jest.fn().mockImplementation(() => ({
        load: jest.fn()
    })),
    CanvasTexture: jest.fn().mockImplementation(() => ({
        minFilter: null,
        magFilter: null,
        needsUpdate: false
    }))
}));

describe('ZoomManager', () => {
    let zoomManager;
    let mockRenderer;
    let mockCamera;
    let mockScene;
    let mockCanvas;

    beforeEach(() => {
        // Create mock canvas
        mockCanvas = {
            getContext: jest.fn().mockReturnValue({
                clearRect: jest.fn(),
                fillText: jest.fn(),
                strokeText: jest.fn(),
                font: '',
                fillStyle: '',
                strokeStyle: '',
                lineWidth: 0,
                textAlign: '',
                textBaseline: ''
            }),
            width: 512,
            height: 128
        };

        // Mock document.createElement for canvas creation
        global.document = {
            createElement: jest.fn().mockImplementation((tagName) => {
                if (tagName === 'canvas') {
                    return mockCanvas;
                }
                return {};
            })
        };

        // Create mock camera
        mockCamera = {
            position: new THREE.Vector3(0, 0, 5),
            projectionMatrix: new THREE.Matrix4(),
            matrixWorldInverse: new THREE.Matrix4(),
            getWorldDirection: jest.fn().mockReturnValue(new THREE.Vector3(0, 0, -1))
        };

        // Create mock scene
        mockScene = {
            add: jest.fn(),
            remove: jest.fn(),
            traverse: jest.fn()
        };

        // Create mock renderer
        mockRenderer = {
            camera: mockCamera,
            scene: mockScene,
            getInteractionController: jest.fn().mockReturnValue({
                onControlsChange: jest.fn()
            })
        };

        // Initialize ZoomManager
        zoomManager = new ZoomManager(mockRenderer, mockCamera, mockScene, {
            enableLabels: true,
            enableOrientationIndicators: true,
            textureBasePath: '/test/textures/',
            transitionDuration: 100 // Shorter for tests
        });
    });

    afterEach(() => {
        if (zoomManager) {
            zoomManager.dispose();
        }
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with default options', () => {
            expect(zoomManager).toBeDefined();
            expect(zoomManager.options.enableLabels).toBe(true);
            expect(zoomManager.options.enableOrientationIndicators).toBe(true);
            expect(zoomManager.currentZoomLevel).toBe(0);
            expect(zoomManager.targetZoomLevel).toBe(0);
        });

        test('should create label system when enabled', () => {
            expect(mockScene.add).toHaveBeenCalled();
            expect(zoomManager.labelContainer).toBeDefined();
            expect(zoomManager.labelPool.length).toBeGreaterThan(0);
        });

        test('should create orientation indicators when enabled', () => {
            expect(zoomManager.orientationGroup).toBeDefined();
            expect(zoomManager.compassMesh).toBeDefined();
            expect(zoomManager.axisHelpers).toBeDefined();
        });

        test('should initialize with custom options', () => {
            const customOptions = {
                enableLabels: false,
                enableOrientationIndicators: false,
                transitionDuration: 500
            };

            const customZoomManager = new ZoomManager(mockRenderer, mockCamera, mockScene, customOptions);
            
            expect(customZoomManager.options.enableLabels).toBe(false);
            expect(customZoomManager.options.enableOrientationIndicators).toBe(false);
            expect(customZoomManager.options.transitionDuration).toBe(500);
            
            customZoomManager.dispose();
        });
    });

    describe('Zoom Level Calculation', () => {
        test('should calculate correct zoom level based on distance', () => {
            expect(zoomManager.calculateZoomLevel(60)).toBe(0); // Far
            expect(zoomManager.calculateZoomLevel(25)).toBe(1); // Medium
            expect(zoomManager.calculateZoomLevel(15)).toBe(2); // Close
            expect(zoomManager.calculateZoomLevel(3)).toBe(3);  // Ultra close
        });

        test('should handle edge cases for zoom level calculation', () => {
            expect(zoomManager.calculateZoomLevel(0)).toBe(3);   // Very close
            expect(zoomManager.calculateZoomLevel(1000)).toBe(0); // Very far
        });

        test('should return correct zoom level for exact threshold values', () => {
            expect(zoomManager.calculateZoomLevel(50)).toBe(1); // Exactly at threshold
            expect(zoomManager.calculateZoomLevel(20)).toBe(2); // Exactly at threshold
            expect(zoomManager.calculateZoomLevel(10)).toBe(3); // Exactly at threshold
            expect(zoomManager.calculateZoomLevel(5)).toBe(3);  // Exactly at threshold
        });
    });

    describe('Camera Change Handling', () => {
        test('should handle camera distance changes', () => {
            const spy = jest.spyOn(zoomManager, 'transitionToZoomLevel');
            
            zoomManager.handleCameraChange(15); // Should trigger zoom level 2
            
            expect(zoomManager.lastCameraDistance).toBe(15);
            expect(zoomManager.targetZoomLevel).toBe(2);
            expect(spy).toHaveBeenCalledWith(2);
        });

        test('should throttle camera change updates', () => {
            const spy = jest.spyOn(zoomManager, 'transitionToZoomLevel');
            
            // Rapid successive calls
            zoomManager.handleCameraChange(15);
            zoomManager.handleCameraChange(14);
            zoomManager.handleCameraChange(13);
            
            // Should only process the first call due to throttling
            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('should not transition if zoom level unchanged', () => {
            const spy = jest.spyOn(zoomManager, 'transitionToZoomLevel');
            
            zoomManager.handleCameraChange(60); // Level 0
            zoomManager.handleCameraChange(55); // Still level 0
            
            expect(spy).toHaveBeenCalledTimes(1); // Only first call
        });
    });

    describe('Texture Loading', () => {
        test('should load high resolution texture for structure', async () => {
            const mockStructure = {
                name: 'test_structure',
                traverse: jest.fn()
            };

            const mockTexture = { needsUpdate: false };
            zoomManager.textureLoader.load.mockImplementation((path, onLoad) => {
                onLoad(mockTexture);
            });

            const result = await zoomManager.loadHighResTexture(mockStructure, 'high');
            
            expect(result).toBe(mockTexture);
            expect(zoomManager.textureCache.has('test_structure_high')).toBe(true);
        });

        test('should use cached texture if available', async () => {
            const mockStructure = {
                name: 'test_structure',
                traverse: jest.fn()
            };

            const cachedTexture = { cached: true };
            zoomManager.textureCache.set('test_structure_high', cachedTexture);

            const spy = jest.spyOn(zoomManager, 'applyTextureToStructure');
            
            const result = await zoomManager.loadHighResTexture(mockStructure, 'high');
            
            expect(result).toBe(cachedTexture);
            expect(spy).toHaveBeenCalledWith(mockStructure, cachedTexture);
        });

        test('should handle texture loading failure with fallback', async () => {
            const mockStructure = {
                name: 'test_structure',
                traverse: jest.fn()
            };

            const fallbackTexture = { fallback: true };
            
            zoomManager.textureLoader.load
                .mockImplementationOnce((path, onLoad, onProgress, onError) => {
                    onError(new Error('Primary texture failed'));
                })
                .mockImplementationOnce((path, onLoad) => {
                    onLoad(fallbackTexture);
                });

            const result = await zoomManager.loadHighResTexture(mockStructure, 'high');
            
            expect(result).toBe(fallbackTexture);
        });

        test('should prevent duplicate texture loading', async () => {
            const mockStructure = {
                name: 'test_structure',
                traverse: jest.fn()
            };

            let resolveFirst;
            const firstPromise = new Promise(resolve => {
                resolveFirst = resolve;
            });

            zoomManager.textureLoader.load.mockImplementation((path, onLoad) => {
                firstPromise.then(() => onLoad({ test: true }));
            });

            // Start two loads simultaneously
            const promise1 = zoomManager.loadHighResTexture(mockStructure, 'high');
            const promise2 = zoomManager.loadHighResTexture(mockStructure, 'high');

            // Resolve the first load
            resolveFirst();

            const [result1, result2] = await Promise.all([promise1, promise2]);
            
            expect(result1).toEqual(result2);
            expect(zoomManager.textureLoader.load).toHaveBeenCalledTimes(1);
        });
    });

    describe('Label System', () => {
        test('should create label mesh with proper structure', () => {
            const label = zoomManager.createLabelMesh();
            
            expect(label).toBeInstanceOf(THREE.Group);
            expect(label.userData.canvas).toBeDefined();
            expect(label.userData.context).toBeDefined();
            expect(label.userData.texture).toBeDefined();
            expect(label.userData.background).toBeDefined();
            expect(label.userData.textMesh).toBeDefined();
        });

        test('should format structure names correctly', () => {
            expect(zoomManager.formatStructureName('camelCaseName')).toBe('Camel Case Name');
            expect(zoomManager.formatStructureName('snake_case_name')).toBe('Snake Case Name');
            expect(zoomManager.formatStructureName('UPPERCASE')).toBe('UPPERCASE');
            expect(zoomManager.formatStructureName('mixed_CaseExample')).toBe('Mixed Case Example');
        });

        test('should calculate label opacity based on distance', () => {
            expect(zoomManager.calculateLabelOpacity(10)).toBe(1.0); // Within fade start
            expect(zoomManager.calculateLabelOpacity(30)).toBe(0.0); // At max distance
            expect(zoomManager.calculateLabelOpacity(22.5)).toBe(0.5); // Halfway through fade
        });

        test('should get label from pool', () => {
            const label = zoomManager.getLabelFromPool();
            expect(label).toBeDefined();
            expect(label.userData.isActive).toBe(false);
        });

        test('should return null when no labels available in pool', () => {
            // Mark all labels as active
            zoomManager.labelPool.forEach(label => {
                label.userData.isActive = true;
            });

            const label = zoomManager.getLabelFromPool();
            expect(label).toBeNull();
        });

        test('should clear active labels', () => {
            // Add some active labels
            const mockLabel = { visible: true, userData: { isActive: true } };
            zoomManager.activeLabels.set('test1', mockLabel);
            zoomManager.activeLabels.set('test2', mockLabel);

            zoomManager.clearActiveLabels();

            expect(zoomManager.activeLabels.size).toBe(0);
            expect(mockLabel.visible).toBe(false);
            expect(mockLabel.userData.isActive).toBe(false);
        });
    });

    describe('Orientation Indicators', () => {
        test('should create compass with proper structure', () => {
            expect(zoomManager.compassMesh).toBeDefined();
            expect(zoomManager.compassMesh.children.length).toBeGreaterThan(0);
        });

        test('should create axis helpers', () => {
            expect(zoomManager.axisHelpers).toBeDefined();
            expect(zoomManager.axisHelpers.children.length).toBeGreaterThan(0);
        });

        test('should update orientation indicators', () => {
            const spy = jest.spyOn(zoomManager.axisHelpers, 'lookAt');
            
            zoomManager.updateOrientationIndicators();
            
            expect(spy).toHaveBeenCalledWith(mockCamera.position);
        });
    });

    describe('Transitions', () => {
        test('should perform smooth transition between zoom levels', async () => {
            const spy = jest.spyOn(zoomManager, 'updateTransitionState');
            
            await zoomManager.performSmoothTransition(0, 2);
            
            expect(spy).toHaveBeenCalled();
        });

        test('should apply easing functions correctly', () => {
            expect(zoomManager.applyEasing(0, 'easeInOutCubic')).toBe(0);
            expect(zoomManager.applyEasing(1, 'easeInOutCubic')).toBe(1);
            expect(zoomManager.applyEasing(0.5, 'easeInOutCubic')).toBe(0.5);
            
            expect(zoomManager.applyEasing(0.5, 'linear')).toBe(0.5);
            expect(zoomManager.applyEasing(0.5, 'easeOutQuad')).toBe(0.75);
            expect(zoomManager.applyEasing(0.5, 'easeInQuad')).toBe(0.25);
        });

        test('should notify transition complete callbacks', () => {
            const callback = jest.fn();
            zoomManager.onTransitionComplete(callback);
            
            zoomManager.notifyTransitionComplete(2);
            
            expect(callback).toHaveBeenCalledWith(2, zoomManager.options.zoomLevels[2]);
        });

        test('should handle transition callback errors gracefully', () => {
            const errorCallback = jest.fn().mockImplementation(() => {
                throw new Error('Callback error');
            });
            const goodCallback = jest.fn();
            
            zoomManager.onTransitionComplete(errorCallback);
            zoomManager.onTransitionComplete(goodCallback);
            
            // Should not throw and should call good callback
            expect(() => zoomManager.notifyTransitionComplete(1)).not.toThrow();
            expect(goodCallback).toHaveBeenCalled();
        });
    });

    describe('Public API', () => {
        test('should get current zoom info', () => {
            zoomManager.currentZoomLevel = 2;
            zoomManager.targetZoomLevel = 3;
            zoomManager.isTransitioning = true;
            zoomManager.lastCameraDistance = 15.5;

            const info = zoomManager.getCurrentZoomInfo();

            expect(info.level).toBe(2);
            expect(info.targetLevel).toBe(3);
            expect(info.isTransitioning).toBe(true);
            expect(info.distance).toBe(15.5);
            expect(info.config).toBe(zoomManager.options.zoomLevels[2]);
        });

        test('should set zoom level', () => {
            const spy = jest.spyOn(zoomManager, 'transitionToZoomLevel');
            
            zoomManager.setZoomLevel(2);
            
            expect(zoomManager.targetZoomLevel).toBe(2);
            expect(spy).toHaveBeenCalledWith(2);
        });

        test('should not set invalid zoom level', () => {
            const spy = jest.spyOn(zoomManager, 'transitionToZoomLevel');
            
            zoomManager.setZoomLevel(-1);
            zoomManager.setZoomLevel(10);
            
            expect(spy).not.toHaveBeenCalled();
        });

        test('should enable/disable labels', () => {
            zoomManager.setLabelsEnabled(false);
            expect(zoomManager.options.enableLabels).toBe(false);
            
            zoomManager.setLabelsEnabled(true);
            expect(zoomManager.options.enableLabels).toBe(true);
        });

        test('should enable/disable orientation indicators', () => {
            zoomManager.setOrientationIndicatorsEnabled(false);
            expect(zoomManager.options.enableOrientationIndicators).toBe(false);
            expect(zoomManager.orientationGroup.visible).toBe(false);
            
            zoomManager.setOrientationIndicatorsEnabled(true);
            expect(zoomManager.options.enableOrientationIndicators).toBe(true);
            expect(zoomManager.orientationGroup.visible).toBe(true);
        });

        test('should get texture cache stats', () => {
            zoomManager.textureCache.set('test1', {});
            zoomManager.loadingTextures.set('test2', Promise.resolve());
            zoomManager.activeLabels.set('label1', {});

            const stats = zoomManager.getTextureCacheStats();

            expect(stats.cachedTextures).toBe(1);
            expect(stats.loadingTextures).toBe(1);
            expect(stats.activeLabels).toBe(1);
            expect(stats.labelPoolSize).toBe(zoomManager.labelPool.length);
        });

        test('should clear texture cache', () => {
            const mockTexture = { dispose: jest.fn() };
            zoomManager.textureCache.set('test', mockTexture);

            zoomManager.clearTextureCache();

            expect(mockTexture.dispose).toHaveBeenCalled();
            expect(zoomManager.textureCache.size).toBe(0);
        });
    });

    describe('Cleanup and Disposal', () => {
        test('should dispose properly', () => {
            const mockTexture = { dispose: jest.fn() };
            zoomManager.textureCache.set('test', mockTexture);

            zoomManager.dispose();

            expect(mockTexture.dispose).toHaveBeenCalled();
            expect(mockScene.remove).toHaveBeenCalledWith(zoomManager.labelContainer);
            expect(mockScene.remove).toHaveBeenCalledWith(zoomManager.orientationGroup);
            expect(zoomManager.textureCache.size).toBe(0);
            expect(zoomManager.loadingTextures.size).toBe(0);
            expect(zoomManager.activeLabels.size).toBe(0);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle missing interaction controller gracefully', () => {
            mockRenderer.getInteractionController = jest.fn().mockReturnValue(null);
            
            const newZoomManager = new ZoomManager(mockRenderer, mockCamera, mockScene);
            
            expect(newZoomManager).toBeDefined();
            newZoomManager.dispose();
        });

        test('should handle scene traversal with no meshes', () => {
            mockScene.traverse.mockImplementation(callback => {
                // No meshes to traverse
            });

            const structures = zoomManager.getVisibleStructures();
            expect(structures).toEqual([]);
        });

        test('should handle texture loading with no structures', async () => {
            mockScene.traverse.mockImplementation(callback => {
                // No structures
            });

            await expect(zoomManager.loadTexturesForZoomLevel(2)).resolves.not.toThrow();
        });
    });
});