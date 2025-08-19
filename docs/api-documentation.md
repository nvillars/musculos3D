# Anatomical 3D Viewer - API Documentation

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Instalación y Configuración](#instalación-y-configuración)
3. [API Principal](#api-principal)
4. [Componentes](#componentes)
5. [Eventos](#eventos)
6. [Configuración](#configuración)
7. [Ejemplos de Uso](#ejemplos-de-uso)
8. [Solución de Problemas](#solución-de-problemas)

## Introducción

El Anatomical 3D Viewer es una aplicación web interactiva que permite visualizar y manipular modelos 3D del cuerpo humano. Esta documentación describe la API pública disponible para desarrolladores.

### Características Principales

- ✅ Visualización 3D de alta definición del cuerpo humano completo
- ✅ Soporte para múltiples sistemas anatómicos
- ✅ Interacción táctil y con mouse
- ✅ Búsqueda y filtrado de estructuras
- ✅ Manipulación de estructuras (aislar, ocultar, resaltar)
- ✅ Zoom profundo con carga progresiva de texturas
- ✅ Optimización automática según dispositivo
- ✅ Modo offline con cache local
- ✅ Monitoreo de rendimiento

## Instalación y Configuración

### Instalación Básica

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anatomical 3D Viewer</title>
</head>
<body>
    <canvas id="anatomical-canvas"></canvas>
    <div id="loading-overlay">Cargando...</div>
    <div id="error-message" style="display: none;"></div>
    
    <script type="module">
        import AnatomicalApp from './src/AnatomicalApp.js';
        
        const app = new AnatomicalApp({
            enablePerformanceMonitoring: true,
            enableOfflineMode: true,
            maxCacheSize: 500 * 1024 * 1024 // 500MB
        });
    </script>
</body>
</html>
```

### Elementos DOM Requeridos

- `#anatomical-canvas`: Canvas para renderizado 3D
- `#loading-overlay`: Overlay de carga (opcional)
- `#error-message`: Contenedor de mensajes de error (opcional)
- `#loading-text`: Texto de progreso de carga (opcional)
- `#loading-progress`: Barra de progreso (opcional)

## API Principal

### Clase AnatomicalApp

La clase principal que gestiona toda la aplicación.

#### Constructor

```javascript
new AnatomicalApp(options)
```

**Parámetros:**
- `options` (Object): Configuración de la aplicación
  - `enablePerformanceMonitoring` (boolean): Habilitar monitoreo de rendimiento (default: true)
  - `enableOfflineMode` (boolean): Habilitar modo offline (default: true)
  - `enableProgressiveLoading` (boolean): Habilitar carga progresiva (default: true)
  - `maxCacheSize` (number): Tamaño máximo del cache en bytes (default: 500MB)

**Ejemplo:**
```javascript
const app = new AnatomicalApp({
    enablePerformanceMonitoring: true,
    enableOfflineMode: true,
    maxCacheSize: 1024 * 1024 * 1024 // 1GB
});
```

#### Métodos Principales

##### `loadAnatomicalSystem(systemId)`

Carga un sistema anatómico específico.

**Parámetros:**
- `systemId` (string): ID del sistema ('musculoskeletal', 'cardiovascular', 'nervous', etc.)

**Retorna:** `Promise<void>`

**Ejemplo:**
```javascript
await app.loadAnatomicalSystem('musculoskeletal');
console.log('Sistema musculoesquelético cargado');
```

##### `searchStructures(query)`

Busca estructuras anatómicas por nombre.

**Parámetros:**
- `query` (string): Término de búsqueda

**Retorna:** `Promise<Array<Object>>`

**Ejemplo:**
```javascript
const results = await app.searchStructures('femur');
console.log('Resultados encontrados:', results);
```

##### `getStatus()`

Obtiene el estado actual de la aplicación.

**Retorna:** `Object`
- `initialized` (boolean): Si la aplicación está inicializada
- `currentSystem` (string): Sistema actualmente cargado
- `selectedStructure` (string): Estructura seleccionada
- `loadedModels` (Array): Lista de modelos cargados
- `performanceMetrics` (Object): Métricas de rendimiento
- `errorCount` (number): Número de errores

**Ejemplo:**
```javascript
const status = app.getStatus();
console.log('Estado de la aplicación:', status);
```

##### `getCacheStats()`

Obtiene estadísticas del cache.

**Retorna:** `Promise<Object>`

**Ejemplo:**
```javascript
const stats = await app.getCacheStats();
console.log('Estadísticas del cache:', stats);
```

##### `clearCache()`

Limpia todo el cache almacenado.

**Retorna:** `Promise<boolean>`

**Ejemplo:**
```javascript
const success = await app.clearCache();
console.log('Cache limpiado:', success);
```

##### `exportDebugData()`

Exporta datos de depuración para soporte técnico.

**Retorna:** `Object`

**Ejemplo:**
```javascript
const debugData = app.exportDebugData();
console.log('Datos de depuración:', debugData);
```

##### `destroy()`

Limpia todos los recursos y destruye la aplicación.

**Ejemplo:**
```javascript
app.destroy();
console.log('Aplicación destruida');
```

## Componentes

### AnatomyManager

Gestiona los sistemas anatómicos y estructuras.

#### Métodos

##### `isolateStructure(structureName)`

Aísla una estructura específica, ocultando el resto.

**Parámetros:**
- `structureName` (string): Nombre de la estructura

**Ejemplo:**
```javascript
app.anatomyManager.isolateStructure('femur');
```

##### `highlightStructure(structureName, color)`

Resalta una estructura con un color específico.

**Parámetros:**
- `structureName` (string): Nombre de la estructura
- `color` (number): Color en formato hexadecimal

**Ejemplo:**
```javascript
app.anatomyManager.highlightStructure('humerus', 0xff0000);
```

##### `hideStructure(structureName)`

Oculta una estructura específica.

**Parámetros:**
- `structureName` (string): Nombre de la estructura

**Ejemplo:**
```javascript
app.anatomyManager.hideStructure('radius');
```

##### `showStructure(structureName)`

Muestra una estructura previamente oculta.

**Parámetros:**
- `structureName` (string): Nombre de la estructura

**Ejemplo:**
```javascript
app.anatomyManager.showStructure('radius');
```

##### `setLayerVisibility(layerName, visible)`

Controla la visibilidad de capas anatómicas.

**Parámetros:**
- `layerName` (string): Nombre de la capa ('skin', 'muscle', 'bone')
- `visible` (boolean): Visibilidad de la capa

**Ejemplo:**
```javascript
app.anatomyManager.setLayerVisibility('skin', false);
```

### UIManager

Gestiona la interfaz de usuario.

#### Métodos

##### `showStructureInfo(info)`

Muestra información de una estructura.

**Parámetros:**
- `info` (Object): Información de la estructura
  - `name` (string): Nombre
  - `type` (string): Tipo
  - `system` (string): Sistema
  - `position` (Object): Posición 3D

**Ejemplo:**
```javascript
app.uiManager.showStructureInfo({
    name: 'femur',
    type: 'bone',
    system: 'musculoskeletal',
    position: { x: 0, y: 0, z: 0 }
});
```

##### `updateSearchResults(results)`

Actualiza los resultados de búsqueda en la UI.

**Parámetros:**
- `results` (Array): Array de resultados de búsqueda

**Ejemplo:**
```javascript
app.uiManager.updateSearchResults([
    { name: 'femur', type: 'bone', system: 'musculoskeletal' }
]);
```

### ZoomManager

Gestiona el sistema de zoom y navegación.

#### Métodos

##### `updateDistance(distance)`

Actualiza la distancia de la cámara.

**Parámetros:**
- `distance` (number): Distancia de la cámara

**Ejemplo:**
```javascript
app.zoomManager.updateDistance(10.0);
```

## Eventos

### Eventos del Renderer

#### `onObjectSelect(callback)`

Se dispara cuando se selecciona un objeto 3D.

**Callback Parameters:**
- `object` (THREE.Object3D): Objeto seleccionado
- `intersection` (THREE.Intersection): Datos de intersección

**Ejemplo:**
```javascript
app.renderer.onObjectSelect((object, intersection) => {
    console.log('Objeto seleccionado:', object.name);
    console.log('Posición:', intersection.point);
});
```

#### `onObjectHover(callback)`

Se dispara cuando se hace hover sobre un objeto.

**Callback Parameters:**
- `object` (THREE.Object3D): Objeto sobre el que se hace hover

**Ejemplo:**
```javascript
app.renderer.onObjectHover((object) => {
    console.log('Hover sobre:', object.name);
});
```

#### `onObjectUnhover(callback)`

Se dispara cuando se deja de hacer hover sobre un objeto.

**Callback Parameters:**
- `object` (THREE.Object3D): Objeto que se deja de hacer hover

**Ejemplo:**
```javascript
app.renderer.onObjectUnhover((object) => {
    console.log('Fin hover:', object.name);
});
```

#### `onControlsChange(callback)`

Se dispara cuando cambian los controles de cámara.

**Callback Parameters:**
- `info` (Object): Información de los controles
  - `distance` (number): Distancia de la cámara
  - `target` (Object): Objetivo de la cámara

**Ejemplo:**
```javascript
app.renderer.onControlsChange((info) => {
    console.log('Distancia de cámara:', info.distance);
});
```

### Eventos del ZoomManager

#### `onZoomChange(callback)`

Se dispara cuando cambia el nivel de zoom.

**Callback Parameters:**
- `level` (string): Nivel de zoom ('near', 'medium', 'far', 'deep')
- `distance` (number): Distancia actual

**Ejemplo:**
```javascript
app.zoomManager.onZoomChange((level, distance) => {
    console.log('Nivel de zoom:', level, 'Distancia:', distance);
});
```

#### `onZoomLimitReached(callback)`

Se dispara cuando se alcanza un límite de zoom.

**Callback Parameters:**
- `limit` (string): Límite alcanzado ('minimum', 'maximum')

**Ejemplo:**
```javascript
app.zoomManager.onZoomLimitReached((limit) => {
    console.log('Límite de zoom alcanzado:', limit);
});
```

### Eventos del UIManager

#### `onSystemSelect(callback)`

Se dispara cuando se selecciona un sistema anatómico.

**Callback Parameters:**
- `systemId` (string): ID del sistema seleccionado

**Ejemplo:**
```javascript
app.uiManager.onSystemSelect((systemId) => {
    console.log('Sistema seleccionado:', systemId);
});
```

#### `onStructureSearch(callback)`

Se dispara cuando se realiza una búsqueda.

**Callback Parameters:**
- `query` (string): Término de búsqueda

**Ejemplo:**
```javascript
app.uiManager.onStructureSearch((query) => {
    console.log('Búsqueda:', query);
});
```

## Configuración

### Sistemas Anatómicos Disponibles

```javascript
const availableSystems = [
    {
        id: 'musculoskeletal',
        name: 'Sistema Musculoesquelético',
        color: '#ff6b6b',
        icon: '🦴'
    },
    {
        id: 'cardiovascular',
        name: 'Sistema Cardiovascular',
        color: '#e74c3c',
        icon: '❤️'
    },
    {
        id: 'nervous',
        name: 'Sistema Nervioso',
        color: '#f39c12',
        icon: '🧠'
    },
    {
        id: 'respiratory',
        name: 'Sistema Respiratorio',
        color: '#3498db',
        icon: '🫁'
    },
    {
        id: 'digestive',
        name: 'Sistema Digestivo',
        color: '#27ae60',
        icon: '🫃'
    },
    {
        id: 'urogenital',
        name: 'Sistema Urogenital',
        color: '#9b59b6',
        icon: '🫘'
    }
];
```

### Configuración de Calidad

```javascript
const qualityLevels = {
    low: {
        textureSize: 512,
        modelComplexity: 'simplified',
        shadows: false,
        antialiasing: false
    },
    medium: {
        textureSize: 1024,
        modelComplexity: 'standard',
        shadows: true,
        antialiasing: false
    },
    high: {
        textureSize: 2048,
        modelComplexity: 'detailed',
        shadows: true,
        antialiasing: true
    },
    ultra: {
        textureSize: 4096,
        modelComplexity: 'ultra',
        shadows: true,
        antialiasing: true
    }
};
```

## Ejemplos de Uso

### Ejemplo Básico

```javascript
import AnatomicalApp from './src/AnatomicalApp.js';

// Inicializar aplicación
const app = new AnatomicalApp();

// Esperar inicialización
await new Promise(resolve => {
    const checkInit = () => {
        if (app.isInitialized) {
            resolve();
        } else {
            setTimeout(checkInit, 100);
        }
    };
    checkInit();
});

// Cargar sistema musculoesquelético
await app.loadAnatomicalSystem('musculoskeletal');

// Configurar eventos
app.renderer.onObjectSelect((object, intersection) => {
    console.log('Estructura seleccionada:', object.name);
    app.anatomyManager.highlightStructure(object.name, 0x00ff00);
});

console.log('Aplicación lista');
```

### Ejemplo Avanzado con UI Personalizada

```javascript
import AnatomicalApp from './src/AnatomicalApp.js';

class CustomAnatomicalViewer {
    constructor() {
        this.app = new AnatomicalApp({
            enablePerformanceMonitoring: true,
            maxCacheSize: 1024 * 1024 * 1024 // 1GB
        });
        
        this.setupEventHandlers();
        this.createCustomUI();
    }
    
    async init() {
        // Esperar inicialización
        await new Promise(resolve => {
            const checkInit = () => {
                if (this.app.isInitialized) {
                    resolve();
                } else {
                    setTimeout(checkInit, 100);
                }
            };
            checkInit();
        });
        
        // Cargar sistema por defecto
        await this.app.loadAnatomicalSystem('musculoskeletal');
        
        console.log('Visor personalizado inicializado');
    }
    
    setupEventHandlers() {
        // Selección de estructuras
        this.app.renderer.onObjectSelect((object, intersection) => {
            this.showStructureDetails(object, intersection);
        });
        
        // Cambios de zoom
        this.app.zoomManager.onZoomChange((level, distance) => {
            this.updateZoomUI(level, distance);
        });
        
        // Monitoreo de rendimiento
        setInterval(() => {
            this.updatePerformanceDisplay();
        }, 1000);
    }
    
    createCustomUI() {
        // Crear panel de control personalizado
        const controlPanel = document.createElement('div');
        controlPanel.className = 'custom-control-panel';
        controlPanel.innerHTML = `
            <h3>Control Anatómico</h3>
            <div class="system-buttons">
                <button onclick="viewer.loadSystem('musculoskeletal')">🦴 Músculos y Huesos</button>
                <button onclick="viewer.loadSystem('cardiovascular')">❤️ Cardiovascular</button>
                <button onclick="viewer.loadSystem('nervous')">🧠 Nervioso</button>
            </div>
            <div class="structure-controls">
                <button onclick="viewer.isolateSelected()">Aislar</button>
                <button onclick="viewer.hideSelected()">Ocultar</button>
                <button onclick="viewer.showAll()">Mostrar Todo</button>
            </div>
            <div class="search-box">
                <input type="text" placeholder="Buscar estructura..." onkeyup="viewer.search(this.value)">
            </div>
            <div class="info-panel" id="structure-info"></div>
            <div class="performance-info" id="performance-display"></div>
        `;
        
        document.body.appendChild(controlPanel);
    }
    
    async loadSystem(systemId) {
        try {
            await this.app.loadAnatomicalSystem(systemId);
            console.log(`Sistema ${systemId} cargado`);
        } catch (error) {
            console.error('Error cargando sistema:', error);
        }
    }
    
    isolateSelected() {
        if (this.app.selectedStructure) {
            this.app.anatomyManager.isolateStructure(this.app.selectedStructure.name);
        }
    }
    
    hideSelected() {
        if (this.app.selectedStructure) {
            this.app.anatomyManager.hideStructure(this.app.selectedStructure.name);
        }
    }
    
    showAll() {
        this.app.anatomyManager.showAllStructures();
    }
    
    async search(query) {
        if (query.length < 2) return;
        
        try {
            const results = await this.app.searchStructures(query);
            this.displaySearchResults(results);
        } catch (error) {
            console.error('Error en búsqueda:', error);
        }
    }
    
    showStructureDetails(object, intersection) {
        const infoPanel = document.getElementById('structure-info');
        infoPanel.innerHTML = `
            <h4>${object.name}</h4>
            <p><strong>Tipo:</strong> ${object.userData.structureType || 'Desconocido'}</p>
            <p><strong>Sistema:</strong> ${object.userData.systemId || this.app.currentSystem}</p>
            <p><strong>Posición:</strong> (${intersection.point.x.toFixed(2)}, ${intersection.point.y.toFixed(2)}, ${intersection.point.z.toFixed(2)})</p>
        `;
    }
    
    updateZoomUI(level, distance) {
        console.log(`Zoom: ${level} (${distance.toFixed(2)})`);
    }
    
    updatePerformanceDisplay() {
        const status = this.app.getStatus();
        const performanceDisplay = document.getElementById('performance-display');
        
        if (performanceDisplay) {
            performanceDisplay.innerHTML = `
                FPS: ${status.performanceMetrics.fps || '--'}<br>
                Memoria: ${status.performanceMetrics.memoryUsage || '--'} MB<br>
                Modelos: ${status.loadedModels.length}
            `;
        }
    }
    
    displaySearchResults(results) {
        console.log('Resultados de búsqueda:', results);
        // Implementar visualización de resultados
    }
}

// Inicializar visor personalizado
const viewer = new CustomAnatomicalViewer();
await viewer.init();

// Hacer disponible globalmente
window.viewer = viewer;
```

### Ejemplo de Integración con Framework

```javascript
// React Component Example
import React, { useEffect, useRef, useState } from 'react';
import AnatomicalApp from './src/AnatomicalApp.js';

const AnatomicalViewer = () => {
    const canvasRef = useRef(null);
    const [app, setApp] = useState(null);
    const [selectedStructure, setSelectedStructure] = useState(null);
    const [currentSystem, setCurrentSystem] = useState(null);
    
    useEffect(() => {
        const initApp = async () => {
            const anatomicalApp = new AnatomicalApp();
            
            // Esperar inicialización
            await new Promise(resolve => {
                const checkInit = () => {
                    if (anatomicalApp.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 100);
                    }
                };
                checkInit();
            });
            
            // Configurar eventos
            anatomicalApp.renderer.onObjectSelect((object, intersection) => {
                setSelectedStructure({
                    name: object.name,
                    type: object.userData.structureType,
                    position: intersection.point
                });
            });
            
            setApp(anatomicalApp);
        };
        
        initApp();
        
        return () => {
            if (app) {
                app.destroy();
            }
        };
    }, []);
    
    const loadSystem = async (systemId) => {
        if (app) {
            await app.loadAnatomicalSystem(systemId);
            setCurrentSystem(systemId);
        }
    };
    
    return (
        <div className="anatomical-viewer">
            <canvas ref={canvasRef} id="anatomical-canvas" />
            
            <div className="controls">
                <h3>Sistemas Anatómicos</h3>
                <button onClick={() => loadSystem('musculoskeletal')}>
                    🦴 Musculoesquelético
                </button>
                <button onClick={() => loadSystem('cardiovascular')}>
                    ❤️ Cardiovascular
                </button>
                <button onClick={() => loadSystem('nervous')}>
                    🧠 Nervioso
                </button>
            </div>
            
            {selectedStructure && (
                <div className="structure-info">
                    <h4>Estructura Seleccionada</h4>
                    <p><strong>Nombre:</strong> {selectedStructure.name}</p>
                    <p><strong>Tipo:</strong> {selectedStructure.type}</p>
                    <p><strong>Posición:</strong> 
                        ({selectedStructure.position.x.toFixed(2)}, 
                         {selectedStructure.position.y.toFixed(2)}, 
                         {selectedStructure.position.z.toFixed(2)})
                    </p>
                </div>
            )}
        </div>
    );
};

export default AnatomicalViewer;
```

## Solución de Problemas

### Problemas Comunes

#### WebGL no soportado

```javascript
// Verificar soporte WebGL
if (!app.checkWebGLSupport()) {
    console.error('WebGL no soportado');
    // Mostrar mensaje de error al usuario
    document.getElementById('webgl-error').style.display = 'block';
}
```

#### Problemas de rendimiento

```javascript
// Monitorear rendimiento
app.renderer.onPerformanceIssue((issue) => {
    console.warn('Problema de rendimiento:', issue);
    
    if (issue.type === 'low_fps') {
        // Reducir calidad automáticamente
        app.renderer.setQualityLevel('medium');
    }
    
    if (issue.type === 'memory_pressure') {
        // Limpiar cache
        app.clearCache();
    }
});
```

#### Errores de carga de modelos

```javascript
// Manejar errores de carga
try {
    await app.loadAnatomicalSystem('musculoskeletal');
} catch (error) {
    console.error('Error cargando sistema:', error);
    
    if (error.message.includes('Network')) {
        // Intentar modo offline
        console.log('Intentando modo offline...');
        // La aplicación automáticamente usará modelos locales
    }
}
```

#### Problemas de memoria

```javascript
// Monitorear uso de memoria
setInterval(() => {
    const memoryInfo = app.getMemoryInfo();
    
    if (memoryInfo.percentage > 80) {
        console.warn('Uso de memoria alto:', memoryInfo);
        
        // Limpiar cache antiguo
        app.cacheManager.clearOldEntries();
        
        // Reducir calidad
        app.renderer.setQualityLevel('low');
    }
}, 5000);
```

### Depuración

#### Exportar datos de depuración

```javascript
// Exportar datos para soporte técnico
const debugData = app.exportDebugData();
console.log('Datos de depuración:', JSON.stringify(debugData, null, 2));

// Guardar en archivo
const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'anatomical-viewer-debug.json';
a.click();
```

#### Logs de rendimiento

```javascript
// Obtener métricas de rendimiento
const metrics = app.getPerformanceMetrics();
console.log('Métricas de rendimiento:', metrics);

// Obtener log de errores
const errorLog = app.getErrorLog(50);
console.log('Últimos 50 errores:', errorLog);
```

### Contacto y Soporte

Para soporte técnico adicional:

1. Exporta los datos de depuración usando `app.exportDebugData()`
2. Incluye información del navegador y dispositivo
3. Describe los pasos para reproducir el problema
4. Adjunta capturas de pantalla si es relevante

---

**Versión de la API:** 1.0.0  
**Última actualización:** Enero 2025  
**Compatibilidad:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+