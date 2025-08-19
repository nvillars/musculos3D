// Main entry point for the anatomical 3D viewer
import AnatomicalApp from './AnatomicalApp.js';
// src/index.js
import './styles/ui.css';

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Starting Musculos3D (fixed)');
  const canvas = document.getElementById('viewer') || (() => {
    const c = document.createElement('canvas');
    c.id = 'viewer';
    c.style.position = 'absolute';
    c.style.inset = '0';
    document.body.appendChild(c);
    return c;
  })();

  window.anatomicalApp = new AnatomicalApp({
    canvas,
    enablePerformanceMonitoring: true,
    enableOfflineMode: true,
    enableProgressiveLoading: true,
    maxCacheSize: 500 * 1024 * 1024
  });

  window.addEventListener('beforeunload', () => {
    window.anatomicalApp?.destroy();
  });
});

export default AnatomicalApp;
