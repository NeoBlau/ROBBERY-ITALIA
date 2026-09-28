// SecurityCamera.js — камера наблюдения (§22): вращается сектором, замечает
// игрока по линии видимости и поднимает тревогу. Может быть отключена
// (через выключатель — обрабатывается в системе взаимодействия).
import * as THREE from 'three';
import { mat } from '../render/Assets.js';
import { lineBlocked } from '../world/Collision.js';
import { angleDiff, angleTo, dist } from '../core/Util.js';

export class SecurityCamera {
  constructor(spawn) {
    this.spawn = spawn;
    this.x = spawn.x; this.z = spawn.z;
    this.baseDir = spawn.dir ?? 0;
    this.sweep = (spawn.sweep ?? 60) * Math.PI / 180;   // амплитуда качания
    this.fov = (spawn.fov ?? 45) * Math.PI / 180;
    this.range = spawn.range ?? 8;
    this.speed = spawn.speed ?? 0.6;
    this.disabled = false;
    this.detect = 0;   // 0..1 накопление обнаружения
    this._t = Math.random() * 10;

    this.mesh = new THREE.Group();
    this.mesh.position.set(this.x, 2.0, this.z);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.4), mat(0x2a2a30));
    arm.position.z = 0.15; this.mesh.add(arm);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.3), mat(0x3a3a42));
    body.position.z = 0.32; this.mesh.add(body);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), mat(0xff3b30, { emissive: 0xff3b30, emissiveIntensity: 0.8 }));
    led.position.set(0, 0, 0.48); this.mesh.add(led); this.led = led;

    // Сектор обзора на полу.
    const geo = new THREE.CircleGeometry(this.range, 18, -this.fov / 2 + Math.PI / 2, this.fov);
    this.coneMat = new THREE.MeshBasicMaterial({ color: 0xff9d33, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false });
    this.cone = new THREE.Mesh(geo, this.coneMat);
    this.cone.rotation.x = -Math.PI / 2; this.cone.position.set(0, -1.98, 0);
    this.mesh.add(this.cone);
    this.dir = this.baseDir;
  }

  setDisabled(v) {
    this.disabled = v;
    this.led.material.emissiveIntensity = v ? 0 : 0.8;
    this.led.material.color.setHex(v ? 0x224422 : 0xff3b30);
    this.cone.visible = !v;
  }

  // Возвращает true, если камера сейчас видит игрока (для системы тревоги).
  update(dt, player, blockers) {
    if (this.disabled) return false;
    this._t += dt;
    this.dir = this.baseDir + Math.sin(this._t * this.speed) * this.sweep;
    this.mesh.rotation.y = this.dir;

    if (player.hidden) { this._cool(dt); return false; }
    const d = dist(this.x, this.z, player.x, player.z);
    if (d > this.range) { this._cool(dt); return false; }
    const a = angleTo(this.x, this.z, player.x, player.z);
    if (angleDiff(a, this.dir) > this.fov / 2) { this._cool(dt); return false; }
    if (lineBlocked(this.x, this.z, player.x, player.z, blockers)) { this._cool(dt); return false; }

    this.detect = Math.min(1, this.detect + dt * 0.9);
    this.coneMat.color.setHex(0xff3b30);
    this.coneMat.opacity = 0.2 + this.detect * 0.25;
    return this.detect >= 1;
  }

  _cool(dt) {
    this.detect = Math.max(0, this.detect - dt * 0.7);
    this.coneMat.color.setHex(0xff9d33);
    this.coneMat.opacity = 0.14;
  }
}
