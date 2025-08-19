/**
 * Memory usage and leak detection tests
 */

import { AnatomicalRenderer } from '../../src/AnatomicalRenderer.js';
import { CacheManager } from '../../src/CacheManager.js';
import { ModelLoader } from '../../src/ModelLoader.js';

describe('Memory Usage Tests', () => {
  let canvas, renderer, cacheManager, modelLoader;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);
    
    renderer = new AnatomicalRenderer(canvas);
    cacheManager = new CacheManager();
    modelLoader = new ModelLoader();
  });

  afterEach(() => {
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    renderer?.dispose();
  });

  describe('Memory Leak Detection', () => {
    test('should not leak memory during model loading cycles', async () => {
      const initialMemory = getMemoryUsage();
      
      // Perform multiple load/unload cycles
      for (let i = 0; i < 10; i++) {
        await renderer.loadModel('test-models/cycle-test.glb', 'complete');
        renderer.clearScene();
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const finalMemory = getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    test('should properly dispose of Three.js resources', async () => {
      await renderer.loadModel('test-models/resource-test.glb', 'complete');
      
      const scene = renderer.getScene();
      const initialObjects = scene.children.length;
      
      // Track resources before disposal
      const geometries = [];
      const materials = [];
      const textures = [];
      
      scene.traverse((object) => {
        if (object.geometry) geometries.push(object.geometry);
        if (object.material) {
          if (Array.isArray(object.material)) {
            materials.push(...object.material);
          } else {
            materials.push(object.material);
          }
        }
      });
      
      materials.forEach(material => {
        Object.values(material).forEach(value => {
          if (value && value.isTexture) {
            textures.push(value);
          }
        });
      });
      
      const beforeDispose = getMemoryUsage();
      
      // Dispose renderer
      renderer.dispose();
      
      if (global.gc) {
        global.gc();
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const afterDispose = getMemoryUsage();
      
      // Verify resources were disposed
      geometries.forEach(geometry => {
        expect(() => geometry.getAttribute('position')).toThrow();
      });
      
      // Memory should be freed
      expect(afterDispose).toBeLessThanOrEqual(beforeDispose);
    });

    test('should handle cache memory limits', async () => {
      const maxCacheSize = 50 * 1024 * 1024; // 50MB
      cacheManager = new CacheManager({ maxSize: maxCacheSize });
      
      const largeData = new ArrayBuffer(10 * 1024 * 1024); // 10MB chunks
      
      // Fill cache beyond limit
      for (let i = 0; i < 8; i++) {
        await cacheManager.set(`large-item-${i}`, {
          data: largeData.slice(),
          size: largeData.byteLength
        });
      }
      
      const cacheSize = await cacheManager.getCurrentSize();
      
      // Cache should not exceed limit
      expect(cacheSize).toBeLessThanOrEqual(maxCacheSize);
    });
  });

  describe('Memory Optimization', () => {
    test('should use appropriate LOD for memory constraints', async () => {
      // Simulate low memory device
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 80 * 1024 * 1024,
          totalJSHeapSize: 100 * 1024 * 1024,
          jsHeapSizeLimit: 128 * 1024 * 1024
        },
        configurable: true
      });
      
      await renderer.loadModel('test-models/multi-lod.glb', 'complete');
      
      // Should automatically select lower LOD
      const currentLOD = renderer.getCurrentLOD();
      expect(currentLOD).toBeLessThan(1.0);
    });

    test('should compress textures when memory is limited', async () => {
      const beforeLoad = getMemoryUsage();
      
      await renderer.loadModel('test-models/high-res-textures.glb', 'complete');
      
      const afterLoad = getMemoryUsage();
      const memoryUsed = afterLoad - beforeLoad;
      
      // Should use compressed textures to limit memory usage
      expect(memoryUsed).toBeLessThan(200 * 1024 * 1024); // 200MB max
    });

    test('should implement texture streaming for zoom', async () => {
      await renderer.loadModel('test-models/streaming-textures.glb', 'complete');
      
      const camera = renderer.getCamera();
      const initialMemory = getMemoryUsage();
      
      // Zoom in to trigger high-res texture loading
      camera.position.z = 1;
      renderer.render();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const zoomedMemory = getMemoryUsage();
      
      // Zoom out to trigger texture unloading
      camera.position.z = 100;
      renderer.render();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const zoomedOutMemory = getMemoryUsage();
      
      // Memory should decrease when zooming out
      expect(zoomedOutMemory).toBeLessThan(zoomedMemory);
    });
  });

  describe('Garbage Collection Monitoring', () => {
    test('should trigger cleanup when memory pressure is high', async () => {
      // Fill memory with test data
      const testData = [];
      for (let i = 0; i < 100; i++) {
        testData.push(new ArrayBuffer(1024 * 1024)); // 1MB each
      }
      
      const beforeCleanup = getMemoryUsage();
      
      // Trigger memory pressure cleanup
      renderer.handleMemoryPressure();
      
      if (global.gc) {
        global.gc();
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const afterCleanup = getMemoryUsage();
      
      // Should have freed some memory
      expect(afterCleanup).toBeLessThan(beforeCleanup);
    });

    test('should monitor memory usage continuously', async () => {
      const memoryMonitor = renderer.getMemoryMonitor();
      
      await renderer.loadModel('test-models/memory-test.glb', 'complete');
      
      // Monitor for 1 second
      const measurements = [];
      const startTime = Date.now();
      
      while (Date.now() - startTime < 1000) {
        measurements.push(memoryMonitor.getCurrentUsage());
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Should have collected measurements
      expect(measurements.length).toBeGreaterThan(5);
      
      // Memory usage should be tracked
      measurements.forEach(measurement => {
        expect(measurement.heapUsed).toBeGreaterThan(0);
        expect(measurement.heapTotal).toBeGreaterThan(0);
      });
    });
  });

  function getMemoryUsage() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    // Fallback for environments without memory API
    return process.memoryUsage ? process.memoryUsage().heapUsed : 0;
  }
});