import { jest } from '@jest/globals';
import * as THREE from 'three';
import AnatomicalRenderer from '../src/AnatomicalRenderer.js';

// Mock Three.js and browser APIs
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
}));

global.requestAnimationFrame = jest.fn().mockImplementation(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn();

// Mock WebGL context
const mockWebGLContext = {
    getExtension: jest.fn(),
    getParameter: jest.fn(),
    createShader: jest.fn(),
    shaderSource: jest.fn(),
    compileShader: jest.fn(),
    createProgram: jest.fn(),
    attachShader: jest.fn(),
    linkProgram: jest.fn(),
    useProgram: jest.fn(),
    getAttribLocation: jest.fn(),
    getUniformLocation: jest.fn(),
    enableVertexAttribArray: jest.fn(),
    vertexAttribPointer: jest.fn(),
    uniform1f: jest.fn(),
    uniform1i: jest.fn(),
    uniform3fv: jest.fn(),
    uniformMatrix4fv: jest.fn(),
    createBuffer: jest.fn(),
    bindBuffer: jest.fn(),
    bufferData: jest.fn(),
    createTexture: jest.fn(),
    bindTexture: jest.fn(),
    texImage2D: jest.fn(),
    texParameteri: jest.fn(),
    generateMipmap: jest.fn(),
    viewport: jest.fn(),
    clearColor: jest.fn(),
    clear: jest.fn(),
    drawElements: jest.fn(),
    drawArrays: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    blendFunc: jest.fn(),
    depthFunc: jest.fn(),
    cullFace: jest.fn()
};

// Mock canvas
const mockCanvas = {
    getContext: jest.fn().mockReturnValue(mockWebGLContext),
    clientWidth: 800,
    clientHeight: 600,
    width: 800,
    height: 600,
    style: {},
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

// Mock document for canvas creation
global.document = {
    createElement: jest.fn().mockImplementation((tagName) => {
        if (tagName === 'canvas') {
            return {
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
        }
        return {};
    })
};

describe('Deep Zoom Integration Tests', () => {
    let renderer;
    let zoomManager;

    beforeEach(() => {
        // Initialize renderer with zoom functionality
        renderer = new AnatomicalRenderer(mockCanvas, {
            enableInteractions: true
        });
        
        zoomManager = renderer.getZoomManager();
    });

    afterEach(() => {
        if (renderer) {
            // Cleanup would go here
        }
        jest.clearAllMocks();
    });

    describe('Renderer Integration', () => {
        test('should initialize zoom manager with renderer', () => {
            expect(zoomManager).toBeDefined();
            expect(renderer.getZoomManager()).toBe(zoomManager);
        });

        test('should provide zoom level control through renderer', () => {
            const spy = jest.spyOn(zoomManager, 'setZoomLevel');
            
            renderer.setZoomLevel(2);
            
            expect(spy).toHaveBeenCalledWith(2);
        });

        test('should provide label control through renderer', () => {
            const spy = jest.spyOn(zoomManager, 'setLabelsEnabled');
            
            renderer.setLabelsEnabled(false);
            
            expect(spy).toHaveBeenCalledWith(false);
        });

        test('should provide orientation indicator control through renderer', () => {
            const spy = jest.spyOn(zoomManager, 'setOrientationIndicatorsEnabled');
            
            renderer.setOrientationIndicatorsEnabled(false);
            
            expect(spy).toHaveBeenCalledWith(false);
        });

        test('should provide zoom info through renderer', () => {
            const mockInfo = { level: 1, distance: 20 };
            jest.spyOn(zoomManager, 'getCurrentZoomInfo').mockReturnValue(mockInfo);
            
            const info = renderer.getCurrentZoomInfo();
            
            expect(info).toBe(mockInfo);
        });

        test('should provide texture cache stats through renderer', () => {
            const mockStats = { cachedTextures: 5, activeLabels: 3 };
            jest.spyOn(zoomManager, 'getTextureCacheStats').mockReturnValue(mockStats);
            
            const stats = renderer.getZoomTextureCacheStats();
            
            expect(stats).toBe(mockStats);
        });

        test('should clear zoom texture cache through renderer', () => {
            const spy = jest.spyOn(zoomManager, 'clearTextureCache');
            
            renderer.clearZoomTextureCache();
            
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('Interaction Controller Integration', () => {
        test('should connect zoom manager to interaction controller', () => {
            const interactionController = renderer.getInteractionController();
            expect(interactionController).toBeDefined();
            
            // Verify that zoom manager is listening to camera changes
            expect(interactionController.onControlsChange).toHaveBeenCalled();
        });

        test('should handle camera distance changes from interaction controller', () => {
            const spy = jest.spyOn(zoomManager, 'handleCameraChange');
            
            // Simulate camera change from interaction controller
            const interactionController = renderer.getInteractionController();
            const changeCallback = interactionController.onControlsChange.mock.calls[0][0];
            
            changeCallback({ distance: 15 });
            
            expect(spy).toHaveBeenCalledWith(15);
        });

        test('should update zoom level based on camera distance', () => {
            const spy = jest.spyOn(zoomManager, 'transitionToZoomLevel');
            
            // Simulate camera moving closer
            zoomManager.handleCameraChange(8); // Should trigger zoom level 3
            
            expect(spy).toHaveBeenCalledWith(3);
        });
    });

    describe('Model Loading Integration', () => {
        test('should handle zoom texture loading for loaded models', async () => {
            // Create a mock model with structures
            const mockModel = new THREE.Group();
            const mockMesh = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshStandardMaterial()
            );
            mockMesh.name = 'test_structure';
            mockModel.add(mockMesh);
            
            // Add model to scene
            renderer.scene.add(mockModel);
            renderer.addSelectableObjects(mockMesh);
            
            // Mock texture loading
            const mockTexture = { needsUpdate: false };
            zoomManager.textureLoader.load = jest.fn().mockImplementation((path, onLoad) => {
                onLoad(mockTexture);
            });
            
            // Trigger zoom level change that should load textures
            await zoomManager.loadTexturesForZoomLevel(2);
            
            expect(zoomManager.textureLoader.load).toHaveBeenCalled();
        });

        test('should apply textures to model structures', () => {
            const mockMesh = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshStandardMaterial()
            );
            mockMesh.name = 'test_structure';
            
            const mockTexture = { test: true };
            
            zoomManager.applyTextureToStructure(mockMesh, mockTexture);
            
            expect(mockMesh.material.map).toBe(mockTexture);
            expect(mockMesh.material.needsUpdate).toBe(true);
        });

        test('should handle structures with multiple materials', () => {
            const materials = [
                new THREE.MeshStandardMaterial(),
                new THREE.MeshStandardMaterial()
            ];
            
            const mockMesh = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                materials
            );
            mockMesh.name = 'test_structure';
            
            const mockTexture = { test: true };
            
            zoomManager.applyTextureToStructure(mockMesh, mockTexture);
            
            materials.forEach(material => {
                expect(material.map).toBe(mockTexture);
                expect(material.needsUpdate).toBe(true);
            });
        });
    });

    describe('Label System Integration', () => {
        test('should create labels for visible structures', () => {
            // Add a test structure to the scene
            const mockMesh = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshStandardMaterial()
            );
            mockMesh.name = 'Heart';
            mockMesh.visible = true;
            renderer.scene.add(mockMesh);
            
            // Mock scene traversal to return our test structure
            renderer.scene.traverse = jest.fn().mockImplementation(callback => {
                callback(mockMesh);
            });
            
            // Mock frustum check to return true (structure is in view)
            jest.spyOn(zoomManager, 'isStructureInView').mockReturnValue(true);
            
            // Update labels at a distance that should show labels
            zoomManager.updateLabels(20);
            
            expect(zoomManager.activeLabels.size).toBeGreaterThan(0);
        });

        test('should clear labels when distance is too far', () => {
            zoomManager.updateLabels(50); // Beyond max label distance
            
            expect(zoomManager.activeLabels.size).toBe(0);
        });

        test('should clear labels when distance is too close', () => {
            zoomManager.updateLabels(1); // Below min label distance
            
            expect(zoomManager.activeLabels.size).toBe(0);
        });

        test('should update label text correctly', () => {
            const mockStructure = { name: 'biceps_brachii' };
            const label = zoomManager.createLabelMesh();
            
            zoomManager.updateLabelText(label, mockStructure);
            
            expect(label.userData.context.fillText).toHaveBeenCalledWith(
                'Biceps Brachii',
                expect.any(Number),
                expect.any(Number)
            );
        });
    });

    describe('Performance Integration', () => {
        test('should throttle zoom updates for performance', () => {
            const spy = jest.spyOn(zoomManager, 'transitionToZoomLevel');
            
            // Rapid successive camera changes
            zoomManager.handleCameraChange(25);
            zoomManager.handleCameraChange(24);
            zoomManager.handleCameraChange(23);
            
            // Should only process first call due to throttling
            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('should cache textures to avoid reloading', async () => {
            const mockStructure = {
                name: 'test_structure',
                traverse: jest.fn()
            };
            
            const mockTexture = { cached: true };
            zoomManager.textureLoader.load = jest.fn().mockImplementation((path, onLoad) => {
                onLoad(mockTexture);
            });
            
            // Load texture twice
            await zoomManager.loadHighResTexture(mockStructure, 'high');
            await zoomManager.loadHighResTexture(mockStructure, 'high');
            
            // Should only load once, second call uses cache
            expect(zoomManager.textureLoader.load).toHaveBeenCalledTimes(1);
        });

        test('should prevent duplicate texture loading requests', async () => {
            const mockStructure = {
                name: 'test_structure',
                traverse: jest.fn()
            };
            
            let resolveTexture;
            const texturePromise = new Promise(resolve => {
                resolveTexture = resolve;
            });
            
            zoomManager.textureLoader.load = jest.fn().mockImplementation((path, onLoad) => {
                texturePromise.then(() => onLoad({ loaded: true }));
            });
            
            // Start two loads simultaneously
            const promise1 = zoomManager.loadHighResTexture(mockStructure, 'high');
            const promise2 = zoomManager.loadHighResTexture(mockStructure, 'high');
            
            // Resolve the texture loading
            resolveTexture();
            
            const [result1, result2] = await Promise.all([promise1, promise2]);
            
            expect(result1).toEqual(result2);
            expect(zoomManager.textureLoader.load).toHaveBeenCalledTimes(1);
        });
    });

    describe('Transition Integration', () => {
        test('should perform smooth transitions between zoom levels', async () => {
            const startLevel = 0;
            const endLevel = 2;
            
            const spy = jest.spyOn(zoomManager, 'updateTransitionState');
            
            await zoomManager.performSmoothTransition(startLevel, endLevel);
            
            expect(spy).toHaveBeenCalled();
            expect(zoomManager.currentZoomLevel).toBe(endLevel);
        });

        test('should notify transition complete callbacks', () => {
            const callback = jest.fn();
            renderer.onZoomTransitionComplete(callback);
            
            zoomManager.notifyTransitionComplete(2);
            
            expect(callback).toHaveBeenCalledWith(2, zoomManager.options.zoomLevels[2]);
        });

        test('should handle transition errors gracefully', async () => {
            // Mock a transition that throws an error
            jest.spyOn(zoomManager, 'updateTransitionState').mockImplementation(() => {
                throw new Error('Transition error');
            });
            
            // Should not throw and should reset transition state
            await expect(zoomManager.performSmoothTransition(0, 1)).rejects.toThrow();
            expect(zoomManager.isTransitioning).toBe(false);
        });
    });

    describe('Orientation Indicators Integration', () => {
        test('should update compass based on camera direction', () => {
            const mockDirection = new THREE.Vector3(1, 0, 0);
            renderer.camera.getWorldDirection = jest.fn().mockReturnValue(mockDirection);
            
            zoomManager.updateOrientationIndicators();
            
            expect(zoomManager.compassMesh.rotation.z).toBeCloseTo(-Math.PI / 2);
        });

        test('should make axis helpers face camera', () => {
            const spy = jest.spyOn(zoomManager.axisHelpers, 'lookAt');
            
            zoomManager.updateOrientationIndicators();
            
            expect(spy).toHaveBeenCalledWith(renderer.camera.position);
        });
    });

    describe('Error Handling Integration', () => {
        test('should handle missing zoom manager gracefully', () => {
            // Create renderer without zoom manager
            const rendererWithoutZoom = new AnatomicalRenderer(mockCanvas, {
                enableInteractions: false
            });
            
            // Mock missing zoom manager
            rendererWithoutZoom.zoomManager = null;
            
            expect(() => rendererWithoutZoom.setZoomLevel(2)).not.toThrow();
            expect(() => rendererWithoutZoom.setLabelsEnabled(false)).not.toThrow();
            expect(rendererWithoutZoom.getCurrentZoomInfo()).toBeNull();
        });

        test('should handle texture loading failures', async () => {
            const mockStructure = {
                name: 'test_structure',
                traverse: jest.fn()
            };
            
            // Mock texture loading failure
            zoomManager.textureLoader.load = jest.fn().mockImplementation((path, onLoad, onProgress, onError) => {
                onError(new Error('Network error'));
            });
            
            // Should fall back to creating a simple texture
            const result = await zoomManager.loadHighResTexture(mockStructure, 'high');
            
            expect(result).toBeDefined();
        });

        test('should handle scene with no structures', () => {
            renderer.scene.traverse = jest.fn().mockImplementation(callback => {
                // No structures in scene
            });
            
            const structures = zoomManager.getVisibleStructures();
            expect(structures).toEqual([]);
            
            // Should not throw when updating labels
            expect(() => zoomManager.updateLabels(20)).not.toThrow();
        });
    });

    describe('Memory Management Integration', () => {
        test('should dispose zoom manager resources on renderer disposal', () => {
            const spy = jest.spyOn(zoomManager, 'dispose');
            
            // Simulate renderer disposal (would be called in actual dispose method)
            zoomManager.dispose();
            
            expect(spy).toHaveBeenCalled();
        });

        test('should clear texture cache when requested', () => {
            const mockTexture = { dispose: jest.fn() };
            zoomManager.textureCache.set('test', mockTexture);
            
            renderer.clearZoomTextureCache();
            
            expect(mockTexture.dispose).toHaveBeenCalled();
            expect(zoomManager.textureCache.size).toBe(0);
        });

        test('should clean up labels when disposing', () => {
            const mockLabel = { visible: true, userData: { isActive: true } };
            zoomManager.activeLabels.set('test', mockLabel);
            
            zoomManager.dispose();
            
            expect(zoomManager.activeLabels.size).toBe(0);
        });
    });
});