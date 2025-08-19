// Simple test to verify InteractionController functionality
import InteractionController from './src/InteractionController.js';
import * as THREE from 'three';

// Create a minimal test setup
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;

const camera = new THREE.PerspectiveCamera(75, 800/600, 0.1, 1000);
camera.position.set(0, 0, 5);

const scene = new THREE.Scene();

const mockRenderer = {
    camera: camera,
    scene: scene,
    canvas: canvas
};

try {
    console.log('Testing InteractionController initialization...');
    const controller = new InteractionController(mockRenderer, canvas);
    
    console.log('✓ InteractionController created successfully');
    console.log('✓ OrbitControls configured:', !!controller.orbitControls);
    console.log('✓ Raycaster initialized:', !!controller.raycaster);
    console.log('✓ Touch device detection:', controller.isTouchDevice);
    
    // Test adding selectable objects
    const testCube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    
    controller.addSelectableObjects(testCube);
    console.log('✓ Selectable objects added:', controller.selectableObjects.length);
    
    // Test zoom limits
    controller.setZoomLimits(2, 20);
    console.log('✓ Zoom limits set:', controller.options.minDistance, '-', controller.options.maxDistance);
    
    // Test control modes
    controller.setControlMode('mobile');
    console.log('✓ Mobile control mode set');
    
    controller.setControlMode('desktop');
    console.log('✓ Desktop control mode set');
    
    // Test control info
    const info = controller.getControlInfo();
    console.log('✓ Control info retrieved:', Object.keys(info));
    
    // Test disposal
    controller.dispose();
    console.log('✓ InteractionController disposed successfully');
    
    console.log('\n🎉 All InteractionController tests passed!');
    
} catch (error) {
    console.error('❌ InteractionController test failed:', error);
}