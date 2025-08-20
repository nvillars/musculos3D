// Loading Manager - Handles loading overlay and progress indicators
export default class LoadingManager {
  constructor() {
  this.overlay = document.getElementById('loading-overlay') || document.getElementById('loading');
  this.text = document.getElementById('loading-text') || document.getElementById('loading');
  this.progress = document.getElementById('loading-progress');
    
    // Fallback progress bar for top of screen
    this.topBar = document.createElement('div');
    this.topBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      width: 0%;
      background: #22d3ee;
      box-shadow: 0 0 12px rgba(34,211,238,.8);
      transition: width .2s ease;
      z-index: 9999;
    `;
    document.body.appendChild(this.topBar);
  }

  show(text = 'Cargando...', progress = 0) {
    if (this.overlay) {
      this.overlay.style.display = 'flex';
    }
    this.update(text, progress);
  }

  update(text, progress) {
    if (this.text) {
      this.text.textContent = text;
    }
    
    const percent = Math.max(0, Math.min(100, progress));
    
    if (this.progress) {
      this.progress.style.width = percent + '%';
    }
    
    this.topBar.style.width = percent + '%';
  }

  hide() {
    // Animate progress to 100%
    this.update('Completado', 100);
    
    // Hide overlay after animation
    setTimeout(() => {
      if (this.overlay) {
        this.overlay.style.display = 'none';
      }
      this.topBar.style.display = 'none';
    }, 500);
  }

  destroy() {
    this.topBar?.remove();
  }
}
