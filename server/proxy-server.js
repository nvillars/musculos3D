/**
 * Proxy Server - Servidor Express.js para evitar problemas de CORS
 * con APIs externas de modelos anatómicos
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Configuración de APIs externas
const API_CONFIGS = {
    'https://api.anatomymodels.org/v1': {
        headers: {
            'User-Agent': 'AnatomicalViewer/1.0',
            'Accept': 'application/json'
        },
        timeout: 10000
    },
    'https://free-anatomy-api.com/api': {
        headers: {
            'User-Agent': 'AnatomicalViewer/1.0',
            'Accept': 'application/json'
        },
        timeout: 8000
    }
};

/**
 * Endpoint de proxy para APIs externas
 */
app.get('/api/proxy', async (req, res) => {
    try {
        const { endpoint, model, quality, health } = req.query;
        
        if (!endpoint) {
            return res.status(400).json({ error: 'Endpoint parameter required' });
        }

        const decodedEndpoint = decodeURIComponent(endpoint);
        const config = API_CONFIGS[decodedEndpoint];
        
        if (!config) {
            return res.status(400).json({ error: 'Unsupported API endpoint' });
        }

        let targetUrl;
        
        // Health check
        if (health === 'true') {
            targetUrl = `${decodedEndpoint}/health`;
        } else {
            // Construir URL para obtener modelo
            if (!model) {
                return res.status(400).json({ error: 'Model parameter required' });
            }
            
            const qualityParam = quality || 'medium';
            targetUrl = `${decodedEndpoint}/models/${model}?quality=${qualityParam}`;
        }

        // Realizar petición a la API externa
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: config.headers,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();
        
        // Transformar respuesta según el formato esperado
        const transformedData = transformAPIResponse(data, decodedEndpoint);
        
        res.json(transformedData);
        
    } catch (error) {
        console.error('Proxy error:', error);
        
        if (error.name === 'AbortError') {
            res.status(408).json({ error: 'Request timeout' });
        } else if (error.code === 'ENOTFOUND') {
            res.status(503).json({ error: 'API service unavailable' });
        } else {
            res.status(500).json({ error: 'Internal proxy error' });
        }
    }
});

/**
 * Endpoint para obtener lista de modelos disponibles
 */
app.get('/api/models', async (req, res) => {
    try {
        const { system } = req.query;
        const availableModels = await getAvailableModels(system);
        res.json(availableModels);
    } catch (error) {
        console.error('Error getting available models:', error);
        res.status(500).json({ error: 'Failed to get available models' });
    }
});

/**
 * Endpoint para verificar estado de APIs
 */
app.get('/api/status', async (req, res) => {
    try {
        const status = {};
        
        for (const endpoint of Object.keys(API_CONFIGS)) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const response = await fetch(`${endpoint}/health`, {
                    method: 'GET',
                    headers: API_CONFIGS[endpoint].headers,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                status[endpoint] = response.ok;
            } catch (error) {
                status[endpoint] = false;
            }
        }
        
        res.json(status);
    } catch (error) {
        console.error('Error checking API status:', error);
        res.status(500).json({ error: 'Failed to check API status' });
    }
});

/**
 * Transforma respuesta de API al formato esperado
 * @param {Object} data - Datos de la API
 * @param {string} endpoint - Endpoint de origen
 * @returns {Object} Datos transformados
 */
function transformAPIResponse(data, endpoint) {
    // Transformación para api.anatomymodels.org
    if (endpoint.includes('anatomymodels.org')) {
        return {
            modelUrl: data.model_url || data.url,
            textureUrl: data.texture_url || data.texture,
            metadata: {
                name: data.name,
                system: data.anatomical_system,
                description: data.description,
                tags: data.tags || []
            }
        };
    }
    
    // Transformación para free-anatomy-api.com
    if (endpoint.includes('free-anatomy-api.com')) {
        return {
            modelUrl: data.downloadUrl || data.model,
            textureUrl: data.textureUrl || data.materials?.diffuse,
            metadata: {
                name: data.title || data.name,
                system: data.category,
                description: data.info || data.description,
                tags: data.keywords || []
            }
        };
    }
    
    // Formato genérico
    return {
        modelUrl: data.modelUrl || data.url || data.model,
        textureUrl: data.textureUrl || data.texture,
        metadata: {
            name: data.name || data.title,
            system: data.system || data.category,
            description: data.description || data.info,
            tags: data.tags || data.keywords || []
        }
    };
}

/**
 * Obtiene lista de modelos disponibles
 * @param {string} system - Sistema anatómico (opcional)
 * @returns {Promise<Array>} Lista de modelos
 */
async function getAvailableModels(system) {
    const models = [];
    
    for (const endpoint of Object.keys(API_CONFIGS)) {
        try {
            const url = system ? 
                `${endpoint}/models?system=${system}` : 
                `${endpoint}/models`;
                
            const response = await fetch(url, {
                headers: API_CONFIGS[endpoint].headers,
                timeout: API_CONFIGS[endpoint].timeout
            });
            
            if (response.ok) {
                const data = await response.json();
                const transformedModels = data.map(model => 
                    transformAPIResponse(model, endpoint)
                );
                models.push(...transformedModels);
            }
        } catch (error) {
            console.warn(`Failed to get models from ${endpoint}:`, error);
        }
    }
    
    return models;
}

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

// Manejo de errores global
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
    console.log(`Available endpoints:`);
    console.log(`  - GET /api/proxy - Proxy to external APIs`);
    console.log(`  - GET /api/models - Get available models`);
    console.log(`  - GET /api/status - Check API status`);
});

module.exports = app;