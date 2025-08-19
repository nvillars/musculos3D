/**
 * Configuración del sistema de cache local
 */
const CACHE_CONFIG = {
    // Configuración general del cache
    database: {
        name: 'AnatomicalViewerCache',
        version: 1
    },
    
    // Límites de almacenamiento
    storage: {
        maxTotalSize: 500 * 1024 * 1024,      // 500MB total
        maxTextureSize: 50 * 1024 * 1024,     // 50MB por textura
        maxModelSize: 100 * 1024 * 1024,      // 100MB por modelo
        cleanupThreshold: 0.8                  // Limpiar cuando se use 80%
    },
    
    // Configuración de resoluciones de texturas
    textureResolutions: {
        standard: {
            maxSize: 512,
            quality: 0.8,
            format: 'jpg'
        },
        medium: {
            maxSize: 1024,
            quality: 0.85,
            format: 'jpg'
        },
        high: {
            maxSize: 2048,
            quality: 0.9,
            format: 'jpg'
        },
        ultra: {
            maxSize: 4096,
            quality: 0.95,
            format: 'jpg'
        }
    },
    
    // Configuración de carga progresiva
    progressiveLoading: {
        enabled: true,
        zoomThresholds: {
            standard: 1.0,
            medium: 1.5,
            high: 2.5,
            ultra: 5.0
        },
        preloadDistance: 2, // Precargar texturas 2 niveles por adelantado
        maxConcurrentLoads: 3
    },
    
    // Configuración LRU
    lru: {
        enabled: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,      // 7 días en ms
        accessCountWeight: 0.3,                // Peso del contador de accesos
        recencyWeight: 0.7                     // Peso de la recencia
    },
    
    // Configuración de compresión
    compression: {
        enabled: true,
        models: {
            format: 'draco',
            compressionLevel: 7
        },
        textures: {
            format: 'basis',
            quality: 'high'
        }
    },
    
    // Configuración de prefetch
    prefetch: {
        enabled: true,
        relatedSystems: true,      // Precargar sistemas relacionados
        adjacentStructures: true,  // Precargar estructuras adyacentes
        maxPrefetchSize: 50 * 1024 * 1024  // 50MB máximo para prefetch
    }
};

export default CACHE_CONFIG;