// Small top progress bar
export default class ProgressIndicator{
  constructor(){
    const bar = document.createElement('div');
    bar.style.position = 'fixed'; bar.style.top = '0'; bar.style.left = '0';
    bar.style.height = '3px'; bar.style.width = '0%'; bar.style.background = '#22d3ee';
    bar.style.boxShadow = '0 0 12px rgba(34,211,238,.8)';
    bar.style.transition = 'width .2s ease';
    bar.style.zIndex = '9999';
    document.body.appendChild(bar);
    this.bar = bar;
  }
  show(text, p){ this.update(text, p ?? 10); this.bar.style.display = 'block'; }
  update(_text, percent){ this.bar.style.width = Math.max(0, Math.min(100, percent)) + '%'; }
  hide(){ this.bar.style.width = '100%'; setTimeout(()=>this.bar.style.display='none', 300); }
  destroy(){ this.bar?.remove(); }
}
