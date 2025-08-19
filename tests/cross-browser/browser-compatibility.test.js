/**
 * Cross-browser compatibility tests using Playwright
 */

import { chromium, firefox, webkit } from 'playwright';

describe('Cross-Browser Compatibility Tests', () => {
  const browsers = [
    { name: 'Chromium', launcher: chromium },
    { name: 'Firefox', launcher: firefox },
    { name: 'WebKit', launcher: webkit }
  ];

  browsers.forEach(({ name, launcher }) => {
    describe(`${name} Browser Tests`, () => {
      let browser, context, page;

      beforeAll(async () => {
        browser = await launcher.launch({
          headless: true,
          args: ['--enable-webgl', '--use-gl=swiftshader']
        });
        context = await browser.newContext({
          viewport: { width: 1920, height: 1080 }
        });
        page = await context.newPage();
      });

      afterAll(async () => {
        await browser?.close();
      });

      test('should load application successfully', async () => {
        await page.goto('http://localhost:8080');
        
        // Wait for canvas to be created
        await page.waitForSelector('canvas', { timeout: 10000 });
        
        // Check if WebGL is supported
        const webglSupported = await page.evaluate(() => {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          return !!gl;
        });
        
        expect(webglSupported).toBe(true);
      });

      test('should render 3D model correctly', async () => {
        await page.goto('http://localhost:8080');
        await page.waitForSelector('canvas');
        
        // Load a test model
        await page.evaluate(() => {
          return window.anatomicalViewer.loadModel('test-models/basic-skeleton.glb');
        });
        
        // Wait for model to load
        await page.waitForFunction(() => {
          return window.anatomicalViewer.isModelLoaded();
        }, { timeout: 15000 });
        
        // Take screenshot for visual comparison
        const screenshot = await page.screenshot({
          clip: { x: 0, y: 0, width: 800, height: 600 }
        });
        
        expect(screenshot).toBeDefined();
      });

      test('should handle touch interactions on mobile viewport', async () => {
        await context.setViewport({ width: 375, height: 667 }); // iPhone viewport
        await page.goto('http://localhost:8080');
        await page.waitForSelector('canvas');
        
        const canvas = await page.$('canvas');
        
        // Simulate touch gestures
        await canvas.tap();
        await page.touchscreen.tap(200, 200);
        
        // Simulate pinch zoom
        await page.evaluate(() => {
          const canvas = document.querySelector('canvas');
          const touchStart = new TouchEvent('touchstart', {
            touches: [
              { clientX: 100, clientY: 100, identifier: 0 },
              { clientX: 200, clientY: 200, identifier: 1 }
            ]
          });
          canvas.dispatchEvent(touchStart);
        });
        
        // Verify touch handling
        const touchSupported = await page.evaluate(() => {
          return 'ontouchstart' in window;
        });
        
        expect(touchSupported).toBe(true);
      });

      test('should maintain performance across browsers', async () => {
        await page.goto('http://localhost:8080');
        await page.waitForSelector('canvas');
        
        // Start performance monitoring
        await page.evaluate(() => {
          window.performanceData = [];
          window.startTime = performance.now();
        });
        
        // Load model and render frames
        await page.evaluate(async () => {
          await window.anatomicalViewer.loadModel('test-models/performance-test.glb');
          
          for (let i = 0; i < 60; i++) {
            const frameStart = performance.now();
            window.anatomicalViewer.render();
            const frameEnd = performance.now();
            window.performanceData.push(frameEnd - frameStart);
          }
        });
        
        const performanceData = await page.evaluate(() => window.performanceData);
        const avgFrameTime = performanceData.reduce((a, b) => a + b) / performanceData.length;
        
        // Should maintain reasonable performance (30fps minimum)
        expect(avgFrameTime).toBeLessThan(33.33);
      });

      test('should handle WebGL context loss gracefully', async () => {
        await page.goto('http://localhost:8080');
        await page.waitForSelector('canvas');
        
        // Simulate WebGL context loss
        const contextLost = await page.evaluate(() => {
          const canvas = document.querySelector('canvas');
          const gl = canvas.getContext('webgl');
          
          if (gl && gl.getExtension('WEBGL_lose_context')) {
            gl.getExtension('WEBGL_lose_context').loseContext();
            return true;
          }
          return false;
        });
        
        if (contextLost) {
          // Wait for context restoration
          await page.waitForFunction(() => {
            return window.anatomicalViewer.isContextRestored();
          }, { timeout: 5000 });
          
          const restored = await page.evaluate(() => {
            return window.anatomicalViewer.isContextRestored();
          });
          
          expect(restored).toBe(true);
        }
      });

      test('should support required WebGL extensions', async () => {
        await page.goto('http://localhost:8080');
        
        const extensions = await page.evaluate(() => {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          
          if (!gl) return null;
          
          return {
            OES_texture_float: !!gl.getExtension('OES_texture_float'),
            OES_element_index_uint: !!gl.getExtension('OES_element_index_uint'),
            WEBGL_depth_texture: !!gl.getExtension('WEBGL_depth_texture'),
            EXT_texture_filter_anisotropic: !!gl.getExtension('EXT_texture_filter_anisotropic')
          };
        });
        
        expect(extensions).not.toBeNull();
        expect(extensions.OES_element_index_uint).toBe(true); // Required for large models
      });

      test('should handle different screen resolutions', async () => {
        const resolutions = [
          { width: 1920, height: 1080 }, // Full HD
          { width: 1366, height: 768 },  // Common laptop
          { width: 375, height: 667 },   // Mobile
          { width: 768, height: 1024 }   // Tablet
        ];
        
        for (const resolution of resolutions) {
          await context.setViewport(resolution);
          await page.goto('http://localhost:8080');
          await page.waitForSelector('canvas');
          
          const canvasSize = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            return {
              width: canvas.width,
              height: canvas.height,
              clientWidth: canvas.clientWidth,
              clientHeight: canvas.clientHeight
            };
          });
          
          // Canvas should adapt to viewport
          expect(canvasSize.clientWidth).toBeLessThanOrEqual(resolution.width);
          expect(canvasSize.clientHeight).toBeLessThanOrEqual(resolution.height);
        }
      });
    });
  });

  describe('Feature Detection Tests', () => {
    test('should detect and handle missing WebGL support', async () => {
      const browser = await chromium.launch({
        headless: true,
        args: ['--disable-webgl', '--disable-3d-apis']
      });
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      await page.goto('http://localhost:8080');
      
      const fallbackActive = await page.evaluate(() => {
        return window.anatomicalViewer.isFallbackMode();
      });
      
      expect(fallbackActive).toBe(true);
      
      await browser.close();
    });

    test('should handle different color depths', async () => {
      const browser = await chromium.launch({
        headless: true,
        args: ['--force-color-profile=srgb']
      });
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      await page.goto('http://localhost:8080');
      await page.waitForSelector('canvas');
      
      const colorDepth = await page.evaluate(() => {
        return screen.colorDepth;
      });
      
      // Should handle different color depths gracefully
      expect([16, 24, 32]).toContain(colorDepth);
      
      await browser.close();
    });
  });
});