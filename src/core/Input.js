// Input.js — ввод с клавиатуры и сенсорного экрана.
// Отдаёт нормализованный вектор движения (mx,mz в [-1..1]), флаг бега,
// и события действий (interact / distract / pause).
export class Input {
  constructor(touchRoot) {
    this.keys = new Set();
    this.mx = 0; this.mz = 0;
    this.run = false;
    this._actionQueue = [];
    this.touchRoot = touchRoot;

    this._kd = (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
      const k = e.key.toLowerCase();
      this.keys.add(k);
      if (k === 'shift') this.run = true;
      if (k === 'e' || k === 'enter') this._actionQueue.push('interact');
      if (k === 'q') this._actionQueue.push('distract');
      if (k === 'escape' || k === 'p') this._actionQueue.push('pause');
    };
    this._ku = (e) => {
      const k = e.key.toLowerCase();
      this.keys.delete(k);
      if (k === 'shift') this.run = false;
    };
    addEventListener('keydown', this._kd);
    addEventListener('keyup', this._ku);

    this._buildTouch();
  }

  consumeActions() { const a = this._actionQueue; this._actionQueue = []; return a; }
  pushAction(a) { this._actionQueue.push(a); }

  getMove() {
    let x = 0, z = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) z -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) z += 1;
    // Приоритет сенсорному джойстику, если активен.
    if (this._joyActive) { x = this._joyX; z = this._joyZ; }
    const len = Math.hypot(x, z);
    if (len > 1) { x /= len; z /= len; }
    return { x, z, run: this.run || this._touchRun };
  }

  _buildTouch() {
    if (!this.touchRoot) return;
    const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    // Джойстик показываем всегда на coarse-указателях; на десктопе скрыт.
    this.touchRoot.classList.toggle('show', isTouch);

    const joy = document.createElement('div'); joy.className = 'joy';
    const nub = document.createElement('div'); nub.className = 'joy-nub';
    joy.appendChild(nub); this.touchRoot.appendChild(joy);
    this._joyActive = false; this._joyX = 0; this._joyZ = 0;

    let cx = 0, cy = 0, R = 55, id = null;
    const start = (px, py, pid) => {
      id = pid; cx = px; cy = py; this._joyActive = true;
      joy.style.left = px + 'px'; joy.style.top = py + 'px'; joy.classList.add('active');
    };
    const move = (px, py) => {
      let dx = px - cx, dy = py - cy;
      const l = Math.hypot(dx, dy);
      if (l > R) { dx = dx / l * R; dy = dy / l * R; }
      nub.style.transform = `translate(${dx}px,${dy}px)`;
      this._joyX = dx / R; this._joyZ = dy / R;
    };
    const end = () => { this._joyActive = false; this._joyX = 0; this._joyZ = 0; id = null; nub.style.transform = 'translate(0,0)'; joy.classList.remove('active'); };

    const zone = this.touchRoot;
    zone.addEventListener('touchstart', (e) => {
      for (const t of e.changedTouches) {
        if (t.clientX < innerWidth * 0.55 && id === null) { start(t.clientX, t.clientY, t.identifier); e.preventDefault(); }
      }
    }, { passive: false });
    zone.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) if (t.identifier === id) { move(t.clientX, t.clientY); e.preventDefault(); }
    }, { passive: false });
    zone.addEventListener('touchend', (e) => { for (const t of e.changedTouches) if (t.identifier === id) end(); }, { passive: false });
    zone.addEventListener('touchcancel', end);

    // Кнопки действий справа.
    const btns = document.createElement('div'); btns.className = 'touch-btns'; this.touchRoot.appendChild(btns);
    const mkBtn = (label, action, run = false) => {
      const b = document.createElement('button'); b.className = 'tbtn'; b.textContent = label;
      const press = (e) => { e.preventDefault(); if (run) this._touchRun = true; else this._actionQueue.push(action); };
      const rel = (e) => { e.preventDefault(); if (run) this._touchRun = false; };
      b.addEventListener('touchstart', press, { passive: false });
      b.addEventListener('touchend', rel, { passive: false });
      btns.appendChild(b); return b;
    };
    this._touchRun = false;
    mkBtn('🏃', null, true);
    mkBtn('👋', 'distract');
    mkBtn('✋', 'interact');
  }

  dispose() { removeEventListener('keydown', this._kd); removeEventListener('keyup', this._ku); }
}
