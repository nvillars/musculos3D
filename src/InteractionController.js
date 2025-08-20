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
    if (!obj) {
      this.anatomy.clearSelection?.();
      this.ui?.hideHud();
      return;
    }

    // Prefer canonicalName -> selectStructure (string id)
    const id = obj.userData?.canonicalName || obj.userData?.name || obj.name;
    if (id && this.anatomy.selectStructure) {
      this.anatomy.selectStructure(id);
    } else {
      this.anatomy.highlight(obj);
    }

    this.ui?.showHud(`${obj.userData?.originalName || obj.userData?.name || obj.name || 'Estructura'}`);
  }

  _onTouch(e){
    const t = e.touches[0];
    if (!t) return;
    const obj = this.renderer.pick(t.clientX, t.clientY);
    if (!obj) {
      this.anatomy.clearSelection?.();
      this.ui?.hideHud();
      return;
    }

    const id = obj.userData?.canonicalName || obj.userData?.name || obj.name;
    if (id && this.anatomy.selectStructure) {
      this.anatomy.selectStructure(id);
    } else {
      this.anatomy.highlight(obj);
    }

    this.ui?.showHud(`${obj.userData?.originalName || obj.userData?.name || obj.name || 'Estructura'}`);
  }
}
