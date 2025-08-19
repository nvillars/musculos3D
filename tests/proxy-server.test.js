/**
 * Tests de integración para el servidor proxy
 */
const request = require('supertest');
const app = require('../server/proxy-server.js');

// Mock de node-fetch
jest.mock('node-fetch');
const fetch = require('node-fetch');

describe('Proxy Server Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/proxy', () => {
        test('debe proxificar petición exitosa a API externa', async () => {
            const mockAPIResponse = {
                model_url: 'https://api.example.com/model.glb',
                texture_url: 'https://api.example.com/texture.jpg',
                name: 'Test Model',
                anatomical_system: 'musculoskeletal',
                description: 'Test anatomical model'
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockAPIResponse)
            });

            const response = await request(app)
                .get('/api/proxy')
                .query({
                    endpoint: 'https://api.anatomymodels.org/v1',
                    model: 'test_model',
                    quality: 'medium'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('modelUrl');
            expect(response.body).toHaveProperty('textureUrl');
            expect(response.body).toHaveProperty('metadata');
            expect(response.body.metadata.name).toBe('Test Model');
        });

        test('debe manejar error 404 de API externa', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            const response = await request(app)
                .get('/api/proxy')
                .query({
                    endpoint: 'https://api.anatomymodels.org/v1',
                    model: 'nonexistent_model',
                    quality: 'medium'
                });

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });

        test('debe manejar timeout de API externa', async () => {
            fetch.mockImplementation(() => 
                new Promise(resolve => setTimeout(resolve, 15000))
            );

            const response = await request(app)
                .get('/api/proxy')
                .query({
                    endpoint: 'https://api.anatomymodels.org/v1',
                    model: 'slow_model',
                    quality: 'medium'
                });

            expect(response.status).toBe(408);
            expect(response.body.error).toBe('Request timeout');
        }, 12000);

        test('debe rechazar endpoint no soportado', async () => {
            const response = await request(app)
                .get('/api/proxy')
                .query({
                    endpoint: 'https://malicious-api.com',
                    model: 'test_model',
                    quality: 'medium'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Unsupported API endpoint');
        });

        test('debe requerir parámetro endpoint', async () => {
            const response = await request(app)
                .get('/api/proxy')
                .query({
                    model: 'test_model',
                    quality: 'medium'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Endpoint parameter required');
        });

        test('debe requerir parámetro model para peticiones normales', async () => {
            const response = await request(app)
                .get('/api/proxy')
                .query({
                    endpoint: 'https://api.anatomymodels.org/v1',
                    quality: 'medium'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Model parameter required');
        });

        test('debe manejar health check', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ status: 'healthy' })
            });

            const response = await request(app)
                .get('/api/proxy')
                .query({
                    endpoint: 'https://api.anatomymodels.org/v1',
                    health: 'true'
                });

            expect(response.status).toBe(200);
            expect(fetch).toHaveBeenCalledWith(
                'https://api.anatomymodels.org/v1/health',
                expect.any(Object)
            );
        });
    });

    describe('GET /api/models', () => {
        test('debe obtener lista de modelos disponibles', async () => {
            const mockModels = [
                {
                    model_url: 'https://api.example.com/heart.glb',
                    name: 'Heart',
                    anatomical_system: 'cardiovascular'
                },
                {
                    model_url: 'https://api.example.com/brain.glb',
                    name: 'Brain',
                    anatomical_system: 'nervous'
                }
            ];

            fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockModels)
            });

            const response = await request(app)
                .get('/api/models');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });

        test('debe filtrar modelos por sistema', async () => {
            const mockModels = [
                {
                    model_url: 'https://api.example.com/heart.glb',
                    name: 'Heart',
                    anatomical_system: 'cardiovascular'
                }
            ];

            fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockModels)
            });

            const response = await request(app)
                .get('/api/models')
                .query({ system: 'cardiovascular' });

            expect(response.status).toBe(200);
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('system=cardiovascular'),
                expect.any(Object)
            );
        });

        test('debe manejar error al obtener modelos', async () => {
            fetch.mockRejectedValue(new Error('API Error'));

            const response = await request(app)
                .get('/api/models');

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Failed to get available models');
        });
    });

    describe('GET /api/status', () => {
        test('debe verificar estado de todas las APIs', async () => {
            fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ status: 'healthy' })
            });

            const response = await request(app)
                .get('/api/status');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('https://api.anatomymodels.org/v1');
            expect(response.body).toHaveProperty('https://free-anatomy-api.com/api');
        });

        test('debe detectar APIs no disponibles', async () => {
            fetch
                .mockResolvedValueOnce({ ok: true })   // Primera API disponible
                .mockRejectedValueOnce(new Error());  // Segunda API falla

            const response = await request(app)
                .get('/api/status');

            expect(response.status).toBe(200);
            expect(response.body['https://api.anatomymodels.org/v1']).toBe(true);
            expect(response.body['https://free-anatomy-api.com/api']).toBe(false);
        });
    });

    describe('Transformación de respuestas', () => {
        test('debe transformar respuesta de anatomymodels.org', async () => {
            const mockAPIResponse = {
                model_url: 'https://api.anatomymodels.org/model.glb',
                texture_url: 'https://api.anatomymodels.org/texture.jpg',
                name: 'Heart Model',
                anatomical_system: 'cardiovascular',
                description: 'Detailed heart model',
                tags: ['heart', 'cardiovascular']
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockAPIResponse)
            });

            const response = await request(app)
                .get('/api/proxy')
                .query({
                    endpoint: 'https://api.anatomymodels.org/v1',
                    model: 'heart',
                    quality: 'high'
                });

            expect(response.status).toBe(200);
            expect(response.body.modelUrl).toBe(mockAPIResponse.model_url);
            expect(response.body.textureUrl).toBe(mockAPIResponse.texture_url);
            expect(response.body.metadata.name).toBe(mockAPIResponse.name);
            expect(response.body.metadata.system).toBe(mockAPIResponse.anatomical_system);
        });

        test('debe transformar respuesta de free-anatomy-api.com', async () => {
            const mockAPIResponse = {
                downloadUrl: 'https://free-anatomy-api.com/brain.glb',
                textureUrl: 'https://free-anatomy-api.com/brain_texture.jpg',
                title: 'Brain Model',
                category: 'nervous',
                info: 'Detailed brain model',
                keywords: ['brain', 'nervous', 'anatomy']
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockAPIResponse)
            });

            const response = await request(app)
                .get('/api/proxy')
                .query({
                    endpoint: 'https://free-anatomy-api.com/api',
                    model: 'brain',
                    quality: 'medium'
                });

            expect(response.status).toBe(200);
            expect(response.body.modelUrl).toBe(mockAPIResponse.downloadUrl);
            expect(response.body.textureUrl).toBe(mockAPIResponse.textureUrl);
            expect(response.body.metadata.name).toBe(mockAPIResponse.title);
            expect(response.body.metadata.system).toBe(mockAPIResponse.category);
        });

        test('debe usar transformación genérica para APIs desconocidas', async () => {
            const mockAPIResponse = {
                url: 'https://unknown-api.com/model.glb',
                texture: 'https://unknown-api.com/texture.jpg',
                name: 'Generic Model',
                system: 'general',
                description: 'Generic anatomical model'
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockAPIResponse)
            });

            const response = await request(app)
                .get('/api/proxy')
                .query({
                    endpoint: 'https://api.anatomymodels.org/v1', // Endpoint conocido pero respuesta genérica
                    model: 'generic',
                    quality: 'low'
                });

            expect(response.status).toBe(200);
            expect(response.body.modelUrl).toBe(mockAPIResponse.url);
            expect(response.body.textureUrl).toBe(mockAPIResponse.texture);
        });
    });

    describe('Manejo de errores', () => {
        test('debe manejar error de red', async () => {
            fetch.mockRejectedValueOnce({ code: 'ENOTFOUND' });

            const response = await request(app)
                .get('/api/proxy')
                .query({
                    endpoint: 'https://api.anatomymodels.org/v1',
                    model: 'test_model',
                    quality: 'medium'
                });

            expect(response.status).toBe(503);
            expect(response.body.error).toBe('API service unavailable');
        });

        test('debe manejar errores internos del servidor', async () => {
            fetch.mockImplementation(() => {
                throw new Error('Unexpected error');
            });

            const response = await request(app)
                .get('/api/proxy')
                .query({
                    endpoint: 'https://api.anatomymodels.org/v1',
                    model: 'test_model',
                    quality: 'medium'
                });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Internal proxy error');
        });
    });
});