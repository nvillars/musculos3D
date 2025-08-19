// Wires DOM pointer events to renderer picking and anatomy selection
export default class InteractionController {
  constructor(renderer, anatomy, ui){
    this.renderer = renderer;
    this.anatomy = anatomy;
    this.ui = ui;

    const dom = renderer.renderer.domElement;
    dom.addEventListener('pointerdown', (e)=> this._onPointer(e));
    dom.addEventListener('touchstart', (e)=> this._onTouch(e));
  }

  _onPointer(e){
    const obj = this.renderer.pick(e.clientX, e.clientY);
    this.anatomy.highlight(obj);
    if (obj){
      this.ui?.showHud(`${obj.userData?.name || obj.name || 'Estructura'}`);
    } else {
      this.ui?.hideHud();
    }
  }

  _onTouch(e){
    const t = e.touches[0];
    if (!t) return;
    const obj = this.renderer.pick(t.clientX, t.clientY);
    this.anatomy.highlight(obj);
    if (obj){
      this.ui?.showHud(`${obj.userData?.name || obj.name || 'Estructura'}`);
    } else {
      this.ui?.hideHud();
    }
  }
}
