/**
 * Musculos3D - Minimal working orchestration (fixed)
 * Wires managers together and exposes basic API.
 */
import AnatomicalRenderer from './AnatomicalRenderer.js';
import AnatomyManager from './AnatomyManager.js';
import InteractionController from './InteractionController.js';
import PerformanceManager from './PerformanceManager.js';
import ZoomManager from './ZoomManager.js';
import UIManager from './UIManager.js';
import APIManager from './APIManager.js';
import CacheManager from './CacheManager.js';
import ErrorHandler from './ErrorHandler.js';
import LoadingManager from './LoadingManager.js';

export default class AnatomicalApp {
  constructor(options = {}) {
    this.options = options;
    this.canvas = options.canvas || document.getElementById('viewer');
    this.errorHandler = new ErrorHandler();
    this.cacheManager = new CacheManager({ maxStorageSize: options.maxCacheSize || 500*1024*1024 });
    this.apiManager = new APIManager({ cacheManager: this.cacheManager, errorHandler: this.errorHandler });

    this.loading = new LoadingManager();
    this.loading.show('Inicializando…', 5);

    this.renderer = new AnatomicalRenderer(this.canvas, { errorHandler: this.errorHandler });
    this.anatomy = new AnatomyManager(this.renderer);
    this.zoom = new ZoomManager(this.renderer, this.anatomy);
    this.ui = new UIManager(this.anatomy, this.zoom);
    this.interaction = new InteractionController(this.renderer, this.anatomy, this.ui);

    this.performance = new PerformanceManager(this.renderer, { targetFps: 60 });
    if (options.enablePerformanceMonitoring) this.performance.enable();

    this._init();
  }

  async _init() {
    try {
      await this.cacheManager.initialize?.();
      await this.apiManager.initialize?.();

      // Load placeholder scene (or future API models)
      this.loading.update('Cargando modelo base…', 25);
      await this.anatomy.loadInitialScene();

      // Hook UI events
      this.ui.onSelectSystem = (sys) => this.anatomy.showOnlySystem(sys);
      this.ui.onSearch = (q) => this.anatomy.search(q);
      this.ui.onPeelDepth = (d) => this.anatomy.applyPeelDepth(d);
      this.ui.onHideMuscle = () => this.anatomy.hideSelectedMuscle();
      this.ui.onReset = () => this.anatomy.resetView();
      this.ui.onToggleAutoRotation = (enabled) => this.renderer.toggleAutoRotation(enabled);
      this.ui.onToggleLabels = (enabled) => this.anatomy.toggleLabels(enabled);

      // Start render loop
      this.renderer.start();

      // Done
      this.loading.update('Listo', 100);
      setTimeout(() => this.loading.hide(), 400);
      console.log('✅ Musculos3D listo');
    } catch (e) {
      this.errorHandler.capture(e);
      this.loading.hide();
    }
  }

  destroy() {
    this.renderer?.dispose();
    this.performance?.disable();
    this.cacheManager?.close?.();
    this.apiManager?.close?.();
    this.ui?.dispose();
    this.loading?.destroy();
  }
}
