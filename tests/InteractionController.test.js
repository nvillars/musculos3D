import InteractionController from '../src/InteractionController.js';
import AnatomicalRenderer from '../src/AnatomicalRenderer.js';
import * as THREE from 'three';

// Mock OrbitControls
jest.mock('three/examples/jsm/controls/OrbitControls.js', () => ({
    OrbitControls: jest.fn().mockImplementation((camera, canvas) => ({
        enableDamping: true,
        dampingFactor: 0.05,
        enablePan: true,
        enableZoom: true,
        enableRotate: true,
        autoRotate: false,
        autoRotateSpeed: 2.0,
        minDistance: 1,
        maxDistance: 50,
        maxPolarAngle: Math.PI,
        minPolarAngle: 0,
        enabled: true,
        target: new THREE.Vector3(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        update: jest.fn(),
        dispose: jest.fn(),
        getAzimuthalAngle: jest.fn(() => 0),
        getPolarAngle: jest.fn(() => Math.PI / 2)
    }))
}));

describe('InteractionController', () => {
    let canvas, renderer, interactionController;
    let mockCamera, mockScene;

    beforeEach(() => {
        // Create mock canvas
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        canvas.getBoundingClientRect = jest.fn(() => ({
            left: 0,
            top: 0,
            width: 800,
            height: 600
        }));
        
        // Mock canvas style
        canvas.style = {
            cursor: 'default'
        };
        
        // Create mock camera and scene
        mockCamera = new THREE.PerspectiveCamera(75, 800/600, 0.1, 1000);
        mockCamera.position.set(0, 0, 5);
        mockScene = new THREE.Scene();
        
        // Create mock renderer
        renderer = {
            camera: mockCamera,
            scene: mockScene,
            canvas: canvas
        };
        
        // Mock touch support detection
        Object.defineProperty(window, 'ontouchstart', {
            writable: true,
            value: undefined
        });
        Object.defineProperty(navigator, 'maxTouchPoints', {
            writable: true,
            value: 0
        });
    });

    afterEach(() => {
        if (interactionController) {
            interactionController.dispose();
        }
    });

    describe('Initialization', () => {
        test('should initialize with default options', () => {
            interactionController = new InteractionController(renderer, canvas);
            
            expect(interactionController.renderer).toBe(renderer);
            expect(interactionController.canvas).toBe(canvas);
            expect(interactionController.camera).toBe(mockCamera);
            expect(interactionController.scene).toBe(mockScene);
            expect(interactionController.orbitControls).toBeDefined();
            expect(interactionController.raycaster).toBeInstanceOf(THREE.Raycaster);
        });

        test('should initialize with custom options', () => {
            const customOptions = {
                minDistance: 2,
                maxDistance: 100,
                enableDamping: false,
                enablePan: false
            };
            
            interactionController = new InteractionController(renderer, canvas, customOptions);
            
            expect(interactionController.options.minDistance).toBe(2);
            expect(interactionController.options.maxDistance).toBe(100);
            expect(interactionController.options.enableDamping).toBe(false);
            expect(interactionController.options.enablePan).toBe(false);
        });

        test('should detect touch device correctly', () => {
            // Mock touch device
            Object.defineProperty(window, 'ontouchstart', {
                value: true
            });
            
            interactionController = new InteractionController(renderer, canvas);
            expect(interactionController.isTouchDevice).toBe(true);
        });
    });

    describe('OrbitControls Configuration', () => {
        beforeEach(() => {
            interactionController = new InteractionController(renderer, canvas);
        });

        test('should configure OrbitControls with correct settings', () => {
            const controls = interactionController.orbitControls;
            
            expect(controls.enableDamping).toBe(true);
            expect(controls.dampingFactor).toBe(0.05);
            expect(controls.enablePan).toBe(true);
            expect(controls.enableZoom).toBe(true);
            expect(controls.enableRotate).toBe(true);
            expect(controls.minDistance).toBe(1);
            expect(controls.maxDistance).toBe(50);
        });

        test('should set zoom limits correctly', () => {
            interactionController.setZoomLimits(5, 25);
            
            expect(interactionController.options.minDistance).toBe(5);
            expect(interactionController.options.maxDistance).toBe(25);
            expect(interactionController.orbitControls.minDistance).toBe(5);
            expect(interactionController.orbitControls.maxDistance).toBe(25);
        });

        test('should enable/disable orbit controls', () => {
            interactionController.setOrbitControlsEnabled(false);
            expect(interactionController.orbitControls.enabled).toBe(false);
            
            interactionController.setOrbitControlsEnabled(true);
            expect(interactionController.orbitControls.enabled).toBe(true);
        });

        test('should configure auto rotation', () => {
            interactionController.setAutoRotate(true, 5.0);
            
            expect(interactionController.orbitControls.autoRotate).toBe(true);
            expect(interactionController.orbitControls.autoRotateSpeed).toBe(5.0);
        });
    });

    describe('Mouse Events', () => {
        beforeEach(() => {
            interactionController = new InteractionController(renderer, canvas);
        });

        test('should handle mouse move events', () => {
            const mockEvent = {
                clientX: 400,
                clientY: 300
            };
            
            interactionController.handleMouseMove(mockEvent);
            
            expect(interactionController.mouse.x).toBe(0); // Center of canvas
            expect(interactionController.mouse.y).toBe(0);
        });

        test('should handle mouse click events', () => {
            const mockEvent = {
                clientX: 400,
                clientY: 300,
                preventDefault: jest.fn()
            };
            
            interactionController.handleMouseClick(mockEvent);
            
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(interactionController.mouse.x).toBe(0);
            expect(interactionController.mouse.y).toBe(0);
        });

        test('should update mouse coordinates correctly', () => {
            const mockEvent = {
                clientX: 200, // Left quarter
                clientY: 150  // Top quarter
            };
            
            interactionController.updateMouseCoordinates(mockEvent);
            
            expect(interactionController.mouse.x).toBe(-0.5);
            expect(interactionController.mouse.y).toBe(0.5);
        });
    });

    describe('Touch Events', () => {
        beforeEach(() => {
            // Mock touch device
            Object.defineProperty(window, 'ontouchstart', {
                value: true
            });
            
            interactionController = new InteractionController(renderer, canvas);
        });

        test('should handle single touch start', () => {
            const mockEvent = {
                preventDefault: jest.fn(),
                touches: [{
                    clientX: 400,
                    clientY: 300
                }]
            };
            
            interactionController.handleTouchStart(mockEvent);
            
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(interactionController.touchState.isActive).toBe(true);
            expect(interactionController.touchStart.x).toBe(400);
            expect(interactionController.touchStart.y).toBe(300);
        });

        test('should handle two finger touch start for pinch zoom', () => {
            const mockEvent = {
                preventDefault: jest.fn(),
                touches: [
                    { clientX: 300, clientY: 300 },
                    { clientX: 500, clientY: 300 }
                ]
            };
            
            interactionController.handleTouchStart(mockEvent);
            
            expect(interactionController.touchState.startDistance).toBe(200);
        });

        test('should handle touch tap for selection', () => {
            const mockTouch = {
                clientX: 400,
                clientY: 300
            };
            
            // Set up touch start position
            interactionController.touchStart.set(400, 300);
            
            interactionController.handleTouchTap(mockTouch);
            
            expect(interactionController.mouse.x).toBe(0);
            expect(interactionController.mouse.y).toBe(0);
        });

        test('should calculate touch distance correctly', () => {
            const touch1 = { clientX: 100, clientY: 100 };
            const touch2 = { clientX: 400, clientY: 400 };
            
            const distance = interactionController.getTouchDistance(touch1, touch2);
            
            expect(distance).toBeCloseTo(424.26, 1); // sqrt(300^2 + 300^2)
        });
    });

    describe('Object Selection', () => {
        let testObject;

        beforeEach(() => {
            interactionController = new InteractionController(renderer, canvas);
            
            // Create test object
            testObject = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshBasicMaterial({ color: 0xff0000 })
            );
            testObject.position.set(0, 0, 0);
            
            // Add to selectable objects
            interactionController.addSelectableObjects(testObject);
        });

        test('should add selectable objects', () => {
            expect(interactionController.selectableObjects).toContain(testObject);
            expect(interactionController.selectableObjects.length).toBe(1);
        });

        test('should remove selectable objects', () => {
            interactionController.removeSelectableObjects(testObject);
            
            expect(interactionController.selectableObjects).not.toContain(testObject);
            expect(interactionController.selectableObjects.length).toBe(0);
        });

        test('should clear all selectable objects', () => {
            const testObject2 = new THREE.Mesh(
                new THREE.SphereGeometry(1),
                new THREE.MeshBasicMaterial({ color: 0x00ff00 })
            );
            
            interactionController.addSelectableObjects(testObject2);
            expect(interactionController.selectableObjects.length).toBe(2);
            
            interactionController.clearSelectableObjects();
            expect(interactionController.selectableObjects.length).toBe(0);
        });

        test('should handle selection callbacks', () => {
            const onSelectCallback = jest.fn();
            interactionController.onObjectSelect(onSelectCallback);
            
            // Mock raycaster intersection
            const mockIntersection = {
                object: testObject,
                point: new THREE.Vector3(0, 0, 0),
                distance: 5
            };
            
            interactionController.raycaster.intersectObjects = jest.fn(() => [mockIntersection]);
            interactionController.performSelection();
            
            expect(interactionController.selectedObject).toBe(testObject);
            expect(onSelectCallback).toHaveBeenCalledWith(testObject, mockIntersection);
        });

        test('should handle hover callbacks', () => {
            const onHoverCallback = jest.fn();
            const onUnhoverCallback = jest.fn();
            
            interactionController.onObjectHover(onHoverCallback);
            interactionController.onObjectUnhover(onUnhoverCallback);
            
            // Mock raycaster intersection
            const mockIntersection = {
                object: testObject,
                point: new THREE.Vector3(0, 0, 0),
                distance: 5
            };
            
            interactionController.raycaster.intersectObjects = jest.fn(() => [mockIntersection]);
            interactionController.performHoverDetection();
            
            expect(interactionController.hoveredObject).toBe(testObject);
            expect(onHoverCallback).toHaveBeenCalledWith(testObject, mockIntersection);
            expect(canvas.style.cursor).toBe('pointer');
            
            // Clear hover
            interactionController.raycaster.intersectObjects = jest.fn(() => []);
            interactionController.performHoverDetection();
            
            expect(interactionController.hoveredObject).toBeNull();
            expect(onUnhoverCallback).toHaveBeenCalledWith(testObject);
            expect(canvas.style.cursor).toBe('default');
        });
    });

    describe('Control Modes', () => {
        beforeEach(() => {
            interactionController = new InteractionController(renderer, canvas);
        });

        test('should set mobile control mode', () => {
            interactionController.setControlMode('mobile');
            
            expect(interactionController.options.minDistance).toBe(0.5);
            expect(interactionController.options.maxDistance).toBe(20);
            expect(interactionController.orbitControls.enablePan).toBe(false);
            expect(interactionController.orbitControls.dampingFactor).toBe(0.1);
        });

        test('should set tablet control mode', () => {
            interactionController.setControlMode('tablet');
            
            expect(interactionController.options.minDistance).toBe(1);
            expect(interactionController.options.maxDistance).toBe(30);
            expect(interactionController.orbitControls.enablePan).toBe(true);
            expect(interactionController.orbitControls.dampingFactor).toBe(0.08);
        });

        test('should set desktop control mode', () => {
            interactionController.setControlMode('desktop');
            
            expect(interactionController.options.minDistance).toBe(1);
            expect(interactionController.options.maxDistance).toBe(50);
            expect(interactionController.orbitControls.enablePan).toBe(true);
            expect(interactionController.orbitControls.dampingFactor).toBe(0.05);
        });
    });

    describe('Information Methods', () => {
        beforeEach(() => {
            interactionController = new InteractionController(renderer, canvas);
        });

        test('should get control information', () => {
            const info = interactionController.getControlInfo();
            
            expect(info).toHaveProperty('isTouch');
            expect(info).toHaveProperty('hasOrbitControls');
            expect(info).toHaveProperty('hasRaycaster');
            expect(info).toHaveProperty('selectableObjectsCount');
            expect(info).toHaveProperty('selectedObject');
            expect(info).toHaveProperty('hoveredObject');
            expect(info).toHaveProperty('cameraDistance');
            expect(info).toHaveProperty('zoomLimits');
            
            expect(info.hasOrbitControls).toBe(true);
            expect(info.hasRaycaster).toBe(true);
            expect(info.selectableObjectsCount).toBe(0);
        });

        test('should get camera distance', () => {
            // Mock camera position and target
            mockCamera.position.set(0, 0, 10);
            interactionController.orbitControls.target.set(0, 0, 0);
            
            const distance = interactionController.getCameraDistance();
            expect(distance).toBe(10);
        });

        test('should get selected and hovered objects', () => {
            expect(interactionController.getSelectedObject()).toBeNull();
            expect(interactionController.getHoveredObject()).toBeNull();
            
            const testObject = new THREE.Mesh();
            interactionController.selectedObject = testObject;
            interactionController.hoveredObject = testObject;
            
            expect(interactionController.getSelectedObject()).toBe(testObject);
            expect(interactionController.getHoveredObject()).toBe(testObject);
        });
    });

    describe('Update and Disposal', () => {
        beforeEach(() => {
            interactionController = new InteractionController(renderer, canvas);
        });

        test('should update controls', () => {
            interactionController.update();
            expect(interactionController.orbitControls.update).toHaveBeenCalled();
        });

        test('should dispose properly', () => {
            const disposeSpy = jest.spyOn(interactionController.orbitControls, 'dispose');
            
            interactionController.dispose();
            
            expect(disposeSpy).toHaveBeenCalled();
            expect(interactionController.orbitControls).toBeNull();
            expect(interactionController.raycaster).toBeNull();
            expect(interactionController.selectedObject).toBeNull();
            expect(interactionController.hoveredObject).toBeNull();
            expect(interactionController.selectableObjects).toEqual([]);
        });
    });

    describe('Event Simulation Tests', () => {
        beforeEach(() => {
            interactionController = new InteractionController(renderer, canvas);
            document.body.appendChild(canvas);
        });

        afterEach(() => {
            document.body.removeChild(canvas);
        });

        test('should simulate mouse click event', () => {
            const clickEvent = new MouseEvent('click', {
                clientX: 400,
                clientY: 300,
                bubbles: true
            });
            
            const handleClickSpy = jest.spyOn(interactionController, 'handleMouseClick');
            canvas.dispatchEvent(clickEvent);
            
            expect(handleClickSpy).toHaveBeenCalled();
        });

        test('should simulate mouse move event', () => {
            const moveEvent = new MouseEvent('mousemove', {
                clientX: 200,
                clientY: 150,
                bubbles: true
            });
            
            const handleMoveSpy = jest.spyOn(interactionController, 'handleMouseMove');
            canvas.dispatchEvent(moveEvent);
            
            expect(handleMoveSpy).toHaveBeenCalled();
        });

        test('should simulate touch events', () => {
            // Mock touch device
            Object.defineProperty(window, 'ontouchstart', {
                value: true
            });
            
            // Recreate controller for touch device
            interactionController.dispose();
            interactionController = new InteractionController(renderer, canvas);
            
            const touchStartEvent = new TouchEvent('touchstart', {
                touches: [
                    new Touch({
                        identifier: 1,
                        target: canvas,
                        clientX: 400,
                        clientY: 300
                    })
                ],
                bubbles: true
            });
            
            const handleTouchStartSpy = jest.spyOn(interactionController, 'handleTouchStart');
            canvas.dispatchEvent(touchStartEvent);
            
            expect(handleTouchStartSpy).toHaveBeenCalled();
        });
    });
});