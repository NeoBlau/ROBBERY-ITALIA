// Session.js — активная сессия уровня: связывает игрока, NPC, камеры и все
// системы, ведёт статистику, обрабатывает тревогу/погоню/поимку, победу и провал.
import { Player } from '../entities/Player.js';
import { Npc, STATE } from '../entities/Npc.js';
import { SecurityCamera } from '../entities/SecurityCamera.js';
import { Inventory } from '../systems/Inventory.js';
import { Interaction } from '../systems/Interaction.js';
import { computeVision } from '../systems/Detection.js';
import { evaluate } from '../systems/Scoring.js';
import { EventBus, dist } from '../core/Util.js';
import { CONFIG } from '../data/gamedata.js';

export class Session {
  constructor(level, save, renderer, onEnd) {
    this.level = level;
    this.save = save;
    this.renderer = renderer;
    this.onEnd = onEnd;
    this.events = new EventBus();

    this.time = 0;
    this.finished = false;
    this.result = null;
    this.noises = [];
    this.lockProgress = 0;
    this.alarmRaised = false;
    this.chaseActive = false;

    // Статистика для оценки (§26).
    this.stats = {
      time: 0, detections: 0, lootValue: 0, totalLootValue: 0,
      usedDisguise: false, alarmRaised: false, usedHide: false,
    };

    this.player = new Player(level, save);
    this.stats.usedDisguise = !!this.player.disguise;
    level.group.add(this.player.mesh);

    this.inventory = new Inventory(save);

    // NPC.
    this.npcs = [];
    for (const sp of level.data.npcs || []) this._addNpc(sp);
    for (const dg of level.data.dogs || []) this._addNpc({ ...dg, type: 'dog', isDog: true, dangerous: true });

    // Камеры наблюдения.
    this.cameras = [];
    for (const cs of level.data.cameras || []) {
      const c = new SecurityCamera(cs); this.cameras.push(c); level.group.add(c.mesh);
    }
    // Выключатели камер.
    this.camSwitches = (level.data.camSwitches || []).map((s) => ({ ...s, used: false }));

    // Резерв полиции (§23), появляется по тревоге.
    this.policeSpawns = level.data.police || [];
    this.policeSpawned = false;

    this.interaction = new Interaction(this);

    // Подсчёт полной ценности лута (для процента сбора).
    for (const l of level.data.loot || []) this.stats.totalLootValue += l.value || 0;
    if (level.data.mainLoot) this.stats.totalLootValue += level.data.mainLoot.value || 0;

    // Реакции на события.
    this.events.on('loot', (e) => { this.stats.lootValue += e.value || 0; });

    this.stStealth = save.data.upgrades.stealth || 0;
  }

  _addNpc(sp) {
    const n = new Npc(sp, this.level);
    n._wasChasing = false;
    this.npcs.push(n);
    this.level.group.add(n.mesh);
    return n;
  }

  addNoise(x, z, radius) { this.noises.push({ x, z, radius }); }

  win() {
    if (this.finished) return;
    this.finished = true;
    this.stats.time = this.time;
    this.stats.alarmRaised = this.alarmRaised;
    this.result = evaluate(this.level, this.stats);
    this.result.status = 'win';
    // Сохранение прогресса.
    this.save.addMoney(this.result.money);
    this.save.levelResult(this.level.data.id, this.result);
    for (const c of this.inventory.collectibles()) this.save.addCollectible(c);
    this.onEnd(this.result);
  }

  lose(reason) {
    if (this.finished) return;
    this.finished = true;
    this.stats.time = this.time;
    this.result = { status: 'lose', reason, stars: 0, money: 0, time: this.time, challenges: [] };
    this.onEnd(this.result);
  }

  update(dt, input) {
    if (this.finished) return;
    this.time += dt;
    this.noises.length = 0;

    // Действия.
    for (const a of input.consumeActions()) {
      if (a === 'pause') { this.events.emit('pause'); return; }
      if (a === 'interact') this.interaction.doInteract();
      if (a === 'distract') this.interaction.doDistract();
    }

    // Движение игрока + шум движения.
    const mv = input.getMove();
    this.player.update(dt, mv, this.level.colliders);
    if (this.player.noiseThisFrame > 0) this.addNoise(this.player.x, this.player.z, this.player.noiseThisFrame);
    if (this.player.hidden) this.stats.usedHide = true;

    this.interaction.update(dt);

    // Камера следует за игроком.
    this.renderer.camControl.setTarget(this.player.x, this.player.z);

    // Камеры наблюдения.
    let camTriggered = false;
    for (const c of this.cameras) {
      if (c.update(dt, this.player, this.level.visionBlockers)) camTriggered = true;
    }
    if (camTriggered) this._raiseAlarm(this.player.x, this.player.z);

    // NPC: зрение + мышление.
    let anyChase = false, maxSusp = 0;
    for (const n of this.npcs) {
      const vis = computeVision(n, this.player, this.level.visionBlockers, this.player.disguise, this.stStealth);
      n.think({ dt, time: this.time, player: this.player, colliders: this.level.colliders, noises: this.noises, canSeePlayer: vis.canSee, seeInfo: vis });

      // Учёт «обнаружений»: вход в CHASE считается одним обнаружением.
      if (n.state === STATE.CHASE) {
        anyChase = true;
        if (!n._wasChasing) { this.stats.detections++; n._wasChasing = true; this.events.emit('detected'); }
      } else if (n.suspicion < 0.2) {
        n._wasChasing = false;
      }
      maxSusp = Math.max(maxSusp, n.suspicion);

      // Поимка (§24): опасный NPC вплотную во время погони.
      if (n.dangerous && n.state === STATE.CHASE && dist(n.x, n.z, this.player.x, this.player.z) < CONFIG.detect.catchDist && !this.player.hidden) {
        this.lose('caught'); return;
      }
    }

    this.chaseActive = anyChase || camTriggered;
    if (this.chaseActive) this.renderer.camControl.addShake(0.05);

    // Экспорт состояния для HUD.
    this.hud = {
      time: this.time,
      suspicion: maxSusp,
      chase: this.chaseActive,
      alarm: this.alarmRaised,
      prompt: this.interaction.prompt,
      lockProgress: this.lockProgress,
      inv: { used: this.inventory.used, cap: this.inventory.capacity, value: this.inventory.totalValue() },
      objectiveDone: this.inventory.hasMain(),
      lootFrac: this.stats.totalLootValue ? this.stats.lootValue / this.stats.totalLootValue : 0,
      emote: this.player.emote,
    };
  }

  _raiseAlarm(x, z) {
    this.alarmRaised = true;
    // Все опасные NPC устремляются к точке.
    for (const n of this.npcs) {
      if (n.dangerous) { n.state = STATE.CHASE; n.suspicion = 1; n.lastSeen = { x, z }; n.target = { x, z }; }
    }
    // Подмога полиции (§23) — один раз.
    if (!this.policeSpawned && this.policeSpawns.length) {
      this.policeSpawned = true;
      for (const ps of this.policeSpawns) {
        const n = this._addNpc({ ...ps, type: ps.type || 'police', dangerous: true, speed: ps.speed ?? 2.0 });
        n.state = STATE.CHASE; n.suspicion = 1; n.target = { x, z }; n.lastSeen = { x, z };
      }
      this.events.emit('toast', '🚨 Polizia!');
    }
  }

  dispose() { this.events.clear(); }
}
