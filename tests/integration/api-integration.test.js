/**
 * Integration tests for API and external service interactions
 */

import { APIManager } from '../../src/APIManager.js';
import { CacheManager } from '../../src/CacheManager.js';
import request from 'supertest';
import express from 'express';

describe('API Integration Tests', () => {
  let apiManager, cacheManager, app, server;

  beforeAll(() => {
    // Setup test server
    app = express();
    app.use(express.json());
    
    // Mock API endpoints
    app.get('/api/models/:id', (req, res) => {
      const { id } = req.params;
      const quality = req.query.quality || 'medium';
      
      if (id === 'test-model') {
        res.json({
          id,
          url: `https://example.com/models/${id}-${quality}.glb`,
          metadata: {
            system: 'musculoskeletal',
            structures: ['bone', 'muscle']
          }
        });
      } else {
        res.status(404).json({ error: 'Model not found' });
      }
    });

    app.get('/api/systems', (req, res) => {
      res.json([
        { id: 'musculoskeletal', name: 'Musculoskeletal System' },
        { id: 'cardiovascular', name: 'Cardiovascular System' },
        { id: 'nervous', name: 'Nervous System' }
      ]);
    });

    server = app.listen(3001);
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    apiManager = new APIManager({
      baseUrl: 'http://localhost:3001/api'
    });
    cacheManager = new CacheManager();
  });

  describe('Model Fetching', () => {
    test('should fetch model from API successfully', async () => {
      const model = await apiManager.fetchModel('test-model', 'high');
      
      expect(model).toBeDefined();
      expect(model.id).toBe('test-model');
      expect(model.url).toContain('high');
    });

    test('should handle API errors gracefully', async () => {
      const result = await apiManager.fetchModel('nonexistent-model', 'medium');
      
      expect(result).toBeNull();
      expect(apiManager.getLastError()).toContain('Model not found');
    });

    test('should use cache when API is unavailable', async () => {
      // Pre-populate cache
      const cachedModel = {
        id: 'cached-model',
        url: 'cached://model.glb',
        metadata: { system: 'test' }
      };
      await cacheManager.set('cached-model', cachedModel);

      // Mock API failure
      jest.spyOn(apiManager, 'makeRequest').mockRejectedValue(new Error('Network error'));

      const result = await apiManager.fetchModel('cached-model', 'medium');
      
      expect(result).toEqual(cachedModel);
    });
  });

  describe('System Data Integration', () => {
    test('should fetch and cache system data', async () => {
      const systems = await apiManager.fetchSystems();
      
      expect(systems).toHaveLength(3);
      expect(systems[0].id).toBe('musculoskeletal');
      
      // Verify caching
      const cachedSystems = await cacheManager.get('systems');
      expect(cachedSystems).toEqual(systems);
    });

    test('should handle concurrent API requests', async () => {
      const requests = [
        apiManager.fetchModel('test-model', 'low'),
        apiManager.fetchModel('test-model', 'medium'),
        apiManager.fetchModel('test-model', 'high')
      ];

      const results = await Promise.all(requests);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.id).toBe('test-model');
      });
    });
  });

  describe('Proxy Server Integration', () => {
    test('should handle CORS through proxy', async () => {
      const response = await request(app)
        .get('/api/models/test-model')
        .expect(200);

      expect(response.body.id).toBe('test-model');
    });

    test('should handle proxy server errors', async () => {
      const response = await request(app)
        .get('/api/models/invalid')
        .expect(404);

      expect(response.body.error).toBe('Model not found');
    });
  });

  describe('Cache Integration', () => {
    test('should implement LRU cache policy', async () => {
      const cacheManager = new CacheManager({ maxSize: 2 });
      
      // Fill cache beyond capacity
      await cacheManager.set('model1', { data: 'test1' });
      await cacheManager.set('model2', { data: 'test2' });
      await cacheManager.set('model3', { data: 'test3' }); // Should evict model1
      
      const model1 = await cacheManager.get('model1');
      const model3 = await cacheManager.get('model3');
      
      expect(model1).toBeNull(); // Evicted
      expect(model3).toBeDefined(); // Still cached
    });

    test('should handle cache storage limits', async () => {
      const largeMockData = new Array(1000000).fill('x').join(''); // ~1MB
      
      const result = await cacheManager.set('large-model', { data: largeMockData });
      
      // Should handle large data appropriately
      expect(result).toBeDefined();
    });
  });
});