#!/usr/bin/env node

/**
 * Simple test runner for zoom functionality
 * This script validates the core zoom features without requiring full Jest setup
 */

import * as THREE from 'three';
import ZoomManager from './src/ZoomManager.js';

// Mock browser APIs for Node.js environment
global.document = {
    createElement: (tagName) => {
        if (tagName === 'canvas') {
            return {
                getContext: () => ({
                    clearRect: () => {},
                    fillText: () => {},
                    strokeText: () => {},
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
    }
};

global.performance = {
    now: () => Date.now()
};

global.requestAnimationFrame = (callback) => {
    setTimeout(callback, 16);
};

class ZoomFunctionalityTester {
    constructor() {
        this.testResults = [];
        this.passedTests = 0;
        this.failedTests = 0;
    }

    test(name, testFunction) {
        try {
            testFunction();
            this.testResults.push({ name, status: 'PASS', error: null });
            this.passedTests++;
            console.log(`✅ ${name}`);
        } catch (error) {
            this.testResults.push({ name, status: 'FAIL', error: error.message });
            this.failedTests++;
            console.log(`❌ ${name}: ${error.message}`);
        }
    }

    async runTests() {
        console.log('🔍 Testing Deep Zoom Functionality\n');

        // Setup test environment
        const mockRenderer = {
            camera: new THREE.PerspectiveCamera(),
            scene: new THREE.Scene(),
            getInteractionController: () => ({
                onControlsChange: () => {}
            })
        };

        const mockCamera = new THREE.PerspectiveCamera();
        const mockScene = new THREE.Scene();

        // Test 1: ZoomManager Initialization
        this.test('ZoomManager initializes correctly', () => {
            const zoomManager = new ZoomManager(mockRenderer, mockCamera, mockScene);
            
            if (!zoomManager) throw new Error('ZoomManager not created');
            if (zoomManager.currentZoomLevel !== 0) throw new Error('Initial zoom level incorrect');
            if (!zoomManager.options.enableLabels) throw new Error('Labels not enabled by default');
            if (!zoomManager.options.enableOrientationIndicators) throw new Error('Orientation indicators not enabled by default');
            
            zoomManager.dispose();
        });

        // Test 2: Zoom Level Calculation
        this.test('Zoom level calculation works correctly', () => {
            const zoomManager = new ZoomManager(mockRenderer, mockCamera, mockScene);
            
            const level0 = zoomManager.calculateZoomLevel(60);
            const level1 = zoomManager.calculateZoomLevel(25);
            const level2 = zoomManager.calculateZoomLevel(15);
            const level3 = zoomManager.calculateZoomLevel(3);
            
            if (level0 !== 0) throw new Error(`Expected level 0, got ${level0}`);
            if (level1 !== 1) throw new Error(`Expected level 1, got ${level1}`);
            if (level2 !== 2) throw new Error(`Expected level 2, got ${level2}`);
            if (level3 !== 3) throw new Error(`Expected level 3, got ${level3}`);
            
            zoomManager.dispose();
        });

        // Test 3: Label System
        this.test('Label system creates labels correctly', () => {
            const zoomManager = new ZoomManager(mockRenderer, mockCamera, mockScene);
            
            const label = zoomManager.createLabelMesh();
            
            if (!label) throw new Error('Label not created');
            if (!(label instanceof THREE.Group)) throw new Error('Label is not a THREE.Group');
            if (!label.userData.canvas) throw new Error('Label canvas not created');
            if (!label.userData.context) throw new Error('Label context not created');
            
            zoomManager.dispose();
        });

        // Test 4: Structure Name Formatting
        this.test('Structure name formatting works correctly', () => {
            const zoomManager = new ZoomManager(mockRenderer, mockCamera, mockScene);
            
            const camelCase = zoomManager.formatStructureName('camelCaseName');
            const snakeCase = zoomManager.formatStructureName('snake_case_name');
            const mixed = zoomManager.formatStructureName('mixed_CaseExample');
            
            if (camelCase !== 'Camel Case Name') throw new Error(`Camel case formatting failed: ${camelCase}`);
            if (snakeCase !== 'Snake Case Name') throw new Error(`Snake case formatting failed: ${snakeCase}`);
            if (mixed !== 'Mixed Case Example') throw new Error(`Mixed case formatting failed: ${mixed}`);
            
            zoomManager.dispose();
        });

        // Test 5: Label Opacity Calculation
        this.test('Label opacity calculation works correctly', () => {
            const zoomManager = new ZoomManager(mockRenderer, mockCamera, mockScene);
            
            const opacity1 = zoomManager.calculateLabelOpacity(10); // Within fade start
            const opacity2 = zoomManager.calculateLabelOpacity(30); // At max distance
            const opacity3 = zoomManager.calculateLabelOpacity(22.5); // Halfway through fade
            
            if (opacity1 !== 1.0) throw new Error(`Expected opacity 1.0, got ${opacity1}`);
            if (opacity2 !== 0.0) throw new Error(`Expected opacity 0.0, got ${opacity2}`);
            if (Math.abs(opacity3 - 0.5) > 0.01) throw new Error(`Expected opacity ~0.5, got ${opacity3}`);
            
            zoomManager.dispose();
        });

        // Test 6: Easing Functions
        this.test('Easing functions work correctly', () => {
            const zoomManager = new ZoomManager(mockRenderer, mockCamera, mockScene);
            
            const linear = zoomManager.applyEasing(0.5, 'linear');
            const easeInOut = zoomManager.applyEasing(0.5, 'easeInOutCubic');
            const easeOut = zoomManager.applyEasing(0.5, 'easeOutQuad');
            const easeIn = zoomManager.applyEasing(0.5, 'easeInQuad');
            
            if (linear !== 0.5) throw new Error(`Linear easing failed: ${linear}`);
            if (easeInOut !== 0.5) throw new Error(`EaseInOutCubic failed: ${easeInOut}`);
            if (easeOut !== 0.75) throw new Error(`EaseOutQuad failed: ${easeOut}`);
            if (easeIn !== 0.25) throw new Error(`EaseInQuad failed: ${easeIn}`);
            
            zoomManager.dispose();
        });

        // Test 7: Zoom Level Setting
        this.test('Zoom level setting works correctly', () => {
            const zoomManager = new ZoomManager(mockRenderer, mockCamera, mockScene);
            
            zoomManager.setZoomLevel(2);
            if (zoomManager.targetZoomLevel !== 2) throw new Error('Target zoom level not set correctly');
            
            // Test invalid zoom levels
            zoomManager.setZoomLevel(-1);
            if (zoomManager.targetZoomLevel === -1) throw new Error('Invalid zoom level was accepted');
            
            zoomManager.setZoomLevel(10);
            if (zoomManager.targetZoomLevel === 10) throw new Error('Invalid zoom level was accepted');
            
            zoomManager.dispose();
        });

        // Test 8: Feature Toggles
        this.test('Feature toggles work correctly', () => {
            const zoomManager = new ZoomManager(mockRenderer, mockCamera, mockScene);
            
            zoomManager.setLabelsEnabled(false);
            if (zoomManager.options.enableLabels !== false) throw new Error('Labels not disabled');
            
            zoomManager.setLabelsEnabled(true);
            if (zoomManager.options.enableLabels !== true) throw new Error('Labels not enabled');
            
            zoomManager.setOrientationIndicatorsEnabled(false);
            if (zoomManager.options.enableOrientationIndicators !== false) throw new Error('Orientation indicators not disabled');
            
            zoomManager.dispose();
        });

        // Test 9: Texture Cache Management
        this.test('Texture cache management works correctly', () => {
            const zoomManager = new ZoomManager(mockRenderer, mockCamera, mockScene);
            
            // Add mock texture to cache
            const mockTexture = { dispose: jest.fn ? jest.fn() : () => {} };
            zoomManager.textureCache.set('test_texture', mockTexture);
            
            const stats = zoomManager.getTextureCacheStats();
            if (stats.cachedTextures !== 1) throw new Error('Cache stats incorrect');
            
            zoomManager.clearTextureCache();
            if (zoomManager.textureCache.size !== 0) throw new Error('Cache not cleared');
            
            zoomManager.dispose();
        });

        // Test 10: Zoom Info Retrieval
        this.test('Zoom info retrieval works correctly', () => {
            const zoomManager = new ZoomManager(mockRenderer, mockCamera, mockScene);
            
            zoomManager.currentZoomLevel = 2;
            zoomManager.targetZoomLevel = 3;
            zoomManager.isTransitioning = true;
            zoomManager.lastCameraDistance = 15.5;
            
            const info = zoomManager.getCurrentZoomInfo();
            
            if (info.level !== 2) throw new Error('Current level incorrect');
            if (info.targetLevel !== 3) throw new Error('Target level incorrect');
            if (info.isTransitioning !== true) throw new Error('Transition state incorrect');
            if (info.distance !== 15.5) throw new Error('Distance incorrect');
            
            zoomManager.dispose();
        });

        // Test 11: Smooth Transition
        this.test('Smooth transition completes', async () => {
            const zoomManager = new ZoomManager(mockRenderer, mockCamera, mockScene, {
                transitionDuration: 50 // Very short for testing
            });
            
            const startTime = Date.now();
            await zoomManager.performSmoothTransition(0, 2);
            const endTime = Date.now();
            
            if (endTime - startTime < 40) throw new Error('Transition completed too quickly');
            if (endTime - startTime > 200) throw new Error('Transition took too long');
            
            zoomManager.dispose();
        });

        // Test 12: Camera Change Handling
        this.test('Camera change handling works correctly', () => {
            const zoomManager = new ZoomManager(mockRenderer, mockCamera, mockScene);
            
            let transitionCalled = false;
            const originalTransition = zoomManager.transitionToZoomLevel;
            zoomManager.transitionToZoomLevel = (level) => {
                transitionCalled = true;
                return originalTransition.call(zoomManager, level);
            };
            
            zoomManager.handleCameraChange(15); // Should trigger zoom level 2
            
            if (!transitionCalled) throw new Error('Transition not triggered by camera change');
            if (zoomManager.lastCameraDistance !== 15) throw new Error('Camera distance not stored');
            if (zoomManager.targetZoomLevel !== 2) throw new Error('Target zoom level not set correctly');
            
            zoomManager.dispose();
        });

        console.log('\n📊 Test Results:');
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`📈 Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`);

        if (this.failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(result => result.status === 'FAIL')
                .forEach(result => {
                    console.log(`  - ${result.name}: ${result.error}`);
                });
        }

        return this.failedTests === 0;
    }
}

// Run tests
const tester = new ZoomFunctionalityTester();
tester.runTests()
    .then(success => {
        if (success) {
            console.log('\n🎉 All zoom functionality tests passed!');
            process.exit(0);
        } else {
            console.log('\n💥 Some tests failed. Please check the implementation.');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\n💥 Test runner failed:', error);
        process.exit(1);
    });