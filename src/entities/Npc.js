// Npc.js — житель/охранник/собака (§10, §11, §12). Патрулирование по маршруту,
// конечный автомат состояний, реакция на шум и погоня. Зона обзора рисуется
// цветным конусом для читаемости (зелёный/жёлтый/красный).
import * as THREE from 'three';
import { makeCharacter, makeProp, mat } from '../render/Assets.js';
import { moveCircle } from '../world/Collision.js';
import { CONFIG } from '../data/gamedata.js';
import { angleTo, wrapAngle, dist, damp, clamp } from '../core/Util.js';

export const STATE = { NORMAL: 'NORMAL', SUSPICIOUS: 'SUSPICIOUS', ALERT: 'ALERT', CHASE: 'CHASE', SEARCH: 'SEARCH', RETURN: 'RETURN' };

const COLORS_BY_TYPE = {
  guard:   { body: 0x2a3550, hat: 0x14141a },
  police:  { body: 0x1f3a6a, hat: 0x0a1730 },
  carabiniere: { body: 0x101828, hat: 0xb01818 },
  owner:   { body: 0x6a4a7a, hat: null },
  waiter:  { body: 0x22222a, hat: null },
  cook:    { body: 0xe8e8ee, hat: 0xffffff },
  seller:  { body: 0x3a5a4a, hat: null },
  tourist: { body: 0xff7043, hat: 0xf4c94a },
  worker:  { body: 0xd08a2a, hat: 0xffd24a },
  guest:   { body: 0x4a5a8a, hat: null },
};

export class Npc {
  constructor(spawn, level) {
    this.spawn = spawn;
    this.level = level;
    this.type = spawn.type || 'owner';
    this.isDog = spawn.isDog || this.type === 'dog';
    this.dangerous = spawn.dangerous ?? (['guard', 'police', 'carabiniere', 'dog'].includes(this.type));
    this.disguiseZone = spawn.disguiseZone || null; // тип костюма, к которому NPC лоялен

    this.path = (spawn.path && spawn.path.length ? spawn.path : [{ x: spawn.x ?? 0, z: spawn.z ?? 0 }]);
    this.pathI = 0; this.waitT = 0;
    this.speed = spawn.speed ?? (this.isDog ? 2.4 : 1.5);
    this.chaseSpeed = this.speed * (this.isDog ? 1.9 : 1.7);

    this.x = this.path[0].x; this.z = this.path[0].z;
    // Изначально смотрит вдоль маршрута (или в заданную сторону), а не в спавн игрока.
    if (spawn.face != null) this.angle = spawn.face;
    else if (this.path.length > 1) this.angle = angleTo(this.x, this.z, this.path[1].x, this.path[1].z);
    else this.angle = 0;
    this.radius = CONFIG.npcRadius;

    // Параметры обзора.
    this.fov = (spawn.fov ?? (this.isDog ? 70 : 95)) * Math.PI / 180;
    this.range = spawn.range ?? (this.isDog ? 5 : 7);
    this.hearMul = this.isDog ? 1.6 : 1.0;

    this.state = STATE.NORMAL;
    this.suspicion = 0;         // 0..1, при 1 → ALERT/CHASE
    this.target = null;         // точка расследования {x,z}
    this.lastSeen = null;
    this.searchT = 0;
    this.canSee = false;

    this._build();
  }

  _build() {
    this.mesh = new THREE.Group();
    if (this.isDog) {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.7), mat(0x5a4230));
      body.position.y = 0.34; body.castShadow = true;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.3), mat(0x4a3626));
      head.position.set(0, 0.42, 0.42); body.add(head);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.3), mat(0x4a3626));
      tail.position.set(0, 0.42, -0.42); body.add(tail);
      this.mesh.add(body); this.mesh.userData.head = head;
    } else {
      const c = COLORS_BY_TYPE[this.type] || COLORS_BY_TYPE.owner;
      this.mesh = makeCharacter(c.body, 0xe8b98f, c.hat);
    }
    this.mesh.position.set(this.x, 0, this.z);

    // Конус обзора (плоский сектор на полу).
    if (this.dangerous || this.type === 'owner') {
      const seg = 20;
      const geo = new THREE.CircleGeometry(this.range, seg, -this.fov / 2 + Math.PI / 2, this.fov);
      this.coneMat = new THREE.MeshBasicMaterial({ color: 0x3fae5a, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
      this.cone = new THREE.Mesh(geo, this.coneMat);
      this.cone.rotation.x = -Math.PI / 2;
      this.cone.position.y = 0.04;
      this.mesh.add(this.cone);
    }
  }

  // Основной апдейт ИИ. ctx: { dt, player, colliders, noises[], canSeePlayer(bool), seeInfo }
  think(ctx) {
    const dt = ctx.dt;
    // Реакция на шум (кроме мирных, которые не реагируют, если не dangerous и не owner).
    if ((this.dangerous || this.type === 'owner') && this.state !== STATE.CHASE) {
      for (const n of ctx.noises) {
        const d = dist(this.x, this.z, n.x, n.z);
        if (d < n.radius * this.hearMul) {
          this.target = { x: n.x, z: n.z };
          if (this.state === STATE.NORMAL) this.state = STATE.SUSPICIOUS;
          this.searchT = 4.5;
        }
      }
    }

    // Обновление подозрения по зрению.
    if (ctx.canSeePlayer) {
      const rate = CONFIG.detect.suspectRate * (this.isDog ? 1.5 : 1) * ctx.seeInfo.closeness;
      this.suspicion = clamp(this.suspicion + rate * dt, 0, 1.0);
      this.lastSeen = { x: ctx.player.x, z: ctx.player.z };
      this.target = { x: ctx.player.x, z: ctx.player.z };
      if (this.suspicion >= CONFIG.detect.alertThreshold) this.state = STATE.CHASE;
      else if (this.suspicion > 0.35 && this.state === STATE.NORMAL) this.state = STATE.SUSPICIOUS;
    } else {
      this.suspicion = clamp(this.suspicion - CONFIG.detect.loseRate * dt, 0, 1);
      if (this.state === STATE.CHASE && this.suspicion < 0.5) { this.state = STATE.SEARCH; this.searchT = 5; }
    }

    switch (this.state) {
      case STATE.NORMAL: this._patrol(ctx); break;
      case STATE.SUSPICIOUS: this._goTo(ctx, this.target, this.speed * 1.15); this._faceTarget();
        if (this.target && dist(this.x, this.z, this.target.x, this.target.z) < 0.6) { this.state = STATE.SEARCH; this.searchT = 3; }
        break;
      case STATE.CHASE: this._chase(ctx); break;
      case STATE.SEARCH: this._search(ctx); break;
      case STATE.RETURN: this._return(ctx); break;
    }

    this._updateVisual(ctx, dt);
  }

  _patrol(ctx) {
    if (this.path.length < 2) { this._face(this.spawn.face ?? this.angle); return; }
    if (this.waitT > 0) { this.waitT -= ctx.dt; return; }
    const tp = this.path[this.pathI];
    this._goTo(ctx, tp, this.speed);
    if (dist(this.x, this.z, tp.x, tp.z) < 0.35) {
      this.waitT = tp.wait ?? this.spawn.wait ?? 0.6;
      this.pathI = (this.pathI + 1) % this.path.length;
    }
  }

  _chase(ctx) {
    const tp = this.lastSeen || this.target;
    if (tp) { this._goTo(ctx, tp, this.chaseSpeed); this._faceTarget(); }
  }

  _search(ctx) {
    this.searchT -= ctx.dt;
    if (this.target) { this._goTo(ctx, this.target, this.speed); }
    // Оглядывается по сторонам.
    this.angle += Math.sin(ctx.time * 3) * ctx.dt * 1.2;
    if (this.searchT <= 0) { this.state = STATE.RETURN; }
  }

  _return(ctx) {
    const home = this.path[this.pathI] || this.path[0];
    this._goTo(ctx, home, this.speed);
    if (dist(this.x, this.z, home.x, home.z) < 0.4) { this.state = STATE.NORMAL; this.suspicion = 0; }
  }

  _goTo(ctx, tp, speed) {
    if (!tp) return;
    const a = angleTo(this.x, this.z, tp.x, tp.z);
    const dx = Math.sin(a) * speed * ctx.dt;
    const dz = Math.cos(a) * speed * ctx.dt;
    const res = moveCircle(this.x, this.z, this.radius, dx, dz, ctx.colliders);
    this.x = res.x; this.z = res.z;
    this._face(a);
    this.walking = true;
  }

  _face(a) { this.angle = a; }
  _faceTarget() { if (this.target) this.angle = angleTo(this.x, this.z, this.target.x, this.target.z); }

  _updateVisual(ctx, dt) {
    this.mesh.position.set(this.x, 0, this.z);
    const cur = this.mesh.rotation.y;
    this.mesh.rotation.y = cur + wrapAngle(this.angle - cur) * Math.min(1, dt * 10);
    // Цвет конуса по состоянию/подозрению.
    if (this.coneMat) {
      let col = 0x3fae5a;
      if (this.state === STATE.CHASE) col = 0xff3b30;
      else if (this.suspicion > 0.35 || this.state === STATE.SUSPICIOUS || this.state === STATE.SEARCH) col = 0xffcc33;
      this.coneMat.color.setHex(col);
      this.coneMat.opacity = 0.14 + this.suspicion * 0.18;
    }
    // Анимация ног.
    if (this.mesh.userData.legs) {
      const spd = (this.state === STATE.CHASE) ? 18 : 9;
      if (this.walking) { this._bob = (this._bob || 0) + dt * spd; this.mesh.userData.legs.rotation.x = Math.sin(this._bob) * 0.25; }
    }
    this.walking = false;
  }
}
