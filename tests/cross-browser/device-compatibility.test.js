/**
 * Device Compatibility Tests
 * Tests application behavior across different devices and screen sizes
 */

import { jest } from '@jest/globals';
import AnatomicalApp from '../../src/AnatomicalApp.js';
import { createMockCanvas, mockThreeJS } from '../utils/test-helpers.js';

// Mock Three.js
mockThreeJS();

describe('Device Compatibility Tests', () => {
    let app;
    let originalUserAgent;
    let originalScreen;
    let originalDevicePixelRatio;
    
    beforeEach(() => {
        // Store original values
        originalUserAgent = navigator.userAgent;
        originalScreen = window.screen;
        originalDevicePixelRatio = window.devicePixelRatio;
        
        // Setup DOM
        document.body.innerHTML = `
            <canvas id="anatomical-canvas"></canvas>
            <div id="loading-overlay"></div>
            <div id="error-message"></div>
            <div id="loading-text"></div>
            <div id="loading-progress"></div>
            <div id="error-text"></div>
        `;
        
        // Mock WebGL
        const canvas = document.getElementById('anatomical-canvas');
        canvas.getContext = jest.fn(() => ({
            getParameter: jest.fn(),
            getExtension: jest.fn(),
            createShader: jest.fn(),
            createProgram: jest.fn(),
            useProgram: jest.fn(),
            enable: jest.fn(),
            disable: jest.fn(),
            clear: jest.fn(),
            clearColor: jest.fn(),
            viewport: jest.fn()
        }));
        
        // Mock fetch
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
        });
        
        // Mock IndexedDB
        global.indexedDB = {
            open: jest.fn().mockResolvedValue({
                result: {
                    createObjectStore: jest.fn(),
                    transaction: jest.fn().mockReturnValue({
                        objectStore: jest.fn().mockReturnValue({
                            add: jest.fn(),
                            get: jest.fn(),
                            delete: jest.fn(),
                            clear: jest.fn()
                        })
                    })
                }
            })
        };
        
        // Mock performance
        global.performance = {
            now: jest.fn(() => Date.now()),
            memory: {
                usedJSHeapSize: 50 * 1024 * 1024,
                totalJSHeapSize: 100 * 1024 * 1024,
                jsHeapSizeLimit: 2 * 1024 * 1024 * 1024
            }
        };
    });
    
    afterEach(() => {
        if (app) {
            app.destroy();
        }
        
        // Restore original values
        Object.defineProperty(navigator, 'userAgent', {
            value: originalUserAgent,
            configurable: true
        });
        Object.defineProperty(window, 'screen', {
            value: originalScreen,
            configurable: true
        });
        Object.defineProperty(window, 'devicePixelRatio', {
            value: originalDevicePixelRatio,
            configurable: true
        });
        
        jest.clearAllMocks();
    });

    describe('Mobile Device Tests', () => {
        beforeEach(() => {
            // Mock mobile user agent
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
                configurable: true
            });
            
            // Mock mobile screen
            Object.defineProperty(window, 'screen', {
                value: { width: 375, height: 667 },
                configurable: true
            });
            
            // Mock high DPI
            Object.defineProperty(window, 'devicePixelRatio', {
                value: 2,
                configurable: true
            });
            
            // Mock device memory (low-end mobile)
            Object.defineProperty(navigator, 'deviceMemory', {
                value: 2,
                configurable: true
            });
        });
        
        test('should detect mobile device and adjust settings', async () => {
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            const deviceInfo = app.getDeviceInfo();
            
            expect(deviceInfo.screenWidth).toBe(375);
            expect(deviceInfo.screenHeight).toBe(667);
            expect(deviceInfo.devicePixelRatio).toBe(2);
            expect(deviceInfo.memory).toBe(2);
            expect(deviceInfo.performanceLevel).toBe('low');
        });
        
        test('should set mobile control mode', async () => {
            // Mock window dimensions
            Object.defineProperty(window, 'innerWidth', {
                value: 375,
                configurable: true
            });
            
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            // Verify mobile controls are set
            expect(app.renderer.setControlMode).toHaveBeenCalledWith('mobile');
        });
        
        test('should reduce quality for low-end mobile devices', async () => {
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            await app.optimizeForDevice();
            
            // Verify quality reduction
            expect(app.renderer.setQualityLevel).toHaveBeenCalledWith('low');
        });
        
        test('should handle touch events', async () => {
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            // Simulate touch event
            const touchEvent = new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 100 }]
            });
            
            const canvas = document.getElementById('anatomical-canvas');
            canvas.dispatchEvent(touchEvent);
            
            // Verify touch handling is enabled
            expect(app.interactionController.enableTouchControls).toHaveBeenCalled();
        });
    });

    describe('Tablet Device Tests', () => {
        beforeEach(() => {
            // Mock tablet user agent
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
                configurable: true
            });
            
            // Mock tablet screen
            Object.defineProperty(window, 'screen', {
                value: { width: 768, height: 1024 },
                configurable: true
            });
            
            Object.defineProperty(window, 'innerWidth', {
                value: 768,
                configurable: true
            });
            
            // Mock medium device memory
            Object.defineProperty(navigator, 'deviceMemory', {
                value: 4,
                configurable: true
            });
        });
        
        test('should detect tablet device', async () => {
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            const deviceInfo = app.getDeviceInfo();
            
            expect(deviceInfo.screenWidth).toBe(768);
            expect(deviceInfo.performanceLevel).toBe('medium');
        });
        
        test('should set tablet control mode', async () => {
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            expect(app.renderer.setControlMode).toHaveBeenCalledWith('tablet');
        });
        
        test('should use medium quality settings', async () => {
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            await app.optimizeForDevice();
            
            expect(app.renderer.setQualityLevel).toHaveBeenCalledWith('medium');
        });
    });

    describe('Desktop Device Tests', () => {
        beforeEach(() => {
            // Mock desktop user agent
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                configurable: true
            });
            
            // Mock desktop screen
            Object.defineProperty(window, 'screen', {
                value: { width: 1920, height: 1080 },
                configurable: true
            });
            
            Object.defineProperty(window, 'innerWidth', {
                value: 1920,
                configurable: true
            });
            
            // Mock high device memory
            Object.defineProperty(navigator, 'deviceMemory', {
                value: 8,
                configurable: true
            });
        });
        
        test('should detect desktop device', async () => {
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            const deviceInfo = app.getDeviceInfo();
            
            expect(deviceInfo.screenWidth).toBe(1920);
            expect(deviceInfo.performanceLevel).toBe('high');
        });
        
        test('should set desktop control mode', async () => {
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            expect(app.renderer.setControlMode).toHaveBeenCalledWith('desktop');
        });
        
        test('should use high quality settings', async () => {
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            // High-end devices should not reduce quality
            await app.optimizeForDevice();
            
            expect(app.renderer.setQualityLevel).not.toHaveBeenCalledWith('low');
        });
    });

    describe('Browser Compatibility Tests', () => {
        const browsers = [
            {
                name: 'Chrome',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            {
                name: 'Firefox',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
            },
            {
                name: 'Safari',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
            },
            {
                name: 'Edge',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
            }
        ];
        
        browsers.forEach(browser => {
            test(`should work in ${browser.name}`, async () => {
                Object.defineProperty(navigator, 'userAgent', {
                    value: browser.userAgent,
                    configurable: true
                });
                
                app = new AnatomicalApp();
                
                await new Promise(resolve => {
                    const checkInit = () => {
                        if (app.isInitialized) {
                            resolve();
                        } else {
                            setTimeout(checkInit, 10);
                        }
                    };
                    checkInit();
                });
                
                expect(app.isInitialized).toBe(true);
                
                const deviceInfo = app.getDeviceInfo();
                expect(deviceInfo.userAgent).toBe(browser.userAgent);
            });
        });
    });

    describe('WebGL Compatibility Tests', () => {
        test('should handle WebGL 1.0 support', async () => {
            const canvas = document.getElementById('anatomical-canvas');
            canvas.getContext = jest.fn((type) => {
                if (type === 'webgl' || type === 'experimental-webgl') {
                    return {
                        getParameter: jest.fn((param) => {
                            if (param === 'VERSION') return 'WebGL 1.0';
                            if (param === 'MAX_TEXTURE_SIZE') return 4096;
                            return null;
                        }),
                        getExtension: jest.fn(),
                        createShader: jest.fn(),
                        createProgram: jest.fn(),
                        useProgram: jest.fn(),
                        enable: jest.fn(),
                        disable: jest.fn(),
                        clear: jest.fn(),
                        clearColor: jest.fn(),
                        viewport: jest.fn()
                    };
                }
                return null;
            });
            
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            const deviceInfo = app.getDeviceInfo();
            expect(deviceInfo.webgl.version).toBe('WebGL 1.0');
            expect(deviceInfo.webgl.maxTextureSize).toBe(4096);
        });
        
        test('should handle WebGL 2.0 support', async () => {
            const canvas = document.getElementById('anatomical-canvas');
            canvas.getContext = jest.fn((type) => {
                if (type === 'webgl2') {
                    return {
                        getParameter: jest.fn((param) => {
                            if (param === 'VERSION') return 'WebGL 2.0';
                            if (param === 'MAX_TEXTURE_SIZE') return 8192;
                            return null;
                        }),
                        getExtension: jest.fn(),
                        createShader: jest.fn(),
                        createProgram: jest.fn(),
                        useProgram: jest.fn(),
                        enable: jest.fn(),
                        disable: jest.fn(),
                        clear: jest.fn(),
                        clearColor: jest.fn(),
                        viewport: jest.fn()
                    };
                }
                return null;
            });
            
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            const deviceInfo = app.getDeviceInfo();
            expect(deviceInfo.webgl.version).toBe('WebGL 2.0');
            expect(deviceInfo.webgl.maxTextureSize).toBe(8192);
        });
        
        test('should handle WebGL not supported', async () => {
            const canvas = document.getElementById('anatomical-canvas');
            canvas.getContext = jest.fn(() => null);
            
            app = new AnatomicalApp();
            
            // Wait for error handling
            await new Promise(resolve => setTimeout(resolve, 100));
            
            expect(app.isInitialized).toBe(false);
            
            const errorMessage = document.getElementById('error-message');
            expect(errorMessage.style.display).toBe('block');
        });
    });

    describe('Network Condition Tests', () => {
        test('should handle slow network connection', async () => {
            // Mock slow connection
            Object.defineProperty(navigator, 'connection', {
                value: {
                    effectiveType: '2g',
                    downlink: 0.5
                },
                configurable: true
            });
            
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            const deviceInfo = app.getDeviceInfo();
            expect(deviceInfo.connection.effectiveType).toBe('2g');
            expect(deviceInfo.connection.downlink).toBe(0.5);
        });
        
        test('should handle offline mode', async () => {
            // Mock offline
            Object.defineProperty(navigator, 'onLine', {
                value: false,
                configurable: true
            });
            
            // Mock fetch failure
            global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
            
            app = new AnatomicalApp({
                enableOfflineMode: true
            });
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            // Should still initialize with cached/local content
            expect(app.isInitialized).toBe(true);
        });
        
        test('should handle fast network connection', async () => {
            // Mock fast connection
            Object.defineProperty(navigator, 'connection', {
                value: {
                    effectiveType: '4g',
                    downlink: 10
                },
                configurable: true
            });
            
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            const deviceInfo = app.getDeviceInfo();
            expect(deviceInfo.connection.effectiveType).toBe('4g');
            expect(deviceInfo.connection.downlink).toBe(10);
        });
    });

    describe('Memory Constraint Tests', () => {
        test('should handle low memory devices', async () => {
            // Mock low memory
            Object.defineProperty(navigator, 'deviceMemory', {
                value: 1,
                configurable: true
            });
            
            global.performance.memory = {
                usedJSHeapSize: 800 * 1024 * 1024,
                totalJSHeapSize: 1024 * 1024 * 1024,
                jsHeapSizeLimit: 1024 * 1024 * 1024
            };
            
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            await app.optimizeForDevice();
            
            // Should reduce cache size for low memory devices
            expect(app.cacheManager.setMaxSize).toHaveBeenCalledWith(100 * 1024 * 1024);
        });
        
        test('should handle memory pressure', async () => {
            app = new AnatomicalApp();
            
            await new Promise(resolve => {
                const checkInit = () => {
                    if (app.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 10);
                    }
                };
                checkInit();
            });
            
            const highMemoryInfo = {
                used: 1800,
                total: 2000,
                limit: 2048,
                percentage: 88
            };
            
            app.handleLowPerformance(25, highMemoryInfo);
            
            // Should clear cache under memory pressure
            expect(app.cacheManager.clearOldEntries).toHaveBeenCalled();
        });
    });

    describe('Responsive Design Tests', () => {
        const screenSizes = [
            { name: 'Mobile Portrait', width: 375, height: 667 },
            { name: 'Mobile Landscape', width: 667, height: 375 },
            { name: 'Tablet Portrait', width: 768, height: 1024 },
            { name: 'Tablet Landscape', width: 1024, height: 768 },
            { name: 'Desktop Small', width: 1366, height: 768 },
            { name: 'Desktop Large', width: 1920, height: 1080 },
            { name: '4K', width: 3840, height: 2160 }
        ];
        
        screenSizes.forEach(size => {
            test(`should adapt to ${size.name} (${size.width}x${size.height})`, async () => {
                Object.defineProperty(window, 'innerWidth', {
                    value: size.width,
                    configurable: true
                });
                Object.defineProperty(window, 'innerHeight', {
                    value: size.height,
                    configurable: true
                });
                
                app = new AnatomicalApp();
                
                await new Promise(resolve => {
                    const checkInit = () => {
                        if (app.isInitialized) {
                            resolve();
                        } else {
                            setTimeout(checkInit, 10);
                        }
                    };
                    checkInit();
                });
                
                // Verify appropriate control mode is set
                if (size.width < 768) {
                    expect(app.renderer.setControlMode).toHaveBeenCalledWith('mobile');
                } else if (size.width < 1024) {
                    expect(app.renderer.setControlMode).toHaveBeenCalledWith('tablet');
                } else {
                    expect(app.renderer.setControlMode).toHaveBeenCalledWith('desktop');
                }
            });
        });
    });
});