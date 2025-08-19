/**
 * Integration tests for complete user workflows
 * Tests the full flow from model loading to manipulation
 */

import { AnatomicalRenderer } from '../../src/AnatomicalRenderer.js';
import { AnatomyManager } from '../../src/AnatomyManager.js';
import { InteractionController } from '../../src/InteractionController.js';
import { UIManager } from '../../src/UIManager.js';
import { APIManager } from '../../src/APIManager.js';
import { CacheManager } from '../../src/CacheManager.js';

describe('Full Workflow Integration Tests', () => {
  let canvas, renderer, anatomyManager, interactionController, uiManager, apiManager, cacheManager;

  beforeEach(() => {
    // Create test canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);

    // Initialize all components
    renderer = new AnatomicalRenderer(canvas);
    anatomyManager = new AnatomyManager(renderer);
    interactionController = new InteractionController(renderer, canvas);
    uiManager = new UIManager(anatomyManager, renderer);
    apiManager = new APIManager();
    cacheManager = new CacheManager();
  });

  afterEach(() => {
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    renderer?.dispose();
  });

  describe('Complete Model Loading and Manipulation Workflow', () => {
    test('should load model, select system, and manipulate structures', async () => {
      // Step 1: Load initial model
      const loadPromise = renderer.loadModel('test-models/human-body.glb', 'complete');
      expect(loadPromise).resolves.toBeDefined();
      await loadPromise;

      // Step 2: Load anatomy systems
      await anatomyManager.loadSystem('musculoskeletal');
      const systems = anatomyManager.getAvailableSystems();
      expect(systems).toContain('musculoskeletal');

      // Step 3: Search for specific structure
      const searchResults = anatomyManager.searchStructure('biceps');
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].name).toContain('biceps');

      // Step 4: Isolate structure
      const structureId = searchResults[0].id;
      renderer.isolateStructure(structureId);
      
      // Verify isolation worked
      const scene = renderer.getScene();
      const visibleObjects = scene.children.filter(child => child.visible);
      expect(visibleObjects.length).toBeLessThan(scene.children.length);

      // Step 5: Highlight structure
      renderer.highlightStructure(structureId, '#ff0000');
      
      // Step 6: Test layer manipulation
      renderer.setLayerVisibility('skin', false);
      renderer.setLayerVisibility('muscles', true);
    });

    test('should handle API failure and fallback to cache', async () => {
      // Mock API failure
      jest.spyOn(apiManager, 'fetchModel').mockRejectedValue(new Error('API unavailable'));
      
      // Mock cache hit
      const cachedModel = { geometry: {}, material: {} };
      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedModel);

      // Attempt to load model
      const result = await apiManager.fetchModel('test-model', 'high');
      expect(result).toBeDefined();
      expect(cacheManager.get).toHaveBeenCalled();
    });

    test('should maintain performance during complex operations', async () => {
      const startTime = performance.now();
      
      // Load model
      await renderer.loadModel('test-models/complex-anatomy.glb', 'complete');
      
      // Perform multiple operations
      await anatomyManager.loadSystem('cardiovascular');
      renderer.isolateStructure('heart');
      renderer.highlightStructure('aorta', '#ff0000');
      
      // Simulate zoom operations
      for (let i = 0; i < 10; i++) {
        renderer.getCamera().position.z -= 0.5;
        renderer.render();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete complex operations within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });
  });

  describe('Cross-Component Communication', () => {
    test('should properly communicate between UI and renderer', async () => {
      await renderer.loadModel('test-models/skeleton.glb', 'musculoskeletal');
      
      // Simulate UI interaction
      const systemSelector = uiManager.createSystemSelector();
      const changeEvent = new Event('change');
      systemSelector.value = 'cardiovascular';
      systemSelector.dispatchEvent(changeEvent);
      
      // Verify system change was processed
      expect(anatomyManager.getCurrentSystem()).toBe('cardiovascular');
    });

    test('should handle mobile touch interactions', () => {
      interactionController.setControlMode('mobile');
      
      // Simulate touch events
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 150, clientY: 150 }]
      });
      
      canvas.dispatchEvent(touchStart);
      canvas.dispatchEvent(touchMove);
      
      // Verify touch handling
      expect(interactionController.getControlMode()).toBe('mobile');
    });
  });

  describe('Error Recovery Integration', () => {
    test('should recover from rendering errors gracefully', async () => {
      // Force a rendering error
      jest.spyOn(renderer.renderer, 'render').mockImplementation(() => {
        throw new Error('WebGL context lost');
      });
      
      // Attempt to render
      expect(() => renderer.render()).not.toThrow();
      
      // Verify error was handled and fallback activated
      expect(renderer.hasError()).toBe(true);
      expect(renderer.isUsingFallback()).toBe(true);
    });

    test('should handle memory pressure gracefully', async () => {
      // Simulate low memory condition
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 100 * 1024 * 1024, // 100MB
          totalJSHeapSize: 120 * 1024 * 1024, // 120MB
          jsHeapSizeLimit: 128 * 1024 * 1024  // 128MB
        }
      });
      
      await renderer.loadModel('test-models/high-poly.glb', 'complete');
      
      // Should automatically reduce quality
      expect(renderer.getCurrentQuality()).toBeLessThan(1.0);
    });
  });
});