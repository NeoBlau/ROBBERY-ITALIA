// Assets.js — палитра, кэш материалов и процедурная геометрия.
// Стиль: яркий, стилизованный, слегка мультяшный, узнаваемо итальянский.
// Мы не грузим внешние модели — вся геометрия строится из примитивов, что даёт
// чистый «настольный» вид сверху и мгновенную загрузку.
import * as THREE from 'three';

// Итальянская палитра по регионам (тёплые терракоты, охра, оливка, море).
export const PALETTE = {
  ROMA:    { floor: 0xd9c3a5, wall: 0xc9885b, accent: 0x9c3b2e, roof: 0xb5613b },
  MILANO:  { floor: 0xe7e7ec, wall: 0x8f97a8, accent: 0x2f3a4a, roof: 0x5b6472 },
  VENEZIA: { floor: 0xcbb189, wall: 0xb07c8f, accent: 0x2e6f8e, roof: 0x7d4a63 },
  NAPOLI:  { floor: 0xe3cfa0, wall: 0xd98a4e, accent: 0xc23b2b, roof: 0xbf6a34 },
  FIRENZE: { floor: 0xd7c39a, wall: 0xb98a55, accent: 0x6a3f2b, roof: 0x8a5a34 },
  AMALFI:  { floor: 0xefe0bf, wall: 0xf0f2f5, accent: 0x2b8fb0, roof: 0xd98f5a },
};

export const MOOD = {
  day:     { sky: 0x9fd0e8, fog: 0xbfe0ef, ambient: 0.85, sun: 1.05, sunColor: 0xfff2d6 },
  morning: { sky: 0xf3d9b6, fog: 0xf0dcc2, ambient: 0.8,  sun: 0.95, sunColor: 0xffe1b0 },
  evening: { sky: 0xf0a98a, fog: 0xdf9d86, ambient: 0.6,  sun: 0.7,  sunColor: 0xff9d66 },
  night:   { sky: 0x1a2036, fog: 0x171d30, ambient: 0.35, sun: 0.28, sunColor: 0x8fa6ff },
};

// Кэш материалов, чтобы не плодить дубликаты.
const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + ':' + (opts.rough ?? 0.9) + ':' + (opts.metal ?? 0) + ':' + (opts.emissive ?? 0) + ':' + (opts.opacity ?? 1);
  if (matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshLambertMaterial({
    color,
    emissive: opts.emissive ? new THREE.Color(opts.emissive) : 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    transparent: (opts.opacity ?? 1) < 1,
    opacity: opts.opacity ?? 1,
  });
  matCache.set(key, m);
  return m;
}

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, seg = 12) => new THREE.CylinderGeometry(rt, rb, h, seg);

function meshBox(w, h, d, color, opts) {
  const m = new THREE.Mesh(box(w, h, d), mat(color, opts));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function meshCyl(rt, rb, h, color, seg, opts) {
  const m = new THREE.Mesh(cyl(rt, rb, h, seg), mat(color, opts));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// ---- Каталог процедурного реквизита -------------------------------------
// Каждая функция возвращает THREE.Group высотой, стоящей на полу (y=0 снизу).
// Многие возвращают также .userData.collide = {w,d} (габарит для столкновений).

function group(...children) {
  const g = new THREE.Group();
  children.forEach((c) => c && g.add(c));
  return g;
}

const props = {
  table(c = 0x6b4a2f) {
    const top = meshBox(1.1, 0.12, 0.7, c); top.position.y = 0.62;
    const legG = [];
    for (const [x, z] of [[-0.45, -0.28], [0.45, -0.28], [-0.45, 0.28], [0.45, 0.28]]) {
      const l = meshBox(0.1, 0.6, 0.1, 0x4a3421); l.position.set(x, 0.3, z); legG.push(l);
    }
    const g = group(top, ...legG); g.userData.collide = { w: 1.1, d: 0.7 }; return g;
  },
  chair(c = 0x5a3f28) {
    const seat = meshBox(0.42, 0.08, 0.42, c); seat.position.y = 0.44;
    const back = meshBox(0.42, 0.5, 0.08, c); back.position.set(0, 0.7, -0.17);
    const g = group(seat, back); g.userData.collide = { w: 0.42, d: 0.42 }; return g;
  },
  bed(c = 0x7d8fb0) {
    const base = meshBox(1.4, 0.3, 2.0, 0x5a4632); base.position.y = 0.15;
    const mattr = meshBox(1.3, 0.22, 1.9, 0xf0ece0); mattr.position.y = 0.4;
    const blanket = meshBox(1.32, 0.14, 1.2, c); blanket.position.set(0, 0.5, 0.35);
    const p1 = meshBox(0.55, 0.14, 0.4, 0xffffff); p1.position.set(-0.35, 0.52, -0.75);
    const p2 = meshBox(0.55, 0.14, 0.4, 0xffffff); p2.position.set(0.35, 0.52, -0.75);
    const g = group(base, mattr, blanket, p1, p2); g.userData.collide = { w: 1.4, d: 2.0 }; return g;
  },
  sofa(c = 0x8a4a3a) {
    const base = meshBox(1.7, 0.4, 0.8, c); base.position.y = 0.25;
    const back = meshBox(1.7, 0.5, 0.22, c); back.position.set(0, 0.55, -0.3);
    const a1 = meshBox(0.22, 0.5, 0.8, c); a1.position.set(-0.74, 0.45, 0);
    const a2 = meshBox(0.22, 0.5, 0.8, c); a2.position.set(0.74, 0.45, 0);
    const g = group(base, back, a1, a2); g.userData.collide = { w: 1.7, d: 0.85 }; return g;
  },
  cabinet(c = 0x4a3826) {
    const body = meshBox(0.9, 1.4, 0.5, c); body.position.y = 0.7;
    const d1 = meshBox(0.02, 1.1, 0.42, 0x2c2015); d1.position.set(0.46, 0.7, 0);
    const g = group(body, d1); g.userData.collide = { w: 0.9, d: 0.5 }; return g;
  },
  fridge(c = 0xdfe3e6) {
    const body = meshBox(0.8, 1.7, 0.7, c); body.position.y = 0.85;
    const g = group(body); g.userData.collide = { w: 0.8, d: 0.7 }; return g;
  },
  counter(c = 0xb8b8bd) {
    const body = meshBox(2.0, 0.9, 0.7, c); body.position.y = 0.45;
    const top = meshBox(2.05, 0.08, 0.75, 0x8a8a8f); top.position.y = 0.9;
    const g = group(body, top); g.userData.collide = { w: 2.0, d: 0.7 }; return g;
  },
  stove(c = 0x3a3a3f) {
    const body = meshBox(0.9, 0.9, 0.7, c); body.position.y = 0.45;
    for (const [x, z] of [[-0.2, -0.15], [0.2, -0.15], [-0.2, 0.15], [0.2, 0.15]]) {
      const b = meshCyl(0.09, 0.09, 0.04, 0x111114, 10); b.position.set(x, 0.92, z); body.add(b);
    }
    const g = group(body); g.userData.collide = { w: 0.9, d: 0.7 }; return g;
  },
  plant(c = 0x2f7d3a) {
    const pot = meshCyl(0.22, 0.16, 0.3, 0xb5613b, 10); pot.position.y = 0.15;
    const leaves = meshCyl(0.05, 0.4, 0.7, c, 8); leaves.position.y = 0.6;
    const g = group(pot, leaves); g.userData.collide = { w: 0.44, d: 0.44 }; return g;
  },
  rug(c = 0x9c3b2e) {
    const r = meshBox(2.2, 0.03, 1.6, c); r.position.y = 0.02; r.receiveShadow = true; r.castShadow = false;
    return group(r); // без коллизии
  },
  tv(c = 0x14141a) {
    const stand = meshBox(1.2, 0.4, 0.4, 0x3a2a1c); stand.position.y = 0.2;
    const screen = meshBox(1.1, 0.66, 0.08, c, { emissive: 0x223355, emissiveIntensity: 0.4 }); screen.position.set(0, 0.75, 0);
    const g = group(stand, screen); g.userData.collide = { w: 1.2, d: 0.4 }; return g;
  },
  shelf(c = 0x5a4028) {
    const body = meshBox(1.2, 1.8, 0.35, c); body.position.y = 0.9;
    for (let i = 0; i < 3; i++) {
      const s = meshBox(1.15, 0.05, 0.32, 0x3a2a1a); s.position.set(0, 0.5 + i * 0.5, 0); body.add(s);
    }
    const g = group(body); g.userData.collide = { w: 1.2, d: 0.35 }; return g;
  },
  displayCase(c = 0x9fd8e8) {
    const base = meshBox(0.9, 0.9, 0.9, 0x2a2a30); base.position.y = 0.45;
    const glass = meshBox(0.86, 0.7, 0.86, c, { opacity: 0.28 }); glass.position.y = 1.2;
    const g = group(base, glass); g.userData.collide = { w: 0.9, d: 0.9 }; return g;
  },
  pedestal(c = 0xe8e2d0) {
    const p = meshCyl(0.3, 0.36, 1.0, c, 16); p.position.y = 0.5;
    const g = group(p); g.userData.collide = { w: 0.7, d: 0.7 }; return g;
  },
  barrel(c = 0x6a3f22) {
    const b = meshCyl(0.35, 0.42, 0.9, c, 14); b.position.y = 0.45;
    const g = group(b); g.userData.collide = { w: 0.8, d: 0.8 }; return g;
  },
  crate(c = 0x8a5a30) {
    const b = meshBox(0.7, 0.7, 0.7, c); b.position.y = 0.35;
    const g = group(b); g.userData.collide = { w: 0.7, d: 0.7 }; return g;
  },
  fountain(c = 0xbfc6cc) {
    const base = meshCyl(0.9, 1.0, 0.4, c, 20); base.position.y = 0.2;
    const water = meshCyl(0.8, 0.8, 0.06, 0x4aa6c8, 20, { opacity: 0.7 }); water.position.y = 0.38;
    const col = meshCyl(0.12, 0.14, 0.7, c, 12); col.position.y = 0.7;
    const g = group(base, water, col); g.userData.collide = { w: 2.0, d: 2.0 }; return g;
  },
};

export function makeProp(type, color) {
  const fn = props[type] || props.crate;
  const g = fn(color);
  g.userData.propType = type;
  return g;
}

// Мелкий блестящий предмет-лут (значок над землёй).
export function makeLootMesh(kind, big) {
  const colors = {
    money: 0x3fae5a, coin: 0xf4c94a, watch: 0xe8e8ee, jewelry: 0x8fd0ff,
    painting: 0xc98a4a, phone: 0x222228, wine: 0x7d1f38, bag: 0x9a4a2a,
    statue: 0xd8cba0, mask: 0xe6c15a, camera: 0x2a2a30, antique: 0xb08a4a,
    key: 0xf4c94a, main: 0xffd24a,
  };
  const c = colors[kind] ?? 0xffd24a;
  const g = new THREE.Group();
  let body;
  if (kind === 'painting') { body = meshBox(0.5, 0.4, 0.06, c); body.position.y = 0.9; }
  else if (kind === 'wine') { body = meshCyl(0.06, 0.09, 0.34, c, 10); body.position.y = 0.5; }
  else if (kind === 'statue') { body = meshCyl(0.06, 0.12, 0.4, c, 8); body.position.y = 0.55; }
  else if (kind === 'bag') { body = meshBox(0.3, 0.34, 0.16, c); body.position.y = 0.5; }
  else if (kind === 'key') { body = meshBox(0.18, 0.05, 0.06, c); body.position.y = 0.55; }
  else { body = meshBox(0.24, 0.24, 0.24, c); body.position.y = 0.5; }
  body.material = mat(c, { emissive: c, emissiveIntensity: big ? 0.5 : 0.28 });
  g.add(body);
  g.userData.spin = body;
  return g;
}

// Персонаж (капсула-человечек), возвращает Group + части для анимации.
export function makeCharacter(bodyColor = 0x2b3a67, headColor = 0xe8b98f, hat = null) {
  const g = new THREE.Group();
  const legs = meshBox(0.34, 0.5, 0.26, 0x24324f); legs.position.y = 0.25; g.add(legs);
  const torso = meshBox(0.42, 0.55, 0.3, bodyColor); torso.position.y = 0.78; g.add(torso);
  const head = meshCyl(0.19, 0.19, 0.28, headColor, 14); head.position.y = 1.22; g.add(head);
  if (hat != null) { const h = meshCyl(0.2, 0.22, 0.14, hat, 14); h.position.y = 1.4; g.add(h); }
  // Индикатор направления взгляда (нос-клин).
  const nose = meshBox(0.08, 0.08, 0.14, 0x000000, { opacity: 0.001 }); nose.position.set(0, 1.22, 0.19); g.add(nose);
  g.userData.head = head; g.userData.torso = torso; g.userData.legs = legs;
  g.userData.collide = { w: 0.42, d: 0.34 };
  return g;
}
