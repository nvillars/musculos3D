# Musculos3D – Fix Pack

Este paquete corrige el proyecto en construcción sustituyendo módulos incompletos (que contenían `...`) por implementaciones mínimas **funcionales**:
- Renderizador Three.js, controles Orbitales y *picking* por raycaster.
- Gestor de anatomía con sistemas, estructuras placeholder, **aislar/mostrar**, **peel** por profundidad y **resaltado** simple.
- UI básica (menú de sistemas, búsqueda, slider de capas, HUD).
- Gestor de performance con ajuste de **pixel ratio** para estabilizar FPS.
- Andamiaje para API/Cache/Zoom y barra de progreso.

> Nota: No incluye modelos `.glb`. El demo dibuja geometrías placeholder para validar UX y flujo completo. Cuando tengas modelos, podrás conectarlos en `AnatomyManager.loadInitialScene()` o creando un `ModelLoader`.

## Cómo correr
1. `npm i`
2. `npm run dev`
3. Abre `http://localhost:8080`

## Qué queda pendiente
- Integrar loaders DRACO/KTX2 y modelos reales.
- Service Worker avanzado con Workbox (hay sw.js base en /public).
- Accesibilidad adicional (teclado, focus visible).
- Tooltips ricos con metadata anatómica.

