// Jest setup file for testing environment
// Mock WebGL context for testing Three.js components

import { TestHelpers } from './utils/test-helpers.js';

// Mock canvas and WebGL context
global.HTMLCanvasElement.prototype.getContext = jest.fn((type) => {
  if (type === 'webgl' || type === 'experimental-webgl') {
    return TestHelpers.createMockWebGLContext();
  }
  
  // 2D context mock
  return {
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({
      data: new Array(4)
    })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => []),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
  };
});

// Mock WebGL context
global.WebGLRenderingContext = TestHelpers.createMockWebGLContext;

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock performance API
global.performance = global.performance || {};
global.performance.now = global.performance.now || jest.fn(() => Date.now());
global.performance.memory = global.performance.memory || {
  usedJSHeapSize: 50 * 1024 * 1024,
  totalJSHeapSize: 100 * 1024 * 1024,
  jsHeapSizeLimit: 2 * 1024 * 1024 * 1024
};

// Mock IndexedDB
global.indexedDB = {
  open: jest.fn(() => ({
    onsuccess: null,
    onerror: null,
    result: {
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          get: jest.fn(),
          put: jest.fn(),
          delete: jest.fn(),
          clear: jest.fn()
        }))
      }))
    }
  }))
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
  })
);

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Setup cleanup after each test
afterEach(() => {
  TestHelpers.cleanup();
});

// Global test timeout
jest.setTimeout(30000);