/**
 * End-to-end tests for complete user workflows
 */

import { chromium } from 'playwright';

describe('End-to-End User Workflows', () => {
  let browser, context, page;

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: false, // Set to true for CI
      slowMo: 100 // Slow down for better visibility
    });
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    page = await context.newPage();
  });

  afterAll(async () => {
    await browser?.close();
  });

  beforeEach(async () => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('canvas', { timeout: 10000 });
  });

  describe('Medical Student Learning Workflow', () => {
    test('should complete full anatomy exploration session', async () => {
      // Step 1: Load application and verify initial state
      const title = await page.title();
      expect(title).toContain('Anatomical 3D Viewer');

      // Step 2: Select musculoskeletal system
      await page.click('[data-testid="system-selector"]');
      await page.click('[data-testid="system-musculoskeletal"]');
      
      // Wait for system to load
      await page.waitForFunction(() => {
        return window.anatomicalViewer.getCurrentSystem() === 'musculoskeletal';
      });

      // Step 3: Search for specific structure
      await page.fill('[data-testid="search-input"]', 'biceps');
      await page.waitForSelector('[data-testid="search-results"]');
      
      const searchResults = await page.$$('[data-testid="search-result-item"]');
      expect(searchResults.length).toBeGreaterThan(0);

      // Step 4: Select and isolate structure
      await page.click('[data-testid="search-result-item"]:first-child');
      await page.click('[data-testid="isolate-button"]');

      // Verify isolation
      const isIsolated = await page.evaluate(() => {
        return window.anatomicalViewer.isStructureIsolated('biceps_brachii');
      });
      expect(isIsolated).toBe(true);

      // Step 5: Examine structure details
      await page.click('[data-testid="info-panel-toggle"]');
      const structureInfo = await page.textContent('[data-testid="structure-info"]');
      expect(structureInfo).toContain('Biceps');

      // Step 6: Use layer controls
      await page.click('[data-testid="layer-controls"]');
      await page.click('[data-testid="hide-skin-layer"]');
      
      const skinHidden = await page.evaluate(() => {
        return !window.anatomicalViewer.isLayerVisible('skin');
      });
      expect(skinHidden).toBe(true);

      // Step 7: Zoom and examine details
      const canvas = await page.$('canvas');
      await canvas.hover();
      
      // Simulate mouse wheel zoom
      await page.mouse.wheel(0, -500); // Zoom in
      
      // Verify zoom level changed
      const zoomLevel = await page.evaluate(() => {
        return window.anatomicalViewer.getZoomLevel();
      });
      expect(zoomLevel).toBeGreaterThan(1);
    });

    test('should handle mobile learning workflow', async () => {
      // Switch to mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForSelector('canvas');

      // Verify mobile UI is active
      const mobileUI = await page.isVisible('[data-testid="mobile-controls"]');
      expect(mobileUI).toBe(true);

      // Test touch interactions
      const canvas = await page.$('canvas');
      
      // Single tap to select
      await canvas.tap();
      
      // Pinch to zoom
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        const touchStart = new TouchEvent('touchstart', {
          touches: [
            { clientX: 100, clientY: 100, identifier: 0 },
            { clientX: 200, clientY: 200, identifier: 1 }
          ]
        });
        
        const touchMove = new TouchEvent('touchmove', {
          touches: [
            { clientX: 80, clientY: 80, identifier: 0 },
            { clientX: 220, clientY: 220, identifier: 1 }
          ]
        });
        
        canvas.dispatchEvent(touchStart);
        canvas.dispatchEvent(touchMove);
      });

      // Verify zoom response
      await page.waitForTimeout(500);
      const zoomChanged = await page.evaluate(() => {
        return window.anatomicalViewer.getZoomLevel() !== 1;
      });
      expect(zoomChanged).toBe(true);
    });
  });

  describe('Educator Teaching Workflow', () => {
    test('should prepare and present anatomy lesson', async () => {
      // Step 1: Load cardiovascular system for lesson
      await page.click('[data-testid="system-selector"]');
      await page.click('[data-testid="system-cardiovascular"]');
      
      await page.waitForFunction(() => {
        return window.anatomicalViewer.getCurrentSystem() === 'cardiovascular';
      });

      // Step 2: Create custom view for presentation
      await page.click('[data-testid="view-controls"]');
      await page.click('[data-testid="front-view"]');
      
      // Step 3: Highlight key structures for lesson
      const structures = ['heart', 'aorta', 'vena_cava'];
      
      for (const structure of structures) {
        await page.click(`[data-testid="structure-${structure}"]`);
        await page.click('[data-testid="highlight-button"]');
        
        const isHighlighted = await page.evaluate((structureId) => {
          return window.anatomicalViewer.isStructureHighlighted(structureId);
        }, structure);
        expect(isHighlighted).toBe(true);
      }

      // Step 4: Use presentation mode
      await page.click('[data-testid="presentation-mode"]');
      
      const presentationActive = await page.evaluate(() => {
        return window.anatomicalViewer.isPresentationMode();
      });
      expect(presentationActive).toBe(true);

      // Step 5: Navigate through lesson steps
      await page.click('[data-testid="next-step"]');
      await page.click('[data-testid="next-step"]');
      
      const currentStep = await page.evaluate(() => {
        return window.anatomicalViewer.getCurrentPresentationStep();
      });
      expect(currentStep).toBe(2);
    });

    test('should demonstrate layer dissection', async () => {
      // Load complete anatomy model
      await page.click('[data-testid="load-complete-model"]');
      await page.waitForFunction(() => {
        return window.anatomicalViewer.isModelLoaded();
      }, { timeout: 15000 });

      // Start dissection demonstration
      await page.click('[data-testid="dissection-mode"]');
      
      // Remove layers progressively
      const layers = ['skin', 'fat', 'superficial_muscle', 'deep_muscle'];
      
      for (let i = 0; i < layers.length; i++) {
        await page.click(`[data-testid="remove-layer-${layers[i]}"]`);
        
        // Wait for animation to complete
        await page.waitForTimeout(1000);
        
        const layerVisible = await page.evaluate((layer) => {
          return window.anatomicalViewer.isLayerVisible(layer);
        }, layers[i]);
        expect(layerVisible).toBe(false);
      }

      // Verify skeleton is now visible
      const skeletonVisible = await page.evaluate(() => {
        return window.anatomicalViewer.isLayerVisible('skeleton');
      });
      expect(skeletonVisible).toBe(true);
    });
  });

  describe('Researcher Analysis Workflow', () => {
    test('should perform detailed structural analysis', async () => {
      // Load high-resolution research model
      await page.click('[data-testid="quality-selector"]');
      await page.click('[data-testid="quality-ultra"]');
      
      await page.waitForFunction(() => {
        return window.anatomicalViewer.getCurrentQuality() === 'ultra';
      });

      // Search for specific research target
      await page.fill('[data-testid="search-input"]', 'anterior cruciate ligament');
      await page.click('[data-testid="search-button"]');
      
      await page.waitForSelector('[data-testid="search-results"]');
      await page.click('[data-testid="search-result-item"]:first-child');

      // Isolate for detailed examination
      await page.click('[data-testid="isolate-button"]');
      
      // Enable measurement tools
      await page.click('[data-testid="measurement-tools"]');
      await page.click('[data-testid="distance-measurement"]');
      
      // Take measurements
      const canvas = await page.$('canvas');
      await canvas.click({ position: { x: 200, y: 200 } });
      await canvas.click({ position: { x: 300, y: 250 } });
      
      // Verify measurement was recorded
      const measurements = await page.evaluate(() => {
        return window.anatomicalViewer.getMeasurements();
      });
      expect(measurements.length).toBeGreaterThan(0);

      // Export data for analysis
      await page.click('[data-testid="export-data"]');
      await page.click('[data-testid="export-measurements"]');
      
      // Verify export initiated
      const exportStarted = await page.evaluate(() => {
        return window.anatomicalViewer.isExporting();
      });
      expect(exportStarted).toBe(true);
    });
  });

  describe('Error Recovery Workflows', () => {
    test('should recover from network interruption', async () => {
      // Start loading a model
      await page.click('[data-testid="load-large-model"]');
      
      // Simulate network interruption
      await page.route('**/*.glb', route => route.abort());
      
      // Wait for error handling
      await page.waitForSelector('[data-testid="error-message"]', { timeout: 10000 });
      
      const errorMessage = await page.textContent('[data-testid="error-message"]');
      expect(errorMessage).toContain('network');

      // Restore network and retry
      await page.unroute('**/*.glb');
      await page.click('[data-testid="retry-button"]');
      
      // Verify recovery
      await page.waitForFunction(() => {
        return window.anatomicalViewer.isModelLoaded();
      }, { timeout: 15000 });
      
      const modelLoaded = await page.evaluate(() => {
        return window.anatomicalViewer.isModelLoaded();
      });
      expect(modelLoaded).toBe(true);
    });

    test('should handle WebGL context loss', async () => {
      // Force WebGL context loss
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        const gl = canvas.getContext('webgl');
        if (gl && gl.getExtension('WEBGL_lose_context')) {
          gl.getExtension('WEBGL_lose_context').loseContext();
        }
      });

      // Wait for context loss handling
      await page.waitForSelector('[data-testid="context-lost-message"]');
      
      // Verify fallback mode is active
      const fallbackActive = await page.evaluate(() => {
        return window.anatomicalViewer.isFallbackMode();
      });
      expect(fallbackActive).toBe(true);

      // Restore context
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        const gl = canvas.getContext('webgl');
        if (gl && gl.getExtension('WEBGL_lose_context')) {
          gl.getExtension('WEBGL_lose_context').restoreContext();
        }
      });

      // Wait for context restoration
      await page.waitForFunction(() => {
        return !window.anatomicalViewer.isFallbackMode();
      }, { timeout: 5000 });
      
      const contextRestored = await page.evaluate(() => {
        return !window.anatomicalViewer.isFallbackMode();
      });
      expect(contextRestored).toBe(true);
    });
  });

  describe('Performance Under Load', () => {
    test('should maintain responsiveness with multiple operations', async () => {
      // Load complex model
      await page.click('[data-testid="load-complete-anatomy"]');
      await page.waitForFunction(() => {
        return window.anatomicalViewer.isModelLoaded();
      }, { timeout: 20000 });

      // Perform rapid operations
      const operations = [
        () => page.click('[data-testid="system-musculoskeletal"]'),
        () => page.click('[data-testid="system-cardiovascular"]'),
        () => page.click('[data-testid="system-nervous"]'),
        () => page.click('[data-testid="isolate-button"]'),
        () => page.click('[data-testid="highlight-button"]'),
        () => page.click('[data-testid="reset-view"]')
      ];

      const startTime = Date.now();
      
      for (let i = 0; i < 20; i++) {
        const operation = operations[i % operations.length];
        await operation();
        await page.waitForTimeout(100); // Brief pause between operations
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should complete operations within reasonable time
      expect(totalTime).toBeLessThan(10000); // 10 seconds max
      
      // Verify application is still responsive
      const isResponsive = await page.evaluate(() => {
        return window.anatomicalViewer.isResponsive();
      });
      expect(isResponsive).toBe(true);
    });
  });
});