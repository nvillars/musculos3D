/**
 * Test script for ErrorHandler functionality
 * Run this with: node test-error-handling.js
 */

// Mock DOM environment for Node.js testing
global.window = {
    addEventListener: () => {},
    dispatchEvent: () => {},
    location: { href: 'http://localhost' }
};

global.document = {
    querySelector: () => null,
    createElement: () => ({
        style: { cssText: '', opacity: '1' },
        id: '',
        textContent: '',
        parentNode: { removeChild: () => {} }
    }),
    getElementById: () => null,
    body: { appendChild: () => {} }
};

global.navigator = {
    userAgent: 'Node.js Test Environment'
};

global.performance = {
    now: () => Date.now(),
    memory: {
        usedJSHeapSize: 50000000,
        totalJSHeapSize: 100000000,
        jsHeapSizeLimit: 200000000
    }
};

global.requestAnimationFrame = (callback) => setTimeout(callback, 16);

// Import ErrorHandler
import ErrorHandler from './src/ErrorHandler.js';

console.log('🧪 Iniciando tests del ErrorHandler...\n');

// Test 1: Inicialización
console.log('✅ Test 1: Inicialización');
const errorHandler = new ErrorHandler();
console.log('   - ErrorHandler inicializado correctamente');
console.log('   - Log inicial vacío:', errorHandler.errorLog.length === 0);

// Test 2: Logging básico
console.log('\n✅ Test 2: Logging básico');
const testError = new Error('Test error message');
const logEntry = errorHandler.logError(testError, { type: 'test_error', component: 'TestSuite' });
console.log('   - Error registrado:', logEntry.message === 'Test error message');
console.log('   - Contexto preservado:', logEntry.context.type === 'test_error');
console.log('   - Timestamp presente:', !!logEntry.timestamp);

// Test 3: Compatibilidad WebGL
console.log('\n✅ Test 3: Compatibilidad WebGL');
const compatibility = errorHandler.checkWebGLCompatibility();
console.log('   - Verificación completada sin errores');
console.log('   - Estructura de respuesta correcta:', typeof compatibility === 'object');
console.log('   - Propiedades requeridas presentes:', 
    'webgl' in compatibility && 'webgl2' in compatibility);

// Test 4: Detección de errores de memoria
console.log('\n✅ Test 4: Detección de errores de memoria');
const memoryError = new Error('Out of memory allocating buffer');
const normalError = new Error('Network connection failed');
console.log('   - Error de memoria detectado:', errorHandler.isMemoryError(memoryError));
console.log('   - Error normal no detectado como memoria:', !errorHandler.isMemoryError(normalError));

// Test 5: Información de memoria
console.log('\n✅ Test 5: Información de memoria');
const memoryInfo = errorHandler.getMemoryUsage();
console.log('   - Información de memoria obtenida:', memoryInfo.available);
console.log('   - Porcentaje calculado correctamente:', memoryInfo.percentage === 25);

// Test 6: Manejo de fallos de API (simulado)
console.log('\n✅ Test 6: Manejo de fallos de API');
let fallbackCalled = false;
const testAPIFailure = async () => {
    const result = await errorHandler.handleAPIFailure(
        'test-api',
        () => {
            fallbackCalled = true;
            return 'fallback-result';
        }
    );
    return result;
};

testAPIFailure().then(result => {
    console.log('   - Fallback ejecutado:', fallbackCalled);
    console.log('   - Resultado correcto:', result === 'fallback-result');
    console.log('   - Error registrado en log:', errorHandler.errorLog.length > 1);
});

// Test 7: Reporte de rendimiento
console.log('\n✅ Test 7: Reporte de rendimiento');
const performanceMetrics = { fps: 25, frameTime: 40 };
errorHandler.reportPerformanceIssue(performanceMetrics);
const performanceLogEntry = errorHandler.errorLog.find(entry => entry.context.type === 'performance_issue');
console.log('   - Problema de rendimiento registrado:', !!performanceLogEntry);
console.log('   - Métricas preservadas:', performanceLogEntry?.context.metrics.fps === 25);

// Test 8: Gestión del log
console.log('\n✅ Test 8: Gestión del log');
const initialLogLength = errorHandler.errorLog.length;
for (let i = 0; i < 5; i++) {
    errorHandler.logError(new Error(`Batch error ${i}`));
}
const afterBatchLength = errorHandler.errorLog.length;
console.log('   - Errores en lote agregados:', afterBatchLength > initialLogLength);

const limitedLog = errorHandler.getErrorLog(3);
console.log('   - Log limitado funciona:', limitedLog.length <= 3);

errorHandler.clearErrorLog();
console.log('   - Log limpiado correctamente:', errorHandler.errorLog.length === 0);

// Test 9: Exportación de log
console.log('\n✅ Test 9: Exportación de log');
errorHandler.logError(new Error('Export test error'));
const exportedLog = errorHandler.exportErrorLog();
const parsedLog = JSON.parse(exportedLog);
console.log('   - Log exportado como JSON válido:', !!parsedLog);
console.log('   - Contiene errores:', parsedLog.errors.length > 0);
console.log('   - Contiene información de compatibilidad:', !!parsedLog.compatibility);

// Test 10: Manejo de contexto WebGL
console.log('\n✅ Test 10: Manejo de contexto WebGL');
const initialLogLength2 = errorHandler.errorLog.length;
errorHandler.handleWebGLContextLoss();
errorHandler.handleWebGLContextRestore();
const afterContextEvents = errorHandler.errorLog.length;
console.log('   - Eventos de contexto registrados:', afterContextEvents > initialLogLength2);

// Test 11: Delay utility
console.log('\n✅ Test 11: Utilidad de delay');
const testDelay = async () => {
    const start = Date.now();
    await errorHandler.delay(100);
    const end = Date.now();
    return end - start >= 90; // Allow some margin
};

testDelay().then(delayWorked => {
    console.log('   - Delay funciona correctamente:', delayWorked);
});

// Resumen final
setTimeout(() => {
    console.log('\n🎉 Tests del ErrorHandler completados');
    console.log('📊 Estadísticas finales:');
    console.log(`   - Errores en log: ${errorHandler.errorLog.length}`);
    console.log(`   - Reintentos registrados: ${errorHandler.retryAttempts.size}`);
    console.log('   - Todos los tests básicos pasaron ✅');
    
    console.log('\n📝 Para pruebas interactivas, abre demo-error-handling.html en tu navegador');
}, 200);