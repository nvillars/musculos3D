# Sistema de Integración con APIs Externas

## Descripción General

El sistema de integración con APIs externas permite al visor anatómico 3D acceder a modelos de alta calidad desde servicios externos gratuitos, con un sistema robusto de cache local y fallback a modelos locales.

## Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Proxy Server  │    │  External APIs  │
│   (APIManager)  │◄──►│   (Express.js)  │◄──►│  (Anatomical    │
│                 │    │                 │    │   Models)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Local Cache   │    │   File Storage  │    │   CDN Storage   │
│   (IndexedDB)   │    │   (Static)      │    │   (Models)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Componentes Principales

### 1. APIManager (Frontend)

Clase principal que gestiona la obtención de modelos 3D desde múltiples fuentes:

- **Cache local**: IndexedDB para almacenamiento persistente
- **APIs externas**: Integración con servicios gratuitos
- **Modelos de fallback**: Modelos locales como respaldo
- **Gestión de calidad**: Adaptación según capacidades del dispositivo

### 2. Proxy Server (Backend)

Servidor Express.js que actúa como intermediario:

- **Evita CORS**: Proxy para APIs externas
- **Transformación de datos**: Normaliza respuestas de diferentes APIs
- **Rate limiting**: Control de frecuencia de peticiones
- **Error handling**: Manejo robusto de errores

### 3. Sistema de Cache

Cache inteligente con estrategia LRU (Least Recently Used):

- **Almacenamiento**: IndexedDB para persistencia
- **Límites**: 100MB máximo por defecto
- **Limpieza automática**: Eliminación de modelos antiguos
- **Compresión**: Optimización de espacio

## APIs Externas Soportadas

### 1. Anatomy Models API
- **URL**: `https://api.anatomymodels.org/v1`
- **Características**: Modelos de alta calidad, metadatos completos
- **Rate Limit**: 100 requests/minuto
- **Formatos**: glTF 2.0, texturas PBR

### 2. Free Anatomy API
- **URL**: `https://free-anatomy-api.com/api`
- **Características**: Modelos básicos, acceso libre
- **Rate Limit**: 60 requests/minuto
- **Formatos**: glTF, OBJ

## Configuración

### Configuración de APIs

```javascript
// src/config/api-config.js
export const API_CONFIG = {
    endpoints: {
        primary: {
            url: 'https://api.anatomymodels.org/v1',
            timeout: 10000,
            rateLimit: 100
        },
        secondary: {
            url: 'https://free-anatomy-api.com/api',
            timeout: 8000,
            rateLimit: 60
        }
    },
    // ... más configuración
};
```

### Configuración del Servidor Proxy

```javascript
// server/proxy-server.js
const API_CONFIGS = {
    'https://api.anatomymodels.org/v1': {
        headers: {
            'User-Agent': 'AnatomicalViewer/1.0',
            'Accept': 'application/json'
        },
        timeout: 10000
    }
};
```

## Uso

### Inicialización

```javascript
import APIManager from './src/APIManager.js';

const apiManager = new APIManager();
```

### Obtener Modelo

```javascript
// Obtener modelo con cache automático
const modelData = await apiManager.fetchModel('heart_ventricle', 'high');

// Estructura de respuesta
{
    id: 'heart_ventricle',
    quality: 'high',
    modelUrl: 'https://api.example.com/heart.glb',
    textureUrl: 'https://api.example.com/heart_texture.jpg',
    metadata: {
        name: 'Heart Ventricle',
        system: 'cardiovascular',
        description: 'Detailed heart ventricle model'
    },
    source: 'api', // 'api', 'cache', o 'fallback'
    timestamp: 1640995200000
}
```

### Verificar Estado de APIs

```javascript
const apiStatus = await apiManager.checkAPIAvailability();
// { primary: true, secondary: false }
```

### Gestión de Cache

```javascript
// Obtener modelo desde cache
const cachedModel = await apiManager.getCachedModel('heart_ventricle', 'high');

// Limpiar cache
await apiManager.cleanupCache();
```

## Niveles de Calidad

| Nivel | Vértices | Textura | Compresión | Uso |
|-------|----------|---------|------------|-----|
| low | 5,000 | 512px | Alta | Móviles básicos |
| medium | 20,000 | 1024px | Media | Dispositivos estándar |
| high | 100,000 | 2048px | Baja | Computadoras potentes |
| ultra | 500,000 | 4096px | Ninguna | Workstations |

## Sistema de Fallback

### Modelos Locales

```
assets/models/fallback/
├── skeleton.glb
├── muscles.glb
├── heart.glb
├── brain.glb
├── vessels.glb
├── nerves.glb
└── generic.glb
```

### Estrategia de Fallback

1. **Cache local**: Verificar si el modelo está cacheado
2. **API principal**: Intentar obtener desde API primaria
3. **API secundaria**: Intentar obtener desde API de respaldo
4. **Modelo local**: Usar modelo de fallback específico
5. **Modelo genérico**: Usar modelo genérico como último recurso

## Manejo de Errores

### Tipos de Error

- **Network Error**: Problemas de conectividad
- **API Error**: Errores del servidor externo
- **Timeout Error**: Tiempo de espera agotado
- **Cache Error**: Problemas con IndexedDB
- **Parse Error**: Datos corruptos o inválidos

### Estrategias de Recuperación

```javascript
try {
    const model = await apiManager.fetchModel(modelId, quality);
} catch (error) {
    if (error.type === 'NetworkError') {
        // Usar cache o fallback
        const fallbackModel = await apiManager.getFallbackModel(modelId);
    }
}
```

## Optimizaciones

### Performance

- **Lazy Loading**: Carga bajo demanda
- **Predictive Caching**: Pre-carga de modelos relacionados
- **Compression**: Compresión Draco para geometrías
- **Texture Streaming**: Carga progresiva de texturas

### Memoria

- **LRU Cache**: Eliminación de modelos menos usados
- **Size Limits**: Límites de tamaño por modelo
- **Cleanup Intervals**: Limpieza periódica automática

## Testing

### Tests Unitarios

```bash
npm test -- APIManager.test.js
```

### Tests de Integración

```bash
npm test -- proxy-server.test.js
```

### Demo Interactivo

Abrir `demo-api-integration.html` en el navegador para probar la funcionalidad.

## Deployment

### Desarrollo

```bash
# Iniciar servidor proxy
npm run server

# Iniciar desarrollo frontend
npm run dev

# O ambos simultáneamente
npm run dev:full
```

### Producción

```bash
# Build de producción
npm run build

# Iniciar servidor
NODE_ENV=production npm run server
```

## Monitoreo

### Métricas Importantes

- **Cache Hit Rate**: Porcentaje de modelos servidos desde cache
- **API Response Time**: Tiempo de respuesta de APIs externas
- **Error Rate**: Frecuencia de errores por tipo
- **Storage Usage**: Uso del espacio de cache

### Logs

El sistema genera logs estructurados para:

- Peticiones a APIs externas
- Operaciones de cache
- Errores y recuperaciones
- Métricas de rendimiento

## Troubleshooting

### Problemas Comunes

1. **APIs no disponibles**: Verificar conectividad y estado de servicios
2. **Cache lleno**: Limpiar cache o aumentar límite
3. **Modelos corruptos**: Verificar integridad de datos
4. **CORS errors**: Verificar configuración del proxy

### Herramientas de Diagnóstico

- Demo interactivo para pruebas manuales
- Logs detallados en consola
- Métricas de rendimiento en tiempo real
- Tests automatizados para validación