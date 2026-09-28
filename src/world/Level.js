// Level.js — сборка играбельного уровня из данных (§45).
// Строит 3D-геометрию и возвращает структурированные рантайм-объекты,
// с которыми работают системы (лут, двери, ключи, укрытия, отвлечения).
import * as THREE from 'three';
import { PALETTE, mat, makeProp, makeLootMesh } from '../render/Assets.js';
import { aabbFromCenter } from './Collision.js';

// Типы реквизита, которые перекрывают линию видимости (высокие).
const VISION_BLOCK_PROPS = new Set(['fridge', 'cabinet', 'shelf', 'counter', 'displayCase', 'stove']);

export class Level {
  constructor(data) {
    this.data = data;
    this.group = new THREE.Group();
    this.colliders = [];       // всё, что блокирует движение
    this.visionBlockers = [];  // стены/высокие объекты, блокирующие обзор
    this.loot = [];
    this.mainLoot = null;
    this.keys = [];
    this.doors = [];
    this.hides = [];
    this.distractables = [];
    this.build();
  }

  build() {
    const d = this.data;
    const pal = PALETTE[d.region] || PALETTE.ROMA;
    const w = d.size.w, dp = d.size.d;

    // Пол.
    const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, dp), mat(d.floorColor ?? pal.floor, { rough: 1 }));
    floor.position.y = -0.1; floor.receiveShadow = true;
    this.group.add(floor);

    // Тонкая сетка «плитки» для читаемости пола.
    const grid = new THREE.GridHelper(Math.max(w, dp), Math.max(w, dp), 0x000000, 0x000000);
    grid.material.opacity = 0.06; grid.material.transparent = true; grid.position.y = 0.005;
    this.group.add(grid);

    // Внешние стены-границы.
    const t = 0.6, h = 2.2;
    const bw = [
      { x: 0, z: -dp / 2, w: w, d: t }, { x: 0, z: dp / 2, w: w, d: t },
      { x: -w / 2, z: 0, w: t, d: dp }, { x: w / 2, z: 0, w: t, d: dp },
    ];
    for (const b of bw) this._wall(b.x, b.z, b.w, b.d, h, pal.wall, true);

    // Внутренние стены.
    for (const wl of d.walls || []) {
      this._wall(wl.x, wl.z, wl.w, wl.d, wl.h ?? h, wl.color ?? pal.wall, wl.blockVision !== false);
    }

    // Реквизит / мебель.
    for (const p of d.props || []) {
      const g = makeProp(p.type, p.color);
      g.position.set(p.x, 0, p.z);
      if (p.rot) g.rotation.y = p.rot;
      this.group.add(g);
      const col = g.userData.collide;
      if (col) {
        // Учитываем поворот на 90° (меняет местами w/d).
        const swap = p.rot && Math.abs(Math.sin(p.rot)) > 0.5;
        const cw = swap ? col.d : col.w, cd = swap ? col.w : col.d;
        const aabb = aabbFromCenter(p.x, p.z, cw, cd);
        this.colliders.push(aabb);
        if (VISION_BLOCK_PROPS.has(p.type) && !p.noVision) this.visionBlockers.push(aabb);
      }
    }

    // Двери.
    for (const dr of d.doors || []) {
      this._door(dr, pal);
    }

    // Лут (мелкий и крупный).
    for (const l of d.loot || []) {
      const m = makeLootMesh(l.kind, l.big);
      m.position.set(l.x, 0, l.z);
      if (l.hidden) m.visible = true; // «спрятанный» = в рискованном месте, но виден
      this.group.add(m);
      this.loot.push({
        id: l.id || ('loot_' + this.loot.length), mesh: m, x: l.x, z: l.z,
        kind: l.kind, value: l.value, big: !!l.big, hidden: !!l.hidden,
        slots: l.slots ?? (l.big ? 2 : 1), name: l.name || null,
        collectible: l.collectible || null, taken: false, isMain: false,
      });
    }

    // Главный лут (§5).
    if (d.mainLoot) {
      const l = d.mainLoot;
      const m = makeLootMesh('main', true);
      m.position.set(l.x, 0, l.z);
      // Луч света над главной целью для читаемости.
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.5, 2.4, 12, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.14, side: THREE.DoubleSide }));
      beam.position.y = 1.3; m.add(beam);
      this.group.add(m);
      this.mainLoot = {
        id: 'MAIN', mesh: m, x: l.x, z: l.z, kind: 'main', value: l.value,
        slots: l.slots ?? 3, name: l.name || 'Obiettivo', big: true, taken: false, isMain: true,
      };
    }

    // Ключи (§17).
    for (const k of d.keys || []) {
      const m = makeLootMesh('key', false);
      m.position.set(k.x, 0, k.z);
      this.group.add(m);
      this.keys.push({ id: k.id, mesh: m, x: k.x, z: k.z, opens: k.opens, taken: false, heldBy: k.heldBy || null });
    }

    // Укрытия (§15).
    for (const hd of d.hides || []) this._hide(hd, pal);

    // Отвлекающие объекты (§16): ТВ/радио.
    for (const ds of d.distractables || []) this._distractable(ds);

    // Выход (§25).
    this._exit(d.exit, pal);

    // Метка старта (коврик).
    if (d.start) {
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.6, 20), mat(0x3fae5a, { opacity: 0.35 }));
      pad.rotation.x = -Math.PI / 2; pad.position.set(d.start.x, 0.02, d.start.z);
      this.group.add(pad);
    }
  }

  _wall(x, z, w, d, h, color, blockVision) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    m.position.set(x, h / 2, z); m.castShadow = true; m.receiveShadow = true;
    this.group.add(m);
    const aabb = aabbFromCenter(x, z, w, d);
    this.colliders.push(aabb);
    if (blockVision) this.visionBlockers.push(aabb);
  }

  _door(dr, pal) {
    const w = dr.w ?? 1.4, thick = 0.24, h = 2.0;
    const rot = dr.rot ?? 0;
    // Полотно двери центрировано на проёме — коллайдер совпадает с ним.
    const pivot = new THREE.Group();
    pivot.position.set(dr.x, 0, dr.z);
    pivot.rotation.y = rot;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w, h, thick), mat(dr.color ?? 0x7a4a28));
    slab.position.set(0, h / 2, 0); slab.castShadow = true;
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mat(0xf4c94a, { emissive: 0x3a2a00, emissiveIntensity: 0.4 }));
    knob.position.set(w / 2 - 0.14, 0, thick / 2 + 0.03); slab.add(knob);
    // Индикатор замка (цветная полоса сверху).
    if ((dr.lock || 'open') !== 'open') {
      const lk = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.14, thick + 0.04),
        mat(dr.lock === 'key' ? 0xf4c94a : 0xff6a3a, { emissive: dr.lock === 'key' ? 0x5a4000 : 0x5a1800, emissiveIntensity: 0.5 }));
      lk.position.y = h - 0.3; slab.add(lk); slab.userData.lockMark = lk;
    }
    pivot.add(slab);
    this.group.add(pivot);

    const swap = Math.abs(Math.sin(rot)) > 0.5;
    const cw = swap ? thick : w, cd = swap ? w : thick;
    const door = {
      id: dr.id, x: dr.x, z: dr.z, w, rot, lock: dr.lock || 'open', keyId: dr.keyId || null,
      code: dr.code || null, open: false, pivot, slab,
      aabb: aabbFromCenter(dr.x, dr.z, cw + 0.02, cd + 0.02),
    };
    this.doors.push(door);
    // Закрытая дверь блокирует и движение, и обзор.
    this.colliders.push(door.aabb);
    this.visionBlockers.push(door.aabb);
  }

  openDoor(door) {
    if (door.open) return;
    door.open = true;
    // Дверь «опускается» в пол и уезжает вбок — проём читаемо освобождается.
    door.slab.position.y = -1.1;
    door.pivot.position.x += Math.cos(door.rot) * (door.w * 0.5);
    door.pivot.position.z += -Math.sin(door.rot) * (door.w * 0.5);
    if (door.slab.userData.lockMark) door.slab.userData.lockMark.material.emissiveIntensity = 0;
    this._removeAabb(this.colliders, door.aabb);
    this._removeAabb(this.visionBlockers, door.aabb);
  }

  _removeAabb(arr, aabb) { const i = arr.indexOf(aabb); if (i >= 0) arr.splice(i, 1); }

  _hide(hd, pal) {
    let g;
    if (hd.type === 'wardrobe' || hd.type === 'closet') {
      g = makeProp('cabinet', 0x3a2a1a);
    } else if (hd.type === 'box' || hd.type === 'crate') {
      g = makeProp('crate', 0x8a5a30);
    } else if (hd.type === 'curtain') {
      g = new THREE.Group();
      const c = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.0, 0.12), mat(0x7d2f3a));
      c.position.y = 1.0; g.add(c); g.userData.collide = { w: 1.2, d: 0.4 };
    } else { // «за мебелью» / стол — используем шкаф по умолчанию
      g = makeProp('cabinet', 0x3a2a1a);
    }
    g.position.set(hd.x, 0, hd.z);
    if (hd.rot) g.rotation.y = hd.rot;
    // Подсветка-иконка укрытия.
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 20), mat(0x4aa6c8, { opacity: 0.5 }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(hd.x, 0.03, hd.z);
    this.group.add(ring);
    this.group.add(g);
    const col = g.userData.collide;
    if (col) {
      const aabb = aabbFromCenter(hd.x, hd.z, col.w, col.d);
      this.colliders.push(aabb);
      this.visionBlockers.push(aabb);
    }
    this.hides.push({ type: hd.type, x: hd.x, z: hd.z, mesh: g, ring, occupied: false });
  }

  _distractable(ds) {
    const g = makeProp(ds.type === 'radio' ? 'shelf' : 'tv', ds.type === 'radio' ? 0x4a3826 : 0x14141a);
    g.position.set(ds.x, 0, ds.z);
    if (ds.rot) g.rotation.y = ds.rot;
    this.group.add(g);
    const col = g.userData.collide;
    if (col) this.colliders.push(aabbFromCenter(ds.x, ds.z, col.w, col.d));
    this.distractables.push({ type: ds.type, x: ds.x, z: ds.z, mesh: g, active: false });
  }

  _exit(exit, pal) {
    if (!exit) return;
    const w = exit.w ?? 1.6, d = exit.d ?? 1.6;
    const pad = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), mat(0x2e6f8e, { emissive: 0x2e6f8e, emissiveIntensity: 0.5 }));
    pad.position.set(exit.x, 0.03, exit.z);
    this.group.add(pad);
    // Светящаяся арка «EXIT».
    const arch = new THREE.Group();
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.8, 0.14), mat(0x3fae5a, { emissive: 0x1f7a3a, emissiveIntensity: 0.6 }));
    p1.position.set(exit.x - w / 2, 0.9, exit.z);
    const p2 = p1.clone(); p2.position.x = exit.x + w / 2;
    const top = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, 0.14, 0.14), mat(0x3fae5a, { emissive: 0x1f7a3a, emissiveIntensity: 0.6 }));
    top.position.set(exit.x, 1.8, exit.z);
    arch.add(p1, p2, top); this.group.add(arch);
    this.exitZone = { x: exit.x, z: exit.z, w, d };
  }

  dispose() {
    this.group.traverse((o) => o.geometry?.dispose?.());
  }
}
