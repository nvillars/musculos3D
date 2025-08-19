// Manages deep zoom + orientation hints (simplified)
export default class ZoomManager{
  constructor(renderer, anatomy){
    this.renderer = renderer; this.anatomy = anatomy;
    this.maxDepth = 2;
  }
  setMaxDepth(d){ this.maxDepth = d; }
}
