/**
 * Performance tests for 3D rendering and memory usage
 */

import { AnatomicalRenderer } from '../../src/AnatomicalRenderer.js';
import { PerformanceManager } from '../../src/PerformanceManager.js';

describe('Rendering Performance Tests', () => {
  let canvas, renderer, performanceManager;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    document.body.appendChild(canvas);
    
    renderer = new AnatomicalRenderer(canvas);
    performanceManager = new PerformanceManager();
  });

  afterEach(() => {
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    renderer?.dispose();
  });

  describe('FPS Performance', () => {
    test('should maintain 60 FPS with basic model', async () => {
      await renderer.loadModel('test-models/basic-skeleton.glb', 'musculoskeletal');
      
      const frameCount = 60; // Test for 1 second at 60fps
      const startTime = performance.now();
      
      for (let i = 0; i < frameCount; i++) {
        renderer.render();
        // Simulate frame timing
        await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
      }
      
      const endTime = performance.now();
      const actualFPS = (frameCount * 1000) / (endTime - startTime);
      
      expect(actualFPS).toBeGreaterThanOrEqual(55); // Allow 5fps tolerance
    });

    test('should adapt quality under performance pressure', async () => {
      await renderer.loadModel('test-models/high-poly-anatomy.glb', 'complete');
      
      // Simulate performance pressure
      performanceManager.startMonitoring();
      
      // Render complex scene multiple times
      const renderTimes = [];
      for (let i = 0; i < 30; i++) {
        const start = performance.now();
        renderer.render();
        const end = performance.now();
        renderTimes.push(end - start);
      }
      
      const avgRenderTime = renderTimes.reduce((a, b) => a + b) / renderTimes.length;
      const targetFrameTime = 16.67; // 60fps = 16.67ms per frame
      
      if (avgRenderTime > targetFrameTime) {
        // Should have automatically reduced quality
        expect(renderer.getCurrentQuality()).toBeLessThan(1.0);
      }
    });

    test('should handle LOD transitions smoothly', async () => {
      await renderer.loadModel('test-models/multi-lod-model.glb', 'complete');
      
      const camera = renderer.getCamera();
      const initialPosition = camera.position.z;
      
      // Test LOD transitions at different distances
      const distances = [100, 50, 25, 10, 5];
      const renderTimes = [];
      
      for (const distance of distances) {
        camera.position.z = distance;
        
        const start = performance.now();
        renderer.render();
        const end = performance.now();
        
        renderTimes.push(end - start);
      }
      
      // Render times should be relatively consistent despite LOD changes
      const maxTime = Math.max(...renderTimes);
      const minTime = Math.min(...renderTimes);
      const variance = (maxTime - minTime) / minTime;
      
      expect(variance).toBeLessThan(0.5); // Less than 50% variance
    });
  });

  describe('Memory Performance', () => {
    test('should not exceed memory limits', async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      // Load multiple models
      const models = [
        'test-models/skeleton.glb',
        'test-models/muscles.glb',
        'test-models/organs.glb'
      ];
      
      for (const model of models) {
        await renderer.loadModel(model, 'complete');
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Should not use more than 100MB for test models
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });

    test('should properly dispose of resources', async () => {
      await renderer.loadModel('test-models/test-model.glb', 'complete');
      
      const beforeDispose = performance.memory?.usedJSHeapSize || 0;
      
      renderer.dispose();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const afterDispose = performance.memory?.usedJSHeapSize || 0;
      
      // Memory should be freed (allowing for some variance)
      expect(afterDispose).toBeLessThanOrEqual(beforeDispose);
    });

    test('should handle texture streaming efficiently', async () => {
      await renderer.loadModel('test-models/high-res-textures.glb', 'complete');
      
      const camera = renderer.getCamera();
      const performanceData = [];
      
      // Test zoom levels
      const zoomLevels = [1, 2, 4, 8, 16];
      
      for (const zoom of zoomLevels) {
        camera.position.z = 100 / zoom; // Closer = higher zoom
        
        const beforeRender = performance.now();
        const beforeMemory = performance.memory?.usedJSHeapSize || 0;
        
        renderer.render();
        
        const afterRender = performance.now();
        const afterMemory = performance.memory?.usedJSHeapSize || 0;
        
        performanceData.push({
          zoom,
          renderTime: afterRender - beforeRender,
          memoryUsed: afterMemory - beforeMemory
        });
      }
      
      // Higher zoom should not dramatically increase render time
      const lowZoomTime = performanceData[0].renderTime;
      const highZoomTime = performanceData[performanceData.length - 1].renderTime;
      
      expect(highZoomTime / lowZoomTime).toBeLessThan(3); // Max 3x slower
    });
  });

  describe('Mobile Performance', () => {
    test('should adapt to mobile constraints', async () => {
      // Simulate mobile device
      renderer.setDeviceProfile('mobile');
      
      await renderer.loadModel('test-models/mobile-optimized.glb', 'complete');
      
      const renderStart = performance.now();
      
      // Render multiple frames
      for (let i = 0; i < 30; i++) {
        renderer.render();
      }
      
      const renderEnd = performance.now();
      const avgFrameTime = (renderEnd - renderStart) / 30;
      
      // Mobile should maintain reasonable performance
      expect(avgFrameTime).toBeLessThan(33); // 30fps minimum
    });

    test('should handle touch interaction performance', async () => {
      await renderer.loadModel('test-models/interactive-model.glb', 'complete');
      
      const touchEvents = [];
      for (let i = 0; i < 100; i++) {
        touchEvents.push({
          type: 'touchmove',
          touches: [{ clientX: i, clientY: i }]
        });
      }
      
      const startTime = performance.now();
      
      touchEvents.forEach(event => {
        renderer.handleTouchEvent(event);
      });
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // Should process touch events quickly
      expect(processingTime).toBeLessThan(100); // 100ms for 100 events
    });
  });

  describe('Stress Testing', () => {
    test('should handle rapid model switching', async () => {
      const models = [
        'test-models/model1.glb',
        'test-models/model2.glb',
        'test-models/model3.glb'
      ];
      
      const switchTimes = [];
      
      for (let i = 0; i < 10; i++) {
        const modelIndex = i % models.length;
        const start = performance.now();
        
        await renderer.loadModel(models[modelIndex], 'complete');
        
        const end = performance.now();
        switchTimes.push(end - start);
      }
      
      const avgSwitchTime = switchTimes.reduce((a, b) => a + b) / switchTimes.length;
      
      // Model switching should be reasonably fast
      expect(avgSwitchTime).toBeLessThan(2000); // 2 seconds max
    });

    test('should maintain stability under continuous operation', async () => {
      await renderer.loadModel('test-models/stress-test.glb', 'complete');
      
      let errorCount = 0;
      const operations = 1000;
      
      for (let i = 0; i < operations; i++) {
        try {
          // Perform various operations
          renderer.render();
          if (i % 10 === 0) renderer.isolateStructure(`structure_${i % 5}`);
          if (i % 15 === 0) renderer.highlightStructure(`structure_${i % 3}`, '#ff0000');
          if (i % 20 === 0) renderer.setLayerVisibility(`layer_${i % 4}`, i % 2 === 0);
        } catch (error) {
          errorCount++;
        }
      }
      
      // Should maintain stability with minimal errors
      expect(errorCount / operations).toBeLessThan(0.01); // Less than 1% error rate
    });
  });
});