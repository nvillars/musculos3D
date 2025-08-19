import PerformanceManager from '../src/PerformanceManager.js';
import * as THREE from 'three';

// Mock Three.js components
jest.mock('three', () => ({
    WebGLRenderer: jest.fn(() => ({
        getContext: jest.fn(() => ({
            getParameter: jest.fn((param) => {
                const params = {
                    [37408]: 4096, // MAX_TEXTURE_SIZE
                    [36347]: 1024, // MAX_VERTEX_UNIFORM_VECTORS
                    [36348]: 1024, // MAX_FRAGMENT_UNIFORM_VECTORS
                    [36349]: 30,   // MAX_VARYING_VECTORS
                    [34921]: 16,   // MAX_VERTEX_ATTRIBS
                    [34024]: 4096, // MAX_RENDERBUFFER_SIZE
                };
                return params[param] || 0;
            }),
            getExtension: jest.fn((ext) => {
                const extensions = {
                    'WEBGL_compressed_texture_s3tc': true,
                    'WEBGL_compressed_texture_etc1': false,
                    'WEBGL_compressed_texture_etc': false,
                    'WEBGL_compressed_texture_astc': false,
                    'WEBGL_compressed_texture_pvrtc': false
                };
                return extensions[ext] ? {} : null;
            })
        })),
        setPixelRatio: jest.fn(),
        shadowMap: { enabled: false, type: null },
        capabilities: {
            getMaxAnisotropy: jest.fn(() => 16)
        }
    })),
    Scene: jest.fn(() => ({
        traverse: jest.fn()
    })),
    PerspectiveCamera: jest.fn(() => ({
        projectionMatrix: new MockMatrix4(),
        matrixWorldInverse: new MockMatrix4()
    })),
    LOD: jest.fn(() => ({
        addLevel: jest.fn(),
        uuid: 'test-lod-uuid'
    })),
    Frustum: jest.fn(() => ({
        setFromProjectionMatrix: jest.fn(),
        intersectsObject: jest.fn(() => true)
    })),
    Matrix4: jest.fn(() => new MockMatrix4()),
    Float32BufferAttribute: jest.fn(),
    LinearMipmapLinearFilter: 'LinearMipmapLinearFilter',
    LinearFilter: 'LinearFilter',
    RGB_S3TC_DXT1_Format: 'RGB_S3TC_DXT1_Format',
    RGB_ETC1_Format: 'RGB_ETC1_Format',
    PCFShadowMap: 'PCFShadowMap',
    PCFSoftShadowMap: 'PCFSoftShadowMap'
}));

// Mock Matrix4
class MockMatrix4 {
    constructor() {
        this.elements = new Array(16).fill(0);
    }
    multiplyMatrices() { return this; }
}

// Mock performance API
Object.defineProperty(global, 'performance', {
    value: {
        now: jest.fn(() => Date.now()),
        memory: {
            usedJSHeapSize: 50 * 1024 * 1024,
            totalJSHeapSize: 100 * 1024 * 1024,
            jsHeapSizeLimit: 2 * 1024 * 1024 * 1024
        },
        mark: jest.fn(),
        measure: jest.fn()
    }
});

// Mock navigator
Object.defineProperty(global, 'navigator', {
    value: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        deviceMemory: 8,
        hardwareConcurrency: 8
    }
});

// Mock window
Object.defineProperty(global, 'window', {
    value: {
        devicePixelRatio: 2,
        PerformanceObserver: jest.fn(() => ({
            observe: jest.fn(),
            disconnect: jest.fn()
        }))
    }
});

describe('PerformanceManager', () => {
    let renderer, scene, camera, performanceManager;

    beforeEach(() => {
        renderer = new THREE.WebGLRenderer();
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera();
        performanceManager = new PerformanceManager(renderer, scene, camera);
    });

    afterEach(() => {
        if (performanceManager) {
            performanceManager.dispose();
        }
    });

    describe('Device Capabilities Detection', () => {
        test('should detect device capabilities correctly', () => {
            const capabilities = performanceManager.deviceCapabilities;
            
            expect(capabilities).toHaveProperty('maxTextureSize');
            expect(capabilities).toHaveProperty('devicePixelRatio');
            expect(capabilities).toHaveProperty('isMobile');
            expect(capabilities).toHaveProperty('memory');
            expect(capabilities).toHaveProperty('cores');
            expect(capabilities.maxTextureSize).toBe(4096);
            expect(capabilities.devicePixelRatio).toBe(2);
            expect(capabilities.isMobile).toBe(false);
        });

        test('should determine quality level based on capabilities', () => {
            expect(performanceManager.qualityLevel).toBe('high');
        });

        test('should detect mobile devices', () => {
            // Mock mobile user agent
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
                configurable: true
            });
            
            const mobileManager = new PerformanceManager(renderer, scene, camera);
            expect(mobileManager.deviceCapabilities.isMobile).toBe(true);
        });
    });

    describe('Texture Compression Detection', () => {
        test('should detect supported texture compression formats', () => {
            const support = performanceManager.textureCompressionSupport;
            
            expect(support).toHaveProperty('s3tc');
            expect(support).toHaveProperty('etc1');
            expect(support).toHaveProperty('astc');
            expect(support.s3tc).toBe(true);
            expect(support.etc1).toBe(false);
        });
    });

    describe('LOD System', () => {
        test('should create LOD system for mesh', () => {
            const mockMesh = {
                uuid: 'test-mesh-uuid',
                clone: jest.fn(() => mockMesh),
                geometry: {
                    clone: jest.fn(() => ({
                        attributes: {
                            position: { array: new Float32Array([1, 2, 3, 4, 5, 6]) }
                        },
                        setAttribute: jest.fn(),
                        computeVertexNormals: jest.fn()
                    }))
                }
            };

            const lod = performanceManager.createLODSystem(mockMesh);
            
            expect(lod).toBeDefined();
            expect(performanceManager.lodObjects.has(mockMesh.uuid)).toBe(true);
        });

        test('should generate default LOD levels based on quality', () => {
            const mockMesh = { uuid: 'test' };
            const levels = performanceManager.generateDefaultLODLevels(mockMesh);
            
            expect(levels).toHaveLength(3);
            expect(levels[0].complexity).toBe(0.8); // High quality
            expect(levels[1].complexity).toBe(0.4);
            expect(levels[2].complexity).toBe(0.2);
        });
    });

    describe('Frustum Culling', () => {
        test('should perform frustum culling on scene objects', () => {
            const mockMesh = {
                isMesh: true,
                geometry: {},
                visible: true
            };

            scene.traverse = jest.fn((callback) => {
                callback(mockMesh);
            });

            performanceManager.frustum.intersectsObject = jest.fn(() => false);
            
            const culledCount = performanceManager.performFrustumCulling();
            
            expect(culledCount).toBe(1);
            expect(mockMesh.visible).toBe(false);
        });
    });

    describe('Texture Optimization', () => {
        test('should optimize texture based on device capabilities', () => {
            const mockTexture = {
                generateMipmaps: false,
                minFilter: null,
                magFilter: null,
                anisotropy: 1,
                format: null
            };

            const optimizedTexture = performanceManager.optimizeTexture(mockTexture);
            
            expect(optimizedTexture.generateMipmaps).toBe(true);
            expect(optimizedTexture.minFilter).toBe('LinearMipmapLinearFilter');
            expect(optimizedTexture.magFilter).toBe('LinearFilter');
            expect(optimizedTexture.anisotropy).toBe(16);
        });

        test('should apply compression for low quality', () => {
            performanceManager.qualityLevel = 'low';
            const mockTexture = { format: null };

            const optimizedTexture = performanceManager.optimizeTexture(mockTexture, { forceCompression: true });
            
            expect(optimizedTexture.format).toBe('RGB_S3TC_DXT1_Format');
        });
    });

    describe('Performance Monitoring', () => {
        test('should update FPS counter', () => {
            const initialFPS = performanceManager.fps;
            
            // Mock time passage
            performance.now = jest.fn()
                .mockReturnValueOnce(0)
                .mockReturnValueOnce(1000);
            
            performanceManager.frameCount = 60;
            performanceManager.updatePerformanceMetrics();
            
            expect(performanceManager.fps).toBe(60);
        });

        test('should record performance history', () => {
            performance.now = jest.fn()
                .mockReturnValueOnce(0)
                .mockReturnValueOnce(1000);
            
            performanceManager.frameCount = 30;
            performanceManager.updatePerformanceMetrics();
            
            expect(performanceManager.performanceHistory).toHaveLength(1);
            expect(performanceManager.performanceHistory[0].fps).toBe(30);
        });

        test('should get memory usage information', () => {
            const memoryUsage = performanceManager.getMemoryUsage();
            
            expect(memoryUsage).toHaveProperty('used');
            expect(memoryUsage).toHaveProperty('total');
            expect(memoryUsage).toHaveProperty('limit');
            expect(memoryUsage.used).toBe(48); // 50MB / 1024 / 1024 * 1000
        });
    });

    describe('Quality Adjustment', () => {
        test('should manually set quality level', () => {
            performanceManager.setQualityLevel('medium');
            expect(performanceManager.qualityLevel).toBe('medium');
        });

        test('should apply quality settings to renderer', () => {
            performanceManager.setQualityLevel('low');
            
            expect(renderer.setPixelRatio).toHaveBeenCalledWith(1);
            expect(renderer.shadowMap.enabled).toBe(false);
        });

        test('should auto-adjust quality based on performance', () => {
            // Simulate poor performance
            performanceManager.performanceHistory = [
                { fps: 25 }, { fps: 28 }, { fps: 22 }, { fps: 26 }, { fps: 24 }
            ];
            
            const originalQuality = performanceManager.qualityLevel;
            performanceManager.autoAdjustQuality();
            
            if (originalQuality === 'high') {
                expect(performanceManager.qualityLevel).toBe('medium');
            }
        });
    });

    describe('Scene Optimization', () => {
        test('should optimize entire scene', () => {
            const mockMesh = {
                isMesh: true,
                uuid: 'test-mesh',
                geometry: {},
                material: {
                    map: { format: null }
                },
                parent: {
                    add: jest.fn(),
                    remove: jest.fn()
                }
            };

            scene.traverse = jest.fn((callback) => {
                callback(mockMesh);
            });

            const optimizations = performanceManager.optimizeScene();
            
            expect(optimizations).toHaveProperty('frustumCulled');
            expect(optimizations).toHaveProperty('lodApplied');
            expect(optimizations).toHaveProperty('texturesOptimized');
        });
    });

    describe('Performance Statistics', () => {
        test('should return comprehensive performance stats', () => {
            const stats = performanceManager.getPerformanceStats();
            
            expect(stats).toHaveProperty('fps');
            expect(stats).toHaveProperty('qualityLevel');
            expect(stats).toHaveProperty('deviceCapabilities');
            expect(stats).toHaveProperty('textureCompressionSupport');
            expect(stats).toHaveProperty('memoryUsage');
            expect(stats).toHaveProperty('lodObjectsCount');
            expect(stats).toHaveProperty('performanceHistory');
        });
    });

    describe('Resource Management', () => {
        test('should dispose resources properly', () => {
            const mockObserver = {
                disconnect: jest.fn()
            };
            performanceManager.performanceObserver = mockObserver;
            
            performanceManager.dispose();
            
            expect(mockObserver.disconnect).toHaveBeenCalled();
            expect(performanceManager.lodObjects.size).toBe(0);
            expect(performanceManager.performanceHistory).toHaveLength(0);
        });
    });
});