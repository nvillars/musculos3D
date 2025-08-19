// PerformanceManager - Manages performance optimization and monitoring
import * as THREE from 'three';

export default class PerformanceManager {
  constructor(renderer, { targetFps = 60, qualityLevel = 'high' } = {}) {
    this.renderer = renderer;
    this.targetFps = targetFps;
    this.qualityLevel = qualityLevel;
    this.frames = [];
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 60;
    this.enabled = false;
    
    // Performance metrics
    this.performanceHistory = [];
    this.memoryUsage = { used: 0, total: 0, limit: 0 };
    
    // Device capabilities
    this.deviceCapabilities = this.detectDeviceCapabilities();
    
    // LOD system
    this.lodObjects = new Map();
    this.frustum = new THREE.Frustum();
    
    // Quality levels
    this.qualityLevels = {
      low: { pixelRatio: 0.5, shadowQuality: 'basic', textureQuality: 'low' },
      medium: { pixelRatio: 0.75, shadowQuality: 'medium', textureQuality: 'medium' },
      high: { pixelRatio: 1.0, shadowQuality: 'high', textureQuality: 'high' }
    };
    
    // Set up render callback
    if (renderer && renderer.onAfterRender) {
      renderer.onAfterRender = (dt) => this._tick(dt);
    }
    
    console.log(`PerformanceManager initialized with quality level: ${this.qualityLevel}`);
  }

  detectDeviceCapabilities() {
    try {
      const canvas = this.renderer?.domElement || document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        return {
          webgl: false,
          maxTextureSize: 1024,
          maxVertexUniformVectors: 256,
          maxFragmentUniformVectors: 256,
          maxVaryingVectors: 8,
          maxVertexAttribs: 8,
          maxRenderbufferSize: 1024,
          compressedTextures: {},
          anisotropy: 1
        };
      }

      const capabilities = {
        webgl: true,
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) || 1024,
        maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) || 256,
        maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) || 256,
        maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS) || 8,
        maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS) || 8,
        maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 1024,
        compressedTextures: {},
        anisotropy: 1
      };

      // Check compressed texture support
      const extensions = [
        'WEBGL_compressed_texture_s3tc',
        'WEBGL_compressed_texture_etc1',
        'WEBGL_compressed_texture_etc',
        'WEBGL_compressed_texture_astc',
        'WEBGL_compressed_texture_pvrtc'
      ];

      extensions.forEach(ext => {
        const extension = gl.getExtension(ext);
        if (extension) {
          capabilities.compressedTextures[ext] = true;
        }
      });

      // Check anisotropy support
      const anisotropyExt = gl.getExtension('EXT_texture_filter_anisotropic');
      if (anisotropyExt) {
        capabilities.anisotropy = gl.getParameter(anisotropyExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 1;
      }

      return capabilities;
    } catch (error) {
      console.warn('Failed to detect device capabilities:', error);
      return {
        webgl: false,
        maxTextureSize: 1024,
        maxVertexUniformVectors: 256,
        maxFragmentUniformVectors: 256,
        maxVaryingVectors: 8,
        maxVertexAttribs: 8,
        maxRenderbufferSize: 1024,
        compressedTextures: {},
        anisotropy: 1
      };
    }
  }

  enable() {
    this.enabled = true;
    this.lastTime = performance.now();
    console.log('Performance monitoring enabled');
  }

  disable() {
    this.enabled = false;
    console.log('Performance monitoring disabled');
  }

  _tick(dtMs) {
    if (!this.enabled) return;

    this.frameCount++;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;

    if (deltaTime >= 1000) { // Update every second
      this.fps = Math.round((this.frameCount * 1000) / deltaTime);
      this.frames.push(this.fps);
      
      if (this.frames.length > 60) {
        this.frames.shift();
      }

      this.updateMemoryUsage();
      this.autoAdjustQuality();
      
      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    // Dynamic pixel ratio adjustment
    if (this.renderer && this.renderer.renderer) {
      const r = this.renderer.renderer;
      const avgFps = this.getAverageFps();
      let ratio = r.getPixelRatio();

      if (avgFps < this.targetFps - 10 && ratio > 0.5) {
        ratio = Math.max(0.5, ratio - 0.1);
        r.setPixelRatio(ratio);
      } else if (avgFps > this.targetFps + 10 && ratio < 1.0) {
        ratio = Math.min(1.0, ratio + 0.1);
        r.setPixelRatio(ratio);
      }
    }
  }

  getAverageFps() {
    if (this.frames.length === 0) return this.fps;
    return this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
  }

  updateMemoryUsage() {
    if (performance.memory) {
      this.memoryUsage = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
  }

  setQualityLevel(level) {
    if (!this.qualityLevels[level]) {
      console.warn(`Invalid quality level: ${level}`);
      return;
    }

    this.qualityLevel = level;
    const config = this.qualityLevels[level];

    if (this.renderer && this.renderer.renderer) {
      const r = this.renderer.renderer;
      r.setPixelRatio(config.pixelRatio);
    }

    console.log(`Quality level set to: ${level}`);
  }

  autoAdjustQuality() {
    const avgFps = this.getAverageFps();
    const currentLevel = this.qualityLevel;

    if (avgFps < 30 && currentLevel !== 'low') {
      this.setQualityLevel('low');
    } else if (avgFps < 45 && currentLevel === 'high') {
      this.setQualityLevel('medium');
    } else if (avgFps > 55 && currentLevel === 'low') {
      this.setQualityLevel('medium');
    }
  }

  getPerformanceStats() {
    return {
      fps: this.fps,
      averageFps: this.getAverageFps(),
      qualityLevel: this.qualityLevel,
      memoryUsage: this.memoryUsage,
      deviceCapabilities: this.deviceCapabilities
    };
  }

  createLODSystem(mesh, distances = [50, 100, 200]) {
    if (!mesh) return null;

    const lod = new THREE.LOD();
    distances.forEach((distance, index) => {
      const level = this.createLODLevel(mesh, index);
      lod.addLevel(level, distance);
    });

    this.lodObjects.set(mesh.uuid, lod);
    return lod;
  }

  createLODLevel(mesh, level) {
    // Simple LOD implementation - clone the mesh
    const clone = mesh.clone();
    clone.material = mesh.material.clone();
    return clone;
  }

  performFrustumCulling() {
    if (!this.renderer || !this.renderer.camera) return 0;

    const camera = this.renderer.camera;
    this.frustum.setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      )
    );

    let culledCount = 0;
    this.lodObjects.forEach((lod) => {
      if (!this.frustum.intersectsObject(lod)) {
        lod.visible = false;
        culledCount++;
      } else {
        lod.visible = true;
      }
    });

    return culledCount;
  }

  optimizeTexture(texture, options = {}) {
    if (!texture) return texture;

    const config = this.qualityLevels[this.qualityLevel];
    
    if (config.textureQuality === 'low') {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
    } else if (config.textureQuality === 'medium') {
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
    }

    return texture;
  }

  dispose() {
    this.disable();
    this.lodObjects.clear();
    this.performanceHistory = [];
    this.frames = [];
  }
}
