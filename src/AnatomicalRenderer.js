// Creates the Three.js renderer/scene/camera and runs the loop
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default class AnatomicalRenderer {
  constructor(canvas, { errorHandler } = {}) {
    this.canvas = canvas || document.createElement('canvas');
    this.errorHandler = errorHandler;
    this.clock = new THREE.Clock();
    this.autoRotation = false;
    this.autoRotationSpeed = 0.5;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(1, window.devicePixelRatio || 1));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8B4513); // Dark brown background like reference image
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 2000);
    this.camera.position.set(0, 1.4, 3.2);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;

    // Enhanced lighting for realistic muscle appearance
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    this.scene.add(hemi);
    
    // Main directional light
    const dir = new THREE.DirectionalLight(0xffffff, 1.5);
    dir.position.set(3, 5, 2);
    dir.castShadow = true;
    this.scene.add(dir);
    
    // Additional fill light for better muscle definition
    const fillLight = new THREE.DirectionalLight(0xfff5e6, 0.6);
    fillLight.position.set(-2, 3, 1);
    this.scene.add(fillLight);
    
    // Rim light for muscle separation
    const rimLight = new THREE.DirectionalLight(0xe6f3ff, 0.4);
    rimLight.position.set(0, 2, -3);
    this.scene.add(rimLight);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    window.addEventListener('resize', () => this._onResize());
  }

  _onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w/h; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  setRootObject(obj) {
    if (this.root) this.scene.remove(this.root);
    this.root = obj;
    this.scene.add(obj);
  }

  pick(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((clientX - rect.left)/rect.width)*2 - 1, -((clientY - rect.top)/rect.height)*2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.root ? this.root.children : this.scene.children, true);
    return intersects[0]?.object || null;
  }

  start() {
    if (this._running) return;
    this._running = true;
    const loop = () => {
      if (!this._running) return;
      const dt = this.clock.getDelta() * 1000;
      
      // Auto rotation
      if (this.autoRotation && this.root) {
        this.root.rotation.y += this.autoRotationSpeed * 0.01;
      }
      
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.onAfterRender?.(dt);
      requestAnimationFrame(loop);
    };
    loop();
  }

  toggleAutoRotation(enabled) {
    this.autoRotation = enabled;
    console.log(`Auto rotation ${enabled ? 'enabled' : 'disabled'}`);
  }

  dispose() {
    this._running = false;
    this.controls?.dispose();
    this.renderer?.dispose();
    this.scene?.traverse(o=>{
      if (o.geometry) o.geometry.dispose?.();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach(m=>m.dispose?.());
        else o.material.dispose?.();
      }
    });
  }
}
