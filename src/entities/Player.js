// Player.js — управляемый вор (§33). Движение, столкновения, анимация,
// состояние укрытия, эмиссия шума при движении.
import { makeCharacter } from '../render/Assets.js';
import { moveCircle } from '../world/Collision.js';
import { CONFIG, COSTUMES } from '../data/gamedata.js';
import { clamp, damp, wrapAngle } from '../core/Util.js';

export class Player {
  constructor(level, save) {
    this.level = level;
    this.save = save;
    const cs = COSTUMES[save.data.costume] || COSTUMES.classic;
    this.disguise = cs.disguise;
    this.mesh = makeCharacter(cs.color, 0xe8b98f, cs.hat);
    this.x = level.data.start.x; this.z = level.data.start.z;
    this.angle = 0; this.mesh.position.set(this.x, 0, this.z);

    this.radius = CONFIG.playerRadius;
    const spd = save.data.upgrades.speed || 0;
    this.walkSpeed = CONFIG.baseSpeedWalk * (1 + spd * 0.06);
    this.runSpeed = CONFIG.baseSpeedRun * (1 + spd * 0.06);
    this.noiseMul = 1 - (save.data.upgrades.noise || 0) * 0.12;

    this.moving = false; this.running = false;
    this.hidden = false; this.hideSpot = null;
    this.speedFactor = 1;   // модификатор (взлом/переноска тяжёлого)
    this.busy = false;      // занят анимацией взаимодействия
    this._bob = 0;
    this.noiseThisFrame = 0;
    this.emote = null; this._emoteT = 0;
  }

  setEmote(kind, dur = 1.2) { this.emote = kind; this._emoteT = dur; }

  update(dt, move, colliders) {
    this.noiseThisFrame = 0;
    if (this.busy || this.hidden) { this.moving = false; this._animate(dt); return; }

    const wantRun = move.run;
    const speed = (wantRun ? this.runSpeed : this.walkSpeed) * this.speedFactor;
    let dx = move.x * speed * dt;
    let dz = move.z * speed * dt;
    const mag = Math.hypot(move.x, move.z);
    this.moving = mag > 0.05;
    this.running = this.moving && wantRun;

    if (this.moving) {
      const res = moveCircle(this.x, this.z, this.radius, dx, dz, colliders);
      this.x = res.x; this.z = res.z;
      this.angle = wrapAngle(Math.atan2(move.x, move.z));
      // Шум движения (§13): бег громкий, ходьба почти бесшумна.
      const base = wantRun ? CONFIG.noise.run : CONFIG.noise.walk;
      this.noiseThisFrame = base * this.noiseMul;
    }
    this._animate(dt);
  }

  _animate(dt) {
    this.mesh.position.set(this.x, 0, this.z);
    // Плавный поворот к направлению.
    const cur = this.mesh.rotation.y;
    let target = this.angle;
    let diff = wrapAngle(target - cur);
    this.mesh.rotation.y = cur + diff * Math.min(1, dt * 14);
    // Покачивание при ходьбе.
    const parts = this.mesh.userData;
    if (this.moving) {
      this._bob += dt * (this.running ? 16 : 10);
      const s = Math.sin(this._bob) * (this.running ? 0.12 : 0.07);
      parts.torso.position.y = 0.78 + Math.abs(s) * 0.4;
      parts.legs.rotation.x = s;
    } else {
      this._bob = 0; parts.legs.rotation.x = damp(parts.legs.rotation.x, 0, 12, dt);
      parts.torso.position.y = damp(parts.torso.position.y, 0.78, 12, dt);
    }
    if (this._emoteT > 0) { this._emoteT -= dt; if (this._emoteT <= 0) this.emote = null; }
  }

  enterHide(spot) {
    this.hidden = true; this.hideSpot = spot; spot.occupied = true;
    this.mesh.visible = false;
    this.x = spot.x; this.z = spot.z;
  }
  exitHide() {
    if (!this.hidden) return;
    this.hidden = false; this.mesh.visible = true;
    if (this.hideSpot) this.hideSpot.occupied = false; this.hideSpot = null;
  }
}
