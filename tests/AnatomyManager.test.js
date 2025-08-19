import AnatomyManager from '../src/AnatomyManager.js';

describe('AnatomyManager', () => {
  let anatomyManager;
  let mockRenderer;

  beforeEach(() => {
    // Mock renderer
    mockRenderer = {
      loadSystem: jest.fn(),
      isStructureVisible: jest.fn().mockReturnValue(true)
    };
    
    anatomyManager = new AnatomyManager(mockRenderer);
  });

  describe('Inicialización', () => {
    test('debe inicializar con sistemas anatómicos predefinidos', () => {
      const systems = anatomyManager.getAvailableSystems();
      expect(systems).toHaveLength(7);
      
      const systemIds = systems.map(s => s.id);
      expect(systemIds).toContain('musculoskeletal');
      expect(systemIds).toContain('cardiovascular');
      expect(systemIds).toContain('nervous');
      expect(systemIds).toContain('respiratory');
      expect(systemIds).toContain('digestive');
      expect(systemIds).toContain('urogenital');
      expect(systemIds).toContain('lymphatic');
    });

    test('debe inicializar estructuras detalladas', () => {
      const stats = anatomyManager.getStatistics();
      expect(stats.totalStructures).toBeGreaterThan(0);
      expect(stats.totalSystems).toBe(7);
    });
  });

  describe('Carga de sistemas', () => {
    test('debe cargar un sistema válido correctamente', () => {
      const system = anatomyManager.loadSystem('musculoskeletal');
      
      expect(system).toBeDefined();
      expect(system.id).toBe('musculoskeletal');
      expect(system.name).toBe('Sistema Musculoesquelético');
      expect(anatomyManager.getCurrentSystem()).toBe('musculoskeletal');
      expect(mockRenderer.loadSystem).toHaveBeenCalledWith(system);
    });

    test('debe retornar null para sistema inexistente', () => {
      const system = anatomyManager.loadSystem('nonexistent');
      expect(system).toBeNull();
      expect(anatomyManager.getCurrentSystem()).toBeNull();
    });
  }); 
 describe('Obtención de estructuras por sistema', () => {
    test('debe retornar estructuras del sistema musculoesquelético', () => {
      const structures = anatomyManager.getStructuresInSystem('musculoskeletal');
      
      expect(structures.length).toBeGreaterThan(0);
      structures.forEach(structure => {
        expect(structure.system).toBe('musculoskeletal');
      });
      
      const structureNames = structures.map(s => s.name);
      expect(structureNames).toContain('Bíceps Braquial');
      expect(structureNames).toContain('Fémur');
    });

    test('debe retornar array vacío para sistema inexistente', () => {
      const structures = anatomyManager.getStructuresInSystem('nonexistent');
      expect(structures).toEqual([]);
    });

    test('debe retornar estructuras del sistema cardiovascular', () => {
      const structures = anatomyManager.getStructuresInSystem('cardiovascular');
      
      expect(structures.length).toBeGreaterThan(0);
      const structureNames = structures.map(s => s.name);
      expect(structureNames).toContain('Corazón');
      expect(structureNames).toContain('Aorta');
    });
  });

  describe('Búsqueda de estructuras', () => {
    test('debe encontrar estructuras por nombre exacto', () => {
      const results = anatomyManager.searchStructure('corazón');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('Corazón');
      expect(results[0].system).toBe('cardiovascular');
    });

    test('debe encontrar estructuras por palabras clave', () => {
      const results = anatomyManager.searchStructure('músculo');
      
      expect(results.length).toBeGreaterThan(0);
      const muscleResults = results.filter(r => r.keywords.includes('músculo'));
      expect(muscleResults.length).toBeGreaterThan(0);
    });

    test('debe retornar array vacío para consulta muy corta', () => {
      const results = anatomyManager.searchStructure('a');
      expect(results).toEqual([]);
    });

    test('debe limitar resultados según maxResults', () => {
      const results = anatomyManager.searchStructure('hueso', 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    test('debe realizar búsqueda parcial', () => {
      const results = anatomyManager.searchStructure('bice');
      
      expect(results.length).toBeGreaterThan(0);
      const bicepsResult = results.find(r => r.name.includes('Bíceps'));
      expect(bicepsResult).toBeDefined();
    });
  });  d
escribe('Información de estructuras', () => {
    test('debe retornar información detallada de una estructura', () => {
      const structureInfo = anatomyManager.getStructureInfo('biceps_brachii');
      
      expect(structureInfo).toBeDefined();
      expect(structureInfo.id).toBe('biceps_brachii');
      expect(structureInfo.name).toBe('Bíceps Braquial');
      expect(structureInfo.system).toBe('musculoskeletal');
      expect(structureInfo.keywords).toContain('biceps');
    });

    test('debe retornar null para estructura inexistente', () => {
      const structureInfo = anatomyManager.getStructureInfo('nonexistent');
      expect(structureInfo).toBeNull();
    });
  });

  describe('Filtrado por sistema', () => {
    test('debe filtrar todas las estructuras de un sistema', () => {
      const filtered = anatomyManager.filterBySystem('nervous');
      
      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach(structure => {
        expect(structure.system).toBe('nervous');
      });
    });

    test('debe filtrar estructuras visibles', () => {
      mockRenderer.isStructureVisible.mockReturnValue(true);
      
      const filtered = anatomyManager.filterBySystem('musculoskeletal', 'visible');
      expect(filtered.length).toBeGreaterThan(0);
    });

    test('debe filtrar estructuras ocultas', () => {
      mockRenderer.isStructureVisible.mockReturnValue(false);
      
      const filtered = anatomyManager.filterBySystem('musculoskeletal', 'hidden');
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('Sugerencias de autocompletado', () => {
    test('debe proporcionar sugerencias que empiecen con la consulta', () => {
      const suggestions = anatomyManager.getSearchSuggestions('cor');
      
      expect(suggestions.length).toBeGreaterThan(0);
      suggestions.forEach(suggestion => {
        expect(suggestion.startsWith('cor')).toBe(true);
      });
    });

    test('debe limitar sugerencias según maxSuggestions', () => {
      const suggestions = anatomyManager.getSearchSuggestions('m', 3);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    test('debe retornar array vacío para consulta vacía', () => {
      const suggestions = anatomyManager.getSearchSuggestions('');
      expect(suggestions).toEqual([]);
    });
  });

  describe('Estadísticas', () => {
    test('debe proporcionar estadísticas correctas', () => {
      const stats = anatomyManager.getStatistics();
      
      expect(stats.totalSystems).toBe(7);
      expect(stats.totalStructures).toBeGreaterThan(0);
      expect(stats.systemBreakdown).toBeDefined();
      expect(stats.systemBreakdown.musculoskeletal).toBeGreaterThan(0);
    });
  });
});