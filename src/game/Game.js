// Game.js — оркестратор: рендер, ввод, сохранение, UI и игровой цикл (§44).
// Управляет переходами меню ↔ карта ↔ уровень ↔ результат (§41).
import { Renderer } from '../render/Renderer.js';
import { Input } from '../core/Input.js';
import { Save } from '../core/Save.js';
import { UI } from '../ui/UI.js';
import { Level } from '../world/Level.js';
import { Session } from './Session.js';
import { LEVELS, getLevel, nextLevelId } from '../data/levels.js';
import { clamp } from '../core/Util.js';

export class Game {
  constructor(canvas, uiRoot, touchRoot) {
    this.renderer = new Renderer(canvas);
    this.input = new Input(touchRoot);
    this.save = new Save();
    this.ui = new UI(uiRoot, this);

    this.state = 'menu';
    this.level = null;
    this.session = null;
    this._last = performance.now();

    this.renderer.setMood('day');
    this.ui.mainMenu();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  // Колбэки из UI ---------------------------------------------------------
  playLevel(id) {
    const data = getLevel(id);
    if (!data) { this.ui.toast('Уровень скоро'); return; }
    this._teardownSession();
    this.renderer.clearWorld();
    this.level = new Level(data);
    this.renderer.worldRoot.add(this.level.group);
    this.renderer.setMood(data.mood || 'day');
    this.renderer.camControl.setTarget(data.start.x, data.start.z, true);

    this.session = new Session(this.level, this.save, this.renderer, (res) => this._onEnd(res));
    this.session.events.on('toast', (m) => this.ui.toast(m));
    this.session.events.on('pause', () => this.pause());
    this.session.events.on('detected', () => this.ui.toast('👀 Тебя заметили!'));
    this.session.events.on('bagfull', () => this.ui.toast('🎒 Сумка полна!'));

    this.ui.showHUD();
    this.state = 'playing';
  }

  pause() { if (this.state !== 'playing') return; this.state = 'paused'; this.ui.pause(); }
  resume() { if (this.state !== 'paused') return; this.ui.closePause(); this.state = 'playing'; this._last = performance.now(); }
  restart() { if (this.level) this.playLevel(this.level.data.id); }
  quitToMap() {
    const region = this.level?.data.region;
    this._teardownSession(); this.renderer.clearWorld(); this.state = 'menu';
    if (region) this.ui.region(region); else this.ui.map();
  }

  _onEnd(res) {
    this.state = 'result';
    const nextId = res.status === 'win' ? nextLevelId(this.level.data.id) : null;
    // Небольшая пауза, чтобы анимация «взял цель» доиграла.
    setTimeout(() => this.ui.result(res, this.level, nextId), 300);
  }

  _teardownSession() {
    if (this.session) { this.session.dispose(); this.session = null; }
    if (this.level) { this.level = null; }
  }

  _loop(t) {
    const dt = clamp((t - this._last) / 1000, 0, 0.05);
    this._last = t;
    if (this.state === 'playing' && this.session) {
      this.session.update(dt, this.input);
      this.ui.updateHUD(this.session.hud);
    }
    this.renderer.render(dt);
    requestAnimationFrame(this._loop);
  }
}
