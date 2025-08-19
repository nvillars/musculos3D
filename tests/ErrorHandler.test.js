import ErrorHandler from '../src/ErrorHandler.js';

// Mock del DOM y APIs del navegador
const mockCanvas = {
    addEventListener: jest.fn(),
    getContext: jest.fn()
};

const mockGL = {
    getParameter: jest.fn(),
    getExtension: jest.fn()
};

// Mock de performance.memory
Object.defineProperty(performance, 'memory', {
    value: {
        usedJSHeapSize: 50000000,
        totalJSHeapSize: 100000000,
        jsHeapSizeLimit: 200000000
    },
    configurable: true
});

// Mock de document y window
Object.defineProperty(global, 'document', {
    value: {
        querySelector: jest.fn(() => mockCanvas),
        createElement: jest.fn(() => ({
            style: { cssText: '' },
            id: '',
            textContent: '',
            parentNode: { removeChild: jest.fn() }
        })),
        body: { appendChild: jest.fn() }
    }
});

Object.defineProperty(global, 'window', {
    value: {
        addEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        location: { href: 'http://localhost' }
    }
});

Object.defineProperty(global, 'navigator', {
    value: {
        userAgent: 'Mozilla/5.0 (Test Browser)'
    }
});

describe('ErrorHandler', () => {
    let errorHandler;

    beforeEach(() => {
        errorHandler = new ErrorHandler();
        jest.clearAllMocks();
        console.error = jest.fn(); // Mock console.error
    });

    describe('Inicialización', () => {
        test('debe inicializar correctamente', () => {
            expect(errorHandler).toBeInstanceOf(ErrorHandler);
            expect(errorHandler.errorLog).toEqual([]);
            expect(errorHandler.maxLogSize).toBe(1000);
            expect(errorHandler.retryAttempts).toBeInstanceOf(Map);
        });

        test('debe configurar event listeners globales', () => {
            expect(window.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
            expect(window.addEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
        });
    });

    describe('Logging estructurado', () => {
        test('debe registrar errores correctamente', () => {
            const error = new Error('Test error');
            const context = { type: 'test_error', component: 'TestComponent' };

            const logEntry = errorHandler.logError(error, context);

            expect(logEntry).toMatchObject({
                message: 'Test error',
                type: 'test_error',
                context: context,
                userAgent: 'Mozilla/5.0 (Test Browser)',
                url: 'http://localhost'
            });

            expect(errorHandler.errorLog).toHaveLength(1);
            expect(errorHandler.errorLog[0]).toEqual(logEntry);
        });

        test('debe manejar strings como errores', () => {
            const errorString = 'String error message';
            const logEntry = errorHandler.logError(errorString);

            expect(logEntry.message).toBe(errorString);
            expect(logEntry.stack).toBeNull();
        });

        test('debe mantener el log dentro del límite de tamaño', () => {
            errorHandler.maxLogSize = 3;

            for (let i = 0; i < 5; i++) {
                errorHandler.logError(new Error(`Error ${i}`));
            }

            expect(errorHandler.errorLog).toHaveLength(3);
            expect(errorHandler.errorLog[0].message).toBe('Error 2');
            expect(errorHandler.errorLog[2].message).toBe('Error 4');
        });
    });

    describe('Manejo de fallos de API', () => {
        test('debe manejar fallo de API con fallback', async () => {
            const fallbackAction = jest.fn().mockResolvedValue('fallback result');
            
            const result = await errorHandler.handleAPIFailure('testAPI', fallbackAction);

            expect(result).toBe('fallback result');
            expect(fallbackAction).toHaveBeenCalled();
            expect(errorHandler.errorLog).toHaveLength(1);
            expect(errorHandler.errorLog[0].context.apiName).toBe('testAPI');
        });

        test('debe reintentar antes del fallback', async () => {
            const retryAction = jest.fn()
                .mockRejectedValueOnce(new Error('First attempt'))
                .mockResolvedValue('retry success');
            
            const fallbackAction = jest.fn();

            const result = await errorHandler.handleAPIFailure('testAPI', fallbackAction, {
                retryAction
            });

            expect(result).toBe('retry success');
            expect(retryAction).toHaveBeenCalledTimes(2);
            expect(fallbackAction).not.toHaveBeenCalled();
        });

        test('debe usar fallback después de máximos reintentos', async () => {
            const retryAction = jest.fn().mockRejectedValue(new Error('Always fails'));
            const fallbackAction = jest.fn().mockResolvedValue('fallback result');

            errorHandler.maxRetries = 1;

            const result = await errorHandler.handleAPIFailure('testAPI', fallbackAction, {
                retryAction
            });

            expect(result).toBe('fallback result');
            expect(retryAction).toHaveBeenCalledTimes(1);
            expect(fallbackAction).toHaveBeenCalled();
        });
    });

    describe('Compatibilidad WebGL', () => {
        test('debe detectar WebGL disponible', () => {
            mockGL.getParameter
                .mockReturnValueOnce(4096) // MAX_TEXTURE_SIZE
                .mockReturnValueOnce(256)  // MAX_VERTEX_UNIFORM_VECTORS
                .mockReturnValueOnce('Test Renderer'); // UNMASKED_RENDERER_WEBGL

            mockGL.getExtension
                .mockImplementation((ext) => {
                    const extensions = {
                        'WEBGL_debug_renderer_info': true,
                        'OES_texture_float': true,
                        'OES_texture_half_float': false
                    };
                    return extensions[ext] || null;
                });

            mockCanvas.getContext
                .mockReturnValueOnce(mockGL) // webgl
                .mockReturnValueOnce(mockGL); // webgl2

            const compatibility = errorHandler.checkWebGLCompatibility();

            expect(compatibility.webgl).toBe(true);
            expect(compatibility.webgl2).toBe(true);
            expect(compatibility.maxTextureSize).toBe(4096);
            expect(compatibility.renderer).toBe('Test Renderer');
            expect(compatibility.extensions['OES_texture_float']).toBe(true);
            expect(compatibility.extensions['OES_texture_half_float']).toBe(false);
        });

        test('debe manejar WebGL no disponible', () => {
            mockCanvas.getContext.mockReturnValue(null);

            const compatibility = errorHandler.checkWebGLCompatibility();

            expect(compatibility.webgl).toBe(false);
            expect(compatibility.webgl2).toBe(false);
            expect(compatibility.maxTextureSize).toBe(0);
        });

        test('debe manejar errores en detección WebGL', () => {
            mockCanvas.getContext.mockImplementation(() => {
                throw new Error('WebGL not supported');
            });

            const compatibility = errorHandler.checkWebGLCompatibility();

            expect(compatibility.webgl).toBe(false);
            expect(errorHandler.errorLog).toHaveLength(1);
            expect(errorHandler.errorLog[0].context.type).toBe('compatibility_error');
        });
    });

    describe('Manejo de errores de renderizado', () => {
        test('debe manejar errores de renderizado normales', () => {
            const renderError = new Error('Rendering failed');
            
            errorHandler.handleRenderingError(renderError, { component: 'Renderer' });

            expect(errorHandler.errorLog).toHaveLength(1);
            expect(errorHandler.errorLog[0].context.type).toBe('webgl_error');
            expect(errorHandler.errorLog[0].context.component).toBe('Renderer');
        });

        test('debe detectar y manejar errores de memoria', () => {
            const memoryError = new Error('Out of memory allocating texture');
            
            errorHandler.handleRenderingError(memoryError);

            expect(errorHandler.errorLog).toHaveLength(1);
            expect(window.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'memory-pressure'
                })
            );
        });
    });

    describe('Detección de errores de memoria', () => {
        test('debe identificar errores de memoria por palabras clave', () => {
            const memoryErrors = [
                new Error('Out of memory'),
                new Error('Memory allocation failed'),
                new Error('Buffer overflow'),
                new Error('Texture memory exceeded')
            ];

            memoryErrors.forEach(error => {
                expect(errorHandler.isMemoryError(error)).toBe(true);
            });
        });

        test('debe no identificar errores normales como de memoria', () => {
            const normalError = new Error('Network connection failed');
            expect(errorHandler.isMemoryError(normalError)).toBe(false);
        });
    });

    describe('Información de memoria', () => {
        test('debe obtener información de memoria cuando está disponible', () => {
            const memoryInfo = errorHandler.getMemoryUsage();

            expect(memoryInfo.available).toBe(true);
            expect(memoryInfo.used).toBe(50000000);
            expect(memoryInfo.total).toBe(100000000);
            expect(memoryInfo.limit).toBe(200000000);
            expect(memoryInfo.percentage).toBe(25);
        });

        test('debe manejar memoria no disponible', () => {
            // Temporalmente remover performance.memory
            const originalMemory = performance.memory;
            delete performance.memory;

            const memoryInfo = errorHandler.getMemoryUsage();

            expect(memoryInfo.available).toBe(false);

            // Restaurar
            performance.memory = originalMemory;
        });
    });

    describe('Mensajes de usuario', () => {
        test('debe mostrar mensaje user-friendly', () => {
            const createElement = jest.fn(() => ({
                id: '',
                style: { cssText: '', opacity: '1' },
                textContent: ''
            }));
            
            document.createElement = createElement;
            document.getElementById = jest.fn(() => null);

            errorHandler.showUserMessage('api_failure');

            expect(createElement).toHaveBeenCalledWith('div');
            expect(document.body.appendChild).toHaveBeenCalled();
        });

        test('debe usar mensaje personalizado', () => {
            const customMessage = 'Custom error message';
            const mockElement = {
                id: '',
                style: { cssText: '', opacity: '1' },
                textContent: ''
            };

            document.createElement = jest.fn(() => mockElement);
            document.getElementById = jest.fn(() => null);

            errorHandler.showUserMessage('api_failure', customMessage);

            expect(mockElement.textContent).toBe(customMessage);
        });
    });

    describe('Reporte de rendimiento', () => {
        test('debe reportar problemas de rendimiento', () => {
            const metrics = { fps: 25, frameTime: 40 };

            errorHandler.reportPerformanceIssue(metrics);

            expect(errorHandler.errorLog).toHaveLength(1);
            expect(errorHandler.errorLog[0].context.metrics).toEqual(metrics);
            expect(window.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'performance-issue'
                })
            );
        });

        test('debe no disparar evento para FPS aceptable', () => {
            const metrics = { fps: 60, frameTime: 16 };

            errorHandler.reportPerformanceIssue(metrics);

            expect(errorHandler.errorLog).toHaveLength(1);
            expect(window.dispatchEvent).not.toHaveBeenCalled();
        });
    });

    describe('Gestión del log', () => {
        test('debe obtener log limitado', () => {
            for (let i = 0; i < 10; i++) {
                errorHandler.logError(new Error(`Error ${i}`));
            }

            const limitedLog = errorHandler.getErrorLog(5);
            expect(limitedLog).toHaveLength(5);
            expect(limitedLog[0].message).toBe('Error 5');
            expect(limitedLog[4].message).toBe('Error 9');
        });

        test('debe limpiar el log', () => {
            errorHandler.logError(new Error('Test error'));
            errorHandler.retryAttempts.set('test', 1);

            errorHandler.clearErrorLog();

            expect(errorHandler.errorLog).toHaveLength(0);
            expect(errorHandler.retryAttempts.size).toBe(0);
        });

        test('debe exportar log en formato JSON', () => {
            errorHandler.logError(new Error('Test error'));

            const exportedLog = errorHandler.exportErrorLog();
            const parsed = JSON.parse(exportedLog);

            expect(parsed.errors).toHaveLength(1);
            expect(parsed.timestamp).toBeDefined();
            expect(parsed.userAgent).toBe('Mozilla/5.0 (Test Browser)');
            expect(parsed.compatibility).toBeDefined();
        });
    });

    describe('Manejo de contexto WebGL', () => {
        test('debe manejar pérdida de contexto WebGL', () => {
            errorHandler.handleWebGLContextLoss();

            expect(errorHandler.errorLog).toHaveLength(1);
            expect(errorHandler.errorLog[0].context.event).toBe('context_lost');
            expect(window.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'webgl-context-lost'
                })
            );
        });

        test('debe manejar restauración de contexto WebGL', () => {
            errorHandler.handleWebGLContextRestore();

            expect(errorHandler.errorLog).toHaveLength(1);
            expect(errorHandler.errorLog[0].context.event).toBe('context_restored');
            expect(window.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'webgl-context-restored'
                })
            );
        });
    });

    describe('Utilidades', () => {
        test('debe crear delay correctamente', async () => {
            const start = Date.now();
            await errorHandler.delay(100);
            const end = Date.now();

            expect(end - start).toBeGreaterThanOrEqual(90);
        });
    });
});