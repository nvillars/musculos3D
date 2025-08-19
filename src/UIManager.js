// UI Manager - Creates and manages the user interface

export default class UIManager{
  constructor(anatomy, zoom){
    this.anatomy = anatomy;
    this.zoom = zoom;
    this.onSelectSystem = null;
    this.onSearch = null;
    this.onPeelDepth = null;
    this.onHideMuscle = null;
    this.onReset = null;
    this.onToggleAutoRotation = null;
    this.onToggleLabels = null;

    this._buildUI();
  }

  _buildUI(){
    const wrap = document.createElement('div');
    wrap.style.position = 'absolute';
    wrap.style.inset = '0';
    wrap.style.pointerEvents = 'none';
    wrap.style.fontFamily = 'system-ui, Arial, sans-serif';

    // Panel izquierdo: sistemas
    const panel = document.createElement('div');
    panel.style.position = 'absolute';
    panel.style.top = '20px';
    panel.style.left = '20px';
    panel.style.width = '320px';
    panel.style.padding = '20px';
    panel.style.borderRadius = '16px';
    panel.style.background = 'rgba(17,24,39,0.85)';
    panel.style.color = '#e5e7eb';
    panel.style.backdropFilter = 'blur(10px)';
    panel.style.pointerEvents = 'auto';
    panel.style.border = '1px solid rgba(255,255,255,0.1)';
    panel.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';

    const title = document.createElement('div');
    title.textContent = 'Sistema Muscular 3D';
    title.style.fontWeight = '700';
    title.style.fontSize = '18px';
    title.style.marginBottom = '16px';
    title.style.color = '#ffffff';
    panel.appendChild(title);

    // System selector
    const systemLabel = document.createElement('div');
    systemLabel.textContent = 'Sistemas Anatómicos:';
    systemLabel.style.fontSize = '14px';
    systemLabel.style.marginBottom = '8px';
    systemLabel.style.color = '#d1d5db';
    panel.appendChild(systemLabel);

    const select = document.createElement('select');
    select.style.width = '100%';
    select.style.padding = '12px';
    select.style.borderRadius = '8px';
    select.style.border = '1px solid rgba(255,255,255,0.2)';
    select.style.background = 'rgba(255,255,255,0.1)';
    select.style.color = '#ffffff';
    select.style.fontSize = '14px';
    select.style.outline = 'none';
    select.style.marginBottom = '16px';
    
    const noneOpt = document.createElement('option');
    noneOpt.value = ''; noneOpt.textContent = 'Todos los sistemas';
    select.appendChild(noneOpt);
    
    const systems = this.anatomy.getAvailableSystems();
    for (const s of systems){
      const o = document.createElement('option');
      o.value = s.id; o.textContent = s.name;
      select.appendChild(o);
    }
    select.addEventListener('change', ()=>{
      this.onSelectSystem?.(select.value || null);
    });
    panel.appendChild(select);

    // Search
    const searchLabel = document.createElement('div');
    searchLabel.textContent = 'Buscar músculo:';
    searchLabel.style.fontSize = '14px';
    searchLabel.style.marginBottom = '8px';
    searchLabel.style.color = '#d1d5db';
    panel.appendChild(searchLabel);

    const search = document.createElement('input');
    search.placeholder = 'Buscar estructura…';
    search.style.width = '100%';
    search.style.padding = '12px';
    search.style.borderRadius = '8px';
    search.style.border = '1px solid rgba(255,255,255,0.2)';
    search.style.background = 'rgba(255,255,255,0.1)';
    search.style.color = '#ffffff';
    search.style.fontSize = '14px';
    search.style.outline = 'none';
    search.style.marginBottom = '16px';
    search.addEventListener('input', ()=>{
      const results = this.onSearch?.(search.value) || [];
      list.innerHTML = '';
      results.forEach(r=>{
        const li = document.createElement('div');
        li.textContent = r.name;
        li.style.padding = '8px 12px';
        li.style.cursor = 'pointer';
        li.style.borderRadius = '6px';
        li.style.marginBottom = '4px';
        li.style.background = 'rgba(255,255,255,0.05)';
        li.style.transition = 'background 0.2s';
        li.addEventListener('mouseenter', () => {
          li.style.background = 'rgba(255,255,255,0.1)';
        });
        li.addEventListener('mouseleave', () => {
          li.style.background = 'rgba(255,255,255,0.05)';
        });
        li.addEventListener('click', ()=>{
          this.onSelectSystem?.(r.system);
        });
        list.appendChild(li);
      });
    });
    panel.appendChild(search);

    const list = document.createElement('div');
    list.style.maxHeight = '120px';
    list.style.overflow = 'auto';
    list.style.marginBottom = '16px';
    panel.appendChild(list);

    // Control buttons
    const controlsLabel = document.createElement('div');
    controlsLabel.textContent = 'Controles:';
    controlsLabel.style.fontSize = '14px';
    controlsLabel.style.marginBottom = '8px';
    controlsLabel.style.color = '#d1d5db';
    panel.appendChild(controlsLabel);

    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'grid';
    buttonContainer.style.gridTemplateColumns = '1fr 1fr';
    buttonContainer.style.gap = '8px';
    buttonContainer.style.marginBottom = '16px';
    panel.appendChild(buttonContainer);

    // Hide muscle button
    const hideButton = document.createElement('button');
    hideButton.textContent = 'Ocultar músculo';
    hideButton.style.padding = '8px 12px';
    hideButton.style.borderRadius = '6px';
    hideButton.style.border = '1px solid rgba(255,255,255,0.2)';
    hideButton.style.background = 'rgba(255,255,255,0.1)';
    hideButton.style.color = '#ffffff';
    hideButton.style.fontSize = '12px';
    hideButton.style.cursor = 'pointer';
    hideButton.style.transition = 'background 0.2s';
    hideButton.addEventListener('mouseenter', () => {
      hideButton.style.background = 'rgba(255,255,255,0.2)';
    });
    hideButton.addEventListener('mouseleave', () => {
      hideButton.style.background = 'rgba(255,255,255,0.1)';
    });
    hideButton.addEventListener('click', () => {
      this.onHideMuscle?.();
    });
    buttonContainer.appendChild(hideButton);

    // Reset button
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset';
    resetButton.style.padding = '8px 12px';
    resetButton.style.borderRadius = '6px';
    resetButton.style.border = '1px solid rgba(255,255,255,0.2)';
    resetButton.style.background = 'rgba(255,255,255,0.1)';
    resetButton.style.color = '#ffffff';
    resetButton.style.fontSize = '12px';
    resetButton.style.cursor = 'pointer';
    resetButton.style.transition = 'background 0.2s';
    resetButton.addEventListener('mouseenter', () => {
      resetButton.style.background = 'rgba(255,255,255,0.2)';
    });
    resetButton.addEventListener('mouseleave', () => {
      resetButton.style.background = 'rgba(255,255,255,0.1)';
    });
    resetButton.addEventListener('click', () => {
      this.onReset?.();
    });
    buttonContainer.appendChild(resetButton);

    // Auto rotation toggle
    const autoRotateContainer = document.createElement('div');
    autoRotateContainer.style.display = 'flex';
    autoRotateContainer.style.alignItems = 'center';
    autoRotateContainer.style.justifyContent = 'space-between';
    autoRotateContainer.style.marginBottom = '8px';
    autoRotateContainer.style.padding = '8px 12px';
    autoRotateContainer.style.borderRadius = '6px';
    autoRotateContainer.style.background = 'rgba(255,255,255,0.05)';

    const autoRotateLabel = document.createElement('span');
    autoRotateLabel.textContent = 'Rotación automática';
    autoRotateLabel.style.fontSize = '12px';
    autoRotateLabel.style.color = '#d1d5db';
    autoRotateContainer.appendChild(autoRotateLabel);

    const autoRotateToggle = document.createElement('input');
    autoRotateToggle.type = 'checkbox';
    autoRotateToggle.style.width = '16px';
    autoRotateToggle.style.height = '16px';
    autoRotateToggle.addEventListener('change', () => {
      this.onToggleAutoRotation?.(autoRotateToggle.checked);
    });
    autoRotateContainer.appendChild(autoRotateToggle);
    panel.appendChild(autoRotateContainer);

    // Labels toggle
    const labelsContainer = document.createElement('div');
    labelsContainer.style.display = 'flex';
    labelsContainer.style.alignItems = 'center';
    labelsContainer.style.justifyContent = 'space-between';
    labelsContainer.style.marginBottom = '16px';
    labelsContainer.style.padding = '8px 12px';
    labelsContainer.style.borderRadius = '6px';
    labelsContainer.style.background = 'rgba(255,255,255,0.05)';

    const labelsLabel = document.createElement('span');
    labelsLabel.textContent = 'Etiquetas';
    labelsLabel.style.fontSize = '12px';
    labelsLabel.style.color = '#d1d5db';
    labelsContainer.appendChild(labelsLabel);

    const labelsToggle = document.createElement('input');
    labelsToggle.type = 'checkbox';
    labelsToggle.style.width = '16px';
    labelsToggle.style.height = '16px';
    labelsToggle.addEventListener('change', () => {
      this.onToggleLabels?.(labelsToggle.checked);
    });
    labelsContainer.appendChild(labelsToggle);
    panel.appendChild(labelsContainer);

    // Peel depth slider
    const sliderWrap = document.createElement('div');
    sliderWrap.style.fontSize = '14px';
    sliderWrap.style.fontWeight = '500';
    sliderWrap.style.color = '#e5e7eb';
    sliderWrap.textContent = 'Capas (0 superficial → 2 profundo)';
    panel.appendChild(sliderWrap);

    const slider = document.createElement('input');
    slider.type = 'range'; slider.min = '0'; slider.max = '2'; slider.step = '1'; slider.value = '2';
    slider.style.width = '100%';
    slider.style.marginTop = '8px';
    slider.style.height = '6px';
    slider.style.borderRadius = '3px';
    slider.style.background = 'rgba(255,255,255,0.2)';
    slider.style.outline = 'none';
    slider.style.webkitAppearance = 'none';
    slider.style.appearance = 'none';
    slider.addEventListener('input', ()=>{
      this.onPeelDepth?.(parseInt(slider.value,10));
    });
    panel.appendChild(slider);

    // HUD
    const hud = document.createElement('div');
    hud.style.position = 'absolute';
    hud.style.bottom = '16px';
    hud.style.left = '50%';
    hud.style.transform = 'translateX(-50%)';
    hud.style.padding = '8px 12px';
    hud.style.borderRadius = '999px';
    hud.style.background = 'rgba(17,24,39,0.7)';
    hud.style.color = '#e5e7eb';
    hud.style.pointerEvents = 'none';
    hud.style.display = 'none';
    this._hud = hud;

    wrap.append(panel, hud);
    
    // Add to the app container instead of body
    const appContainer = document.getElementById('app') || document.body;
    appContainer.appendChild(wrap);
  }

  showHud(text){
    this._hud.textContent = text;
    this._hud.style.display = 'block';
  }
  hideHud(){ this._hud.style.display = 'none'; }

  dispose(){
    this._hud?.remove();
  }
}
