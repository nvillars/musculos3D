/**
 * Configuración de APIs externas para modelos anatómicos
 */
export const API_CONFIG = {
    // APIs gratuitas disponibles
    endpoints: {
        primary: {
            url: 'https://api.anatomymodels.org/v1',
            name: 'Anatomy Models API',
            timeout: 10000,
            rateLimit: 100, // requests per minute
            features: ['models', 'textures', 'metadata', 'search']
        },
        secondary: {
            url: 'https://free-anatomy-api.com/api',
            name: 'Free Anatomy API',
            timeout: 8000,
            rateLimit: 60,
            features: ['models', 'basic-metadata']
        }
    },

    // Configuración de calidad de modelos
    qualityLevels: {
        low: {
            maxVertices: 5000,
            textureSize: 512,
            compressionLevel: 'high'
        },
        medium: {
            maxVertices: 20000,
            textureSize: 1024,
            compressionLevel: 'medium'
        },
        high: {
            maxVertices: 100000,
            textureSize: 2048,
            compressionLevel: 'low'
        },
        ultra: {
            maxVertices: 500000,
            textureSize: 4096,
            compressionLevel: 'none'
        }
    },

    // Mapeo de sistemas anatómicos
    anatomicalSystems: {
        musculoskeletal: {
            id: 'musculoskeletal',
            name: 'Sistema Musculoesquelético',
            structures: ['skeleton', 'muscles', 'joints', 'ligaments'],
            color: '#ff6b6b',
            priority: 1
        },
        cardiovascular: {
            id: 'cardiovascular',
            name: 'Sistema Cardiovascular',
            structures: ['heart', 'arteries', 'veins', 'capillaries'],
            color: '#e74c3c',
            priority: 2
        },
        nervous: {
            id: 'nervous',
            name: 'Sistema Nervioso',
            structures: ['brain', 'spinal_cord', 'nerves', 'ganglia'],
            color: '#f39c12',
            priority: 3
        },
        respiratory: {
            id: 'respiratory',
            name: 'Sistema Respiratorio',
            structures: ['lungs', 'trachea', 'bronchi', 'alveoli'],
            color: '#3498db',
            priority: 4
        },
        digestive: {
            id: 'digestive',
            name: 'Sistema Digestivo',
            structures: ['stomach', 'intestines', 'liver', 'pancreas'],
            color: '#2ecc71',
            priority: 5
        },
        urogenital: {
            id: 'urogenital',
            name: 'Sistema Urogenital',
            structures: ['kidneys', 'bladder', 'reproductive_organs'],
            color: '#9b59b6',
            priority: 6
        },
        lymphatic: {
            id: 'lymphatic',
            name: 'Sistema Linfático',
            structures: ['lymph_nodes', 'spleen', 'thymus', 'lymph_vessels'],
            color: '#1abc9c',
            priority: 7
        }
    },

    // Configuración de cache
    cache: {
        maxSize: 100 * 1024 * 1024, // 100MB
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
        cleanupInterval: 60 * 60 * 1000, // 1 hora
        compressionEnabled: true
    },

    // Configuración de fallback
    fallback: {
        enabled: true,
        localPath: '/assets/models/fallback/',
        models: {
            musculoskeletal: {
                skeleton: 'skeleton.glb',
                muscles: 'muscles.glb',
                joints: 'joints.glb'
            },
            cardiovascular: {
                heart: 'heart.glb',
                vessels: 'vessels.glb'
            },
            nervous: {
                brain: 'brain.glb',
                nerves: 'nerves.glb'
            },
            generic: 'generic.glb'
        }
    },

    // Configuración de retry
    retry: {
        maxAttempts: 3,
        backoffMultiplier: 2,
        initialDelay: 1000
    }
};

export default API_CONFIG;