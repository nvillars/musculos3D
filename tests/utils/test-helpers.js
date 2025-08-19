/**
 * Test utilities and helpers for anatomical 3D viewer testing
 */

import * as THREE from 'three';

export class TestHelpers {
  /**
   * Create a mock WebGL context for testing
   */
  static createMockWebGLContext() {
    const mockContext = {
      canvas: document.createElement('canvas'),
      drawingBufferWidth: 800,
      drawingBufferHeight: 600,
      
      // WebGL constants
      VERTEX_SHADER: 35633,
      FRAGMENT_SHADER: 35632,
      COMPILE_STATUS: 35713,
      LINK_STATUS: 35714,
      ARRAY_BUFFER: 34962,
      STATIC_DRAW: 35044,
      TRIANGLES: 4,
      COLOR_BUFFER_BIT: 16384,
      DEPTH_BUFFER_BIT: 256,
      DEPTH_TEST: 2929,
      LEQUAL: 515,
      
      // Mock methods
      getExtension: jest.fn(() => ({})),
      getParameter: jest.fn(() => 'Mock WebGL'),
      createShader: jest.fn(() => ({})),
      shaderSource: jest.fn(),
      compileShader: jest.fn(),
      getShaderParameter: jest.fn(() => true),
      createProgram: jest.fn(() => ({})),
      attachShader: jest.fn(),
      linkProgram: jest.fn(),
      getProgramParameter: jest.fn(() => true),
      useProgram: jest.fn(),
      createBuffer: jest.fn(() => ({})),
      bindBuffer: jest.fn(),
      bufferData: jest.fn(),
      getAttribLocation: jest.fn(() => 0),
      enableVertexAttribArray: jest.fn(),
      vertexAttribPointer: jest.fn(),
      getUniformLocation: jest.fn(() => ({})),
      uniformMatrix4fv: jest.fn(),
      uniform3fv: jest.fn(),
      drawArrays: jest.fn(),
      clear: jest.fn(),
      clearColor: jest.fn(),
      enable: jest.fn(),
      depthFunc: jest.fn(),
      viewport: jest.fn(),
      createTexture: jest.fn(() => ({})),
      bindTexture: jest.fn(),
      texImage2D: jest.fn(),
      texParameteri: jest.fn(),
      generateMipmap: jest.fn(),
    };
    
    return mockContext;
  }

  /**
   * Create a test 3D model for testing
   */
  static createTestModel(type = 'basic') {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.userData = {
      id: `test-${type}-model`,
      system: 'test',
      structures: ['test-structure-1', 'test-structure-2']
    };
    
    return mesh;
  }

  /**
   * Create mock model data for API testing
   */
  static createMockModelData(id, system = 'musculoskeletal') {
    return {
      id,
      name: `Test ${id}`,
      system,
      url: `https://example.com/models/${id}.glb`,
      metadata: {
        structures: [`${id}_structure_1`, `${id}_structure_2`],
        layers: ['skin', 'muscle', 'bone'],
        size: 1024 * 1024, // 1MB
        quality: 'high'
      },
      created: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Simulate user interactions for testing
   */
  static simulateMouseEvent(element, type, options = {}) {
    const event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: options.x || 100,
      clientY: options.y || 100,
      button: options.button || 0,
      ...options
    });
    
    element.dispatchEvent(event);
    return event;
  }

  /**
   * Simulate touch events for mobile testing
   */
  static simulateTouchEvent(element, type, touches = []) {
    const defaultTouch = {
      identifier: 0,
      clientX: 100,
      clientY: 100,
      pageX: 100,
      pageY: 100,
      screenX: 100,
      screenY: 100,
      target: element
    };
    
    const touchList = touches.length > 0 ? touches : [defaultTouch];
    
    const event = new TouchEvent(type, {
      bubbles: true,
      cancelable: true,
      touches: touchList,
      targetTouches: touchList,
      changedTouches: touchList
    });
    
    element.dispatchEvent(event);
    return event;
  }

  /**
   * Wait for condition with timeout
   */
  static async waitForCondition(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Measure performance of a function
   */
  static async measurePerformance(fn, iterations = 1) {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }
    
    return {
      min: Math.min(...times),
      max: Math.max(...times),
      avg: times.reduce((a, b) => a + b) / times.length,
      total: times.reduce((a, b) => a + b),
      times
    };
  }

  /**
   * Create mock IndexedDB for cache testing
   */
  static createMockIndexedDB() {
    const mockDB = {
      data: new Map(),
      
      open: jest.fn(() => Promise.resolve({
        transaction: jest.fn(() => ({
          objectStore: jest.fn(() => ({
            get: jest.fn((key) => ({
              onsuccess: null,
              result: mockDB.data.get(key)
            })),
            put: jest.fn((value, key) => {
              mockDB.data.set(key, value);
              return { onsuccess: null };
            }),
            delete: jest.fn((key) => {
              mockDB.data.delete(key);
              return { onsuccess: null };
            }),
            clear: jest.fn(() => {
              mockDB.data.clear();
              return { onsuccess: null };
            })
          }))
        }))
      }))
    };
    
    return mockDB;
  }

  /**
   * Generate test data for stress testing
   */
  static generateStressTestData(size = 1000) {
    const data = [];
    
    for (let i = 0; i < size; i++) {
      data.push({
        id: `stress-test-${i}`,
        geometry: new Float32Array(1000), // Simulate geometry data
        material: {
          color: Math.random() * 0xffffff,
          opacity: Math.random()
        },
        position: [
          Math.random() * 100 - 50,
          Math.random() * 100 - 50,
          Math.random() * 100 - 50
        ]
      });
    }
    
    return data;
  }

  /**
   * Mock fetch for API testing
   */
  static mockFetch(responses = {}) {
    const originalFetch = global.fetch;
    
    global.fetch = jest.fn((url, options) => {
      const response = responses[url] || responses.default;
      
      if (!response) {
        return Promise.reject(new Error(`No mock response for ${url}`));
      }
      
      if (response.error) {
        return Promise.reject(new Error(response.error));
      }
      
      return Promise.resolve({
        ok: response.status < 400,
        status: response.status || 200,
        json: () => Promise.resolve(response.data),
        text: () => Promise.resolve(JSON.stringify(response.data)),
        blob: () => Promise.resolve(new Blob([JSON.stringify(response.data)])),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      });
    });
    
    return () => {
      global.fetch = originalFetch;
    };
  }

  /**
   * Create test canvas with WebGL context
   */
  static createTestCanvas(width = 800, height = 600) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    // Mock getContext to return our mock WebGL context
    const originalGetContext = canvas.getContext;
    canvas.getContext = jest.fn((type) => {
      if (type === 'webgl' || type === 'experimental-webgl') {
        return TestHelpers.createMockWebGLContext();
      }
      return originalGetContext.call(canvas, type);
    });
    
    document.body.appendChild(canvas);
    return canvas;
  }

  /**
   * Clean up test environment
   */
  static cleanup() {
    // Remove all canvas elements
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    });
    
    // Clear any timers
    jest.clearAllTimers();
    
    // Reset mocks
    jest.clearAllMocks();
  }

  /**
   * Assert 3D object properties
   */
  static assertObject3D(object, expectedProps = {}) {
    expect(object).toBeInstanceOf(THREE.Object3D);
    
    if (expectedProps.position) {
      expect(object.position.toArray()).toEqual(
        expect.arrayContaining(expectedProps.position)
      );
    }
    
    if (expectedProps.rotation) {
      expect(object.rotation.toArray().slice(0, 3)).toEqual(
        expect.arrayContaining(expectedProps.rotation)
      );
    }
    
    if (expectedProps.scale) {
      expect(object.scale.toArray()).toEqual(
        expect.arrayContaining(expectedProps.scale)
      );
    }
    
    if (expectedProps.visible !== undefined) {
      expect(object.visible).toBe(expectedProps.visible);
    }
  }

  /**
   * Assert performance metrics
   */
  static assertPerformance(metrics, thresholds = {}) {
    if (thresholds.maxTime) {
      expect(metrics.max).toBeLessThan(thresholds.maxTime);
    }
    
    if (thresholds.avgTime) {
      expect(metrics.avg).toBeLessThan(thresholds.avgTime);
    }
    
    if (thresholds.minFPS) {
      const minFrameTime = 1000 / thresholds.minFPS;
      expect(metrics.avg).toBeLessThan(minFrameTime);
    }
  }
}

export default TestHelpers;