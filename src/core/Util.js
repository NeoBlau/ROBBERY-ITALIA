// Util.js — общие математические и вспомогательные функции.
// Никаких зависимостей: чистые функции, чтобы их можно было переиспользовать
// во всех системах игры.

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
export const smoothstep = (t) => t * t * (3 - 2 * t);
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));

export const dist2 = (ax, az, bx, bz) => {
  const dx = ax - bx, dz = az - bz;
  return dx * dx + dz * dz;
};
export const dist = (ax, az, bx, bz) => Math.sqrt(dist2(ax, az, bx, bz));

// Нормализация угла в диапазон (-PI, PI]
export const wrapAngle = (a) => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a <= -Math.PI) a += Math.PI * 2;
  return a;
};
export const angleTo = (fromX, fromZ, toX, toZ) => Math.atan2(toX - fromX, toZ - fromZ);
export const angleDiff = (a, b) => Math.abs(wrapAngle(a - b));

export const approach = (cur, target, maxDelta) => {
  if (cur < target) return Math.min(cur + maxDelta, target);
  if (cur > target) return Math.max(cur - maxDelta, target);
  return target;
};

// Детерминированный ГПСЧ (mulberry32) — для повторяемого поведения.
export function makeRng(seed = 1) {
  let s = seed >>> 0;
  return function rng() {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const randRange = (rng, a, b) => a + (b - a) * rng();
export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length) % arr.length];

// Форматирование времени mm:ss
export function formatTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const formatMoney = (n) => '€' + Math.round(n).toLocaleString('it-IT');

// Простая шина событий.
export class EventBus {
  constructor() { this.map = new Map(); }
  on(type, fn) {
    if (!this.map.has(type)) this.map.set(type, new Set());
    this.map.get(type).add(fn);
    return () => this.off(type, fn);
  }
  off(type, fn) { this.map.get(type)?.delete(fn); }
  emit(type, payload) {
    const set = this.map.get(type);
    if (set) for (const fn of [...set]) fn(payload);
  }
  clear() { this.map.clear(); }
}

// Пересечение отрезка (p->q) с осепараллельным прямоугольником (AABB).
// Возвращает true, если отрезок пересекает прямоугольник — используется для
// проверки линии видимости (стена перекрывает обзор).
export function segIntersectsAABB(px, pz, qx, qz, minX, minZ, maxX, maxZ) {
  // Лианг-Барски для отрезка против AABB.
  let t0 = 0, t1 = 1;
  const dx = qx - px, dz = qz - pz;
  const clip = (p, q) => {
    if (p === 0) return q >= 0; // параллельно и внутри?
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
    else { if (r < t0) return false; if (r < t1) t1 = r; }
    return true;
  };
  if (clip(-dx, px - minX) && clip(dx, maxX - px) &&
      clip(-dz, pz - minZ) && clip(dz, maxZ - pz)) {
    return t0 <= t1 && t1 >= 0 && t0 <= 1;
  }
  return false;
}
