// Interaction.js — контекстные действия (§8, §15–§22, §25).
// Автоподбор мелкого лута, крупный лут с анимацией, двери/ключи, мини-игра
// взлома, укрытия, отвлечения, выключатели камер и выход.
import { dist } from '../core/Util.js';
import { CONFIG } from '../data/gamedata.js';

export class Interaction {
  constructor(session) {
    this.s = session;
    this.keysHeld = new Set();      // id дверей, которые можно открыть найденным ключом
    this.prompt = null;             // {text, kind}
    this.lockpick = null;           // {door, t, dur}
    this.pickReach = 0.95;          // радиус автоподбора
    this.actReach = 1.5;            // радиус ручного взаимодействия
  }

  update(dt) {
    const s = this.s, p = s.player;
    if (p.hidden) { this.prompt = { text: 'Выйти из укрытия  ✋', kind: 'unhide' }; return; }

    // Мини-игра взлома в процессе.
    if (this.lockpick) {
      this.lockpick.t += dt;
      s.lockProgress = this.lockpick.t / this.lockpick.dur;
      if (this.lockpick.t >= this.lockpick.dur) {
        s.level.openDoor(this.lockpick.door);
        s.events.emit('toast', 'Замок вскрыт!');
        this.lockpick.door._picked = true;
        this.lockpick = null; p.busy = false; s.lockProgress = 0;
      }
      this.prompt = { text: 'Взлом…', kind: 'lockpicking' };
      return;
    }

    // Автоподбор мелкого лута (§8).
    for (const l of s.level.loot) {
      if (l.taken || l.big) continue;
      if (dist(p.x, p.z, l.x, l.z) < this.pickReach) this._take(l);
    }

    // Незапертые двери открываются автоматически при подходе (удобство, §25).
    for (const dr of s.level.doors) {
      if (dr.open || dr.lock !== 'open') continue;
      if (dist(p.x, p.z, dr.x, dr.z) < 1.15) { s.level.openDoor(dr); s.addNoise(dr.x, dr.z, CONFIG.noise.door); }
    }

    // Ищем ближайшее ручное взаимодействие.
    this.prompt = this._findPrompt();
  }

  _findPrompt() {
    const s = this.s, p = s.player, R = this.actReach;
    let best = null, bestD = R;
    const consider = (d, text, kind, obj) => { if (d < bestD) { bestD = d; best = { text, kind, obj }; } };

    // Выход (только если цель выполнена).
    if (s.level.exitZone) {
      const e = s.level.exitZone;
      const d = dist(p.x, p.z, e.x, e.z);
      if (d < Math.max(e.w, e.d) / 2 + 0.4) {
        if (s.inventory.hasMain()) return { text: 'СБЕЖАТЬ  ✋', kind: 'exit' };
        else best = { text: 'Сначала возьми цель', kind: 'exit-locked' };
      }
    }
    // Главный лут.
    if (s.level.mainLoot && !s.level.mainLoot.taken) {
      consider(dist(p.x, p.z, s.level.mainLoot.x, s.level.mainLoot.z), `Взять: ${s.level.mainLoot.name}  ✋`, 'main', s.level.mainLoot);
    }
    // Крупный лут.
    for (const l of s.level.loot) {
      if (l.taken || !l.big) continue;
      consider(dist(p.x, p.z, l.x, l.z), `Взять: ${l.name || 'ценность'}  ✋`, 'loot', l);
    }
    // Ключи.
    for (const k of s.level.keys) {
      if (k.taken) continue;
      consider(dist(p.x, p.z, k.x, k.z), 'Взять ключ  ✋', 'key', k);
    }
    // Двери (незапертые открываются сами — не показываем подсказку).
    for (const dr of s.level.doors) {
      if (dr.open || dr.lock === 'open') continue;
      const d = dist(p.x, p.z, dr.x, dr.z);
      let text = 'Открыть дверь  ✋';
      if (dr.lock === 'key') text = this.keysHeld.has(dr.id) ? 'Отпереть дверь  ✋' : '🔒 Нужен ключ';
      else if (dr.lock === 'lockpick' || dr.lock === 'locked') text = 'Взломать замок  ✋';
      else if (dr.lock === 'code') text = 'Взломать (код)  ✋';
      consider(d, text, 'door', dr);
    }
    // Укрытия.
    for (const h of s.level.hides) {
      if (h.occupied) continue;
      consider(dist(p.x, p.z, h.x, h.z), 'Спрятаться  ✋', 'hide', h);
    }
    // Отвлечения.
    for (const ds of s.level.distractables) {
      consider(dist(p.x, p.z, ds.x, ds.z), (ds.type === 'radio' ? 'Включить радио' : 'Включить ТВ') + '  👋', 'distract-device', ds);
    }
    // Выключатели камер.
    for (const sw of s.camSwitches || []) {
      consider(dist(p.x, p.z, sw.x, sw.z), 'Выключить камеры  ✋', 'cam-switch', sw);
    }
    return best;
  }

  doInteract() {
    const s = this.s, p = s.player;
    if (p.hidden) { p.exitHide(); return; }
    const pr = this.prompt;
    if (!pr) return;
    switch (pr.kind) {
      case 'exit': s.win(); break;
      case 'main': this._takeBig(s.level.mainLoot); break;
      case 'loot': this._takeBig(pr.obj); break;
      case 'key': this._takeKey(pr.obj); break;
      case 'door': this._useDoor(pr.obj); break;
      case 'hide': p.enterHide(pr.obj); s.events.emit('toast', 'Спрятался'); break;
      case 'cam-switch': this._camSwitch(pr.obj); break;
      case 'distract-device': this._device(pr.obj); break;
    }
  }

  doDistract() {
    const s = this.s, p = s.player;
    // Ближайшее устройство в пределах досягаемости — включаем, иначе свист.
    let dev = null, dd = 3.0;
    for (const ds of s.level.distractables) { const d = dist(p.x, p.z, ds.x, ds.z); if (d < dd) { dd = d; dev = ds; } }
    if (dev) { this._device(dev); return; }
    // Свист: создаёт шум в точке игрока (§16).
    s.addNoise(p.x, p.z, CONFIG.noise.distraction);
    s.events.emit('toast', 'Свист! 👋');
    p.setEmote('whistle');
  }

  _take(l) {
    if (!s_ok(this.s.inventory, l.slots)) { this.s.events.emit('bagfull'); return; }
    if (!this.s.inventory.add({ id: l.id, kind: l.kind, name: l.name, value: this._val(l.value), slots: l.slots, collectible: l.collectible })) return;
    l.taken = true; l.mesh.visible = false;
    this.s.events.emit('loot', { value: l.value, kind: l.kind });
  }

  _takeBig(l) {
    if (l.taken) return;
    if (!this.s.inventory.canFit(l.slots)) { this.s.events.emit('bagfull'); this.s.events.emit('toast', 'Сумка полна!'); return; }
    const p = this.s.player;
    p.busy = true;
    this.s.events.emit('toast', l.isMain ? 'Беру цель…' : 'Беру…');
    setTimeout(() => {
      p.busy = false;
      l.taken = true; l.mesh.visible = false;
      this.s.inventory.add({ id: l.id, kind: l.kind, name: l.name, value: this._val(l.value), slots: l.slots, isMain: l.isMain, collectible: l.collectible });
      this.s.events.emit('loot', { value: l.value, kind: l.kind, main: l.isMain });
      p.setEmote(l.isMain ? 'happy' : 'grab');
      if (l.isMain) this.s.events.emit('objective', l);
    }, l.isMain ? 900 : 550);
  }

  _takeKey(k) {
    k.taken = true; k.mesh.visible = false;
    this.keysHeld.add(k.opens);
    this.s.events.emit('toast', 'Ключ найден 🔑');
  }

  _useDoor(dr) {
    const s = this.s;
    if (dr.lock === 'open') { s.level.openDoor(dr); s.addNoise(dr.x, dr.z, CONFIG.noise.door); return; }
    if (dr.lock === 'key') {
      if (this.keysHeld.has(dr.id)) { s.level.openDoor(dr); s.addNoise(dr.x, dr.z, CONFIG.noise.door); s.events.emit('toast', 'Отперто 🔑'); }
      else s.events.emit('toast', 'Заперто. Нужен ключ.');
      return;
    }
    // lockpick / locked / code — мини-игра (§18, §19).
    const up = s.save.data.upgrades.lockpick || 0;
    const base = dr.lock === 'code' ? 3.2 : 2.2;
    const dur = Math.max(0.9, base - up * 0.28);
    this.lockpick = { door: dr, t: 0, dur };
    s.player.busy = true;
    s.addNoise(dr.x, dr.z, 1.2);
  }

  _camSwitch(sw) {
    if (sw.used) return;
    sw.used = true;
    for (const cam of this.s.cameras) cam.setDisabled(true);
    this.s.events.emit('toast', 'Камеры отключены 📴');
    if (sw.mesh) sw.mesh.material?.color?.setHex?.(0x224422);
  }

  _device(ds) {
    ds.active = true;
    this.s.addNoise(ds.x, ds.z, CONFIG.noise.distraction);
    this.s.events.emit('toast', ds.type === 'radio' ? 'Радио гремит 📻' : 'ТВ орёт 📺');
  }

  _val(v) {
    // Улучшение «Удача» повышает ценность лута (§34).
    const luck = this.s.save.data.upgrades.luck || 0;
    return Math.round(v * (1 + luck * 0.05));
  }
}

// Локальный помощник (проверка вместимости для мелкого лута).
function s_ok(inv, slots) { return inv.canFit(slots ?? 1); }
